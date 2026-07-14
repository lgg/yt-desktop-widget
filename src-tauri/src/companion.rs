use std::sync::{Arc, Mutex};

use futures_util::FutureExt;
use reqwest::{header::AUTHORIZATION, StatusCode};
use rust_socketio::asynchronous::{Client, ClientBuilder};
use rust_socketio::{Payload, TransportType};
use serde::Serialize;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};

use crate::models::{CommandError, CompanionEvent, ConnectionSettings, DiscoveryInfo, PlaybackCommand};

const APP_ID: &str = "ytmdesktopwidget";
const APP_NAME: &str = "YTM Desktop Widget";
const APP_VERSION: &str = env!("CARGO_PKG_VERSION");
const KEYRING_SERVICE: &str = "io.github.lgg.ytm-desktop-widget";

#[derive(Debug, thiserror::Error)]
pub enum CompanionError {
  #[error("Companion authorization is required.")]
  AuthRequired,
  #[error(
    "YTMDesktop says Companion authorization requests are disabled. Enable authorization requests in YTMDesktop Companion settings, then retry."
  )]
  AuthorizationDisabled,
  #[error("YTMDesktop Companion Server is not running.")]
  NotRunning,
  #[error("Companion API is temporarily unavailable.")]
  ApiUnavailable,
  #[error("Network error: {0}")]
  Network(String),
  #[error("Unexpected error: {0}")]
  Unknown(String),
}

impl From<CompanionError> for CommandError {
  fn from(error: CompanionError) -> Self {
    match error {
      CompanionError::AuthRequired => CommandError::auth_required(),
      CompanionError::AuthorizationDisabled => {
        CommandError::new("authorization_disabled", error.to_string())
      }
      CompanionError::NotRunning => CommandError::new("not_running", error.to_string()),
      CompanionError::ApiUnavailable => CommandError::new("api_unavailable", error.to_string()),
      CompanionError::Network(message) => CommandError::new("network", message),
      CompanionError::Unknown(message) => CommandError::new("unknown", message),
    }
  }
}

#[derive(Debug, Clone, Serialize)]
pub struct AuthCodeResponse {
  pub code: String,
}

#[derive(Default)]
pub struct CompanionManager {
  client: reqwest::Client,
  latest_state: Arc<Mutex<Option<Value>>>,
  socket: Option<Client>,
  active_connection_key: Option<String>,
}

impl CompanionManager {
  pub async fn discover(&self, settings: &ConnectionSettings) -> DiscoveryInfo {
    let url = format!("{}/metadata", base_url(settings));
    match self.client.get(url).send().await {
      Ok(response) if response.status().is_success() => {
        let body = response.json::<Value>().await.unwrap_or(Value::Null);
        let api_versions = body
          .get("apiVersions")
          .and_then(Value::as_array)
          .map(|versions| {
            versions
              .iter()
              .filter_map(Value::as_str)
              .map(ToOwned::to_owned)
              .collect::<Vec<_>>()
          })
          .filter(|versions| !versions.is_empty())
          .unwrap_or_else(|| vec!["v1".to_string()]);

        DiscoveryInfo {
          available: true,
          api_versions,
          supports_realtime: true,
          supports_seek: true,
          using_browser_bridge: false,
          detail: Some("Using the official local Companion Server API.".to_string()),
        }
      }
      Ok(_) => DiscoveryInfo {
        available: false,
        api_versions: vec!["v1".to_string()],
        supports_realtime: true,
        supports_seek: true,
        using_browser_bridge: false,
        detail: Some(
          "Companion Server responded unexpectedly. Make sure YTMDesktop is fully running."
            .to_string(),
        ),
      },
      Err(_) => DiscoveryInfo {
        available: false,
        api_versions: vec!["v1".to_string()],
        supports_realtime: true,
        supports_seek: true,
        using_browser_bridge: false,
        detail: Some(format!(
          "Waiting for the YTMDesktop Companion Server on {}:{}.",
          settings.host, settings.port
        )),
      },
    }
  }

  pub async fn connect(
    &mut self,
    app: &AppHandle,
    settings: &ConnectionSettings,
    token: &str,
    event_name: &str,
  ) -> Result<Option<Value>, CompanionError> {
    let connection_key = connection_key(settings, token);
    if self.socket.is_some() && self.active_connection_key.as_deref() == Some(&connection_key) {
      if let Some(state) = self.latest_state.lock().expect("companion state poisoned").clone() {
        emit_event(
          app,
          event_name,
          CompanionEvent::Status {
            status: "socket_open".to_string(),
            detail: None,
          },
        );
        return Ok(Some(state));
      }
    }

    self.disconnect().await?;

    let initial_state = self.fetch_state(settings, token).await?;
    *self.latest_state.lock().expect("companion state poisoned") = Some(initial_state.clone());
    emit_event(
      app,
      event_name,
      CompanionEvent::Status {
        status: "socket_open".to_string(),
        detail: None,
      },
    );

    let latest_state = Arc::clone(&self.latest_state);
    let app_for_state = app.clone();
    let app_for_error = app.clone();
    let app_for_close = app.clone();
    let event_state_name = event_name.to_string();
    let event_error_name = event_name.to_string();
    let event_close_name = event_name.to_string();

    let socket = ClientBuilder::new(socketio_url(settings))
      .namespace("/api/v1/realtime")
      .auth(json!({ "token": companion_token_value(token) }))
      .transport_type(TransportType::Websocket)
      .on("state-update", move |payload, _| {
        let latest_state = Arc::clone(&latest_state);
        let app_for_state = app_for_state.clone();
        let event_state_name = event_state_name.clone();
        async move {
          if let Some(state) = payload_to_json(payload) {
            *latest_state.lock().expect("companion state poisoned") = Some(state.clone());
            emit_event(
              &app_for_state,
              &event_state_name,
              CompanionEvent::State { state },
            );
          }
        }
        .boxed()
      })
      .on("error", move |payload, _| {
        let app_for_error = app_for_error.clone();
        let event_error_name = event_error_name.clone();
        async move {
          emit_event(
            &app_for_error,
            &event_error_name,
            CompanionEvent::Status {
              status: "socket_error".to_string(),
              detail: Some(payload_to_string(payload)),
            },
          );
        }
        .boxed()
      })
      .on("close", move |payload, _| {
        let app_for_close = app_for_close.clone();
        let event_close_name = event_close_name.clone();
        async move {
          emit_event(
            &app_for_close,
            &event_close_name,
            CompanionEvent::Status {
              status: "socket_closed".to_string(),
              detail: Some(payload_to_string(payload)),
            },
          );
        }
        .boxed()
      })
      .connect()
      .await
      .map_err(|error| CompanionError::Network(error.to_string()))?;

    self.socket = Some(socket);
    self.active_connection_key = Some(connection_key);
    Ok(Some(initial_state))
  }

  pub async fn disconnect(&mut self) -> Result<(), CompanionError> {
    if let Some(socket) = self.socket.take() {
      socket
        .disconnect()
        .await
        .map_err(|error| CompanionError::Unknown(error.to_string()))?;
    }
    self.active_connection_key = None;
    *self.latest_state.lock().expect("companion state poisoned") = None;

    Ok(())
  }

  pub async fn send_command(
    &self,
    settings: &ConnectionSettings,
    token: &str,
    command: &PlaybackCommand,
  ) -> Result<(), CompanionError> {
    let url = format!("{}/api/v1/command", base_url(settings));
    let auth_values = authorization_header_values(token);
    for (index, auth_value) in auth_values.iter().enumerate() {
      let response = self
        .client
        .post(&url)
        .header(AUTHORIZATION, auth_value)
        .json(&command_request_body(command))
        .send()
        .await
        .map_err(|error| CompanionError::Network(error.to_string()))?;

      let status = response.status();
      let body = response
        .text()
        .await
        .map_err(|error| CompanionError::Network(error.to_string()))?;

      match validate_status_with_body(status, &body) {
        Ok(()) => return Ok(()),
        Err(CompanionError::AuthRequired) if index + 1 < auth_values.len() => continue,
        Err(error) => return Err(error),
      }
    }

    Err(CompanionError::AuthRequired)
  }

  async fn fetch_state(
    &self,
    settings: &ConnectionSettings,
    token: &str,
  ) -> Result<Value, CompanionError> {
    validate_token_with_client(&self.client, settings, token).await
  }
}

pub async fn request_auth_code(
  settings: &ConnectionSettings,
) -> Result<AuthCodeResponse, CompanionError> {
  request_auth_code_with_client(&reqwest::Client::new(), settings).await
}

pub async fn complete_auth(
  settings: &ConnectionSettings,
  code: &str,
) -> Result<String, CompanionError> {
  complete_auth_with_client(&reqwest::Client::new(), settings, code).await
}

pub async fn validate_token(
  settings: &ConnectionSettings,
  token: &str,
) -> Result<Value, CompanionError> {
  validate_token_with_client(&reqwest::Client::new(), settings, token).await
}

pub fn load_token(settings: &ConnectionSettings) -> Result<Option<String>, CommandError> {
  let entry = token_entry(settings)?;
  match entry.get_password() {
    Ok(value) => Ok(Some(value)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(error) => Err(credential_storage_error("read", error)),
  }
}

pub fn store_token(settings: &ConnectionSettings, token: &str) -> Result<(), CommandError> {
  let entry = token_entry(settings)?;
  entry
    .set_password(token)
    .map_err(|error| credential_storage_error("write", error))?;

  let persisted = match entry.get_password() {
    Ok(value) => value,
    Err(error) => {
      let _ = entry.delete_credential();
      return Err(credential_storage_error("verify", error));
    }
  };

  if let Err(error) = verify_persisted_token(token, &persisted) {
    let _ = entry.delete_credential();
    return Err(error);
  }

  Ok(())
}

pub fn clear_token(settings: &ConnectionSettings) -> Result<(), CommandError> {
  let entry = token_entry(settings)?;
  match entry.delete_credential() {
    Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
    Err(error) => Err(credential_storage_error("delete", error)),
  }
}

fn token_entry(settings: &ConnectionSettings) -> Result<keyring::Entry, CommandError> {
  keyring::Entry::new(KEYRING_SERVICE, &keyring_account(settings))
    .map_err(|error| credential_storage_error("open", error))
}

fn verify_persisted_token(expected: &str, persisted: &str) -> Result<(), CommandError> {
  if expected == persisted {
    return Ok(());
  }

  Err(CommandError::new(
    "credential_storage",
    "The OS credential store did not retain the Companion token exactly.",
  ))
}

fn credential_storage_error(action: &str, error: keyring::Error) -> CommandError {
  CommandError::new(
    "credential_storage",
    format!(
      "The OS credential store could not {} Companion authorization: {}",
      action, error
    ),
  )
}

fn emit_event(app: &AppHandle, event_name: &str, payload: CompanionEvent) {
  let _ = app.emit(event_name, payload);
}

fn base_url(settings: &ConnectionSettings) -> String {
  format!("http://{}:{}", settings.host, settings.port)
}

fn socketio_url(settings: &ConnectionSettings) -> String {
  base_url(settings)
}

fn connection_key(settings: &ConnectionSettings, token: &str) -> String {
  format!("{}|{}", base_url(settings), token)
}

fn request_code_body() -> Value {
  json!({
    "appId": APP_ID,
    "appName": APP_NAME,
    "appVersion": APP_VERSION,
  })
}

fn request_token_body(code: &str) -> Value {
  json!({
    "appId": APP_ID,
    "code": code,
  })
}

async fn request_auth_code_with_client(
  client: &reqwest::Client,
  settings: &ConnectionSettings,
) -> Result<AuthCodeResponse, CompanionError> {
  let response = client
    .post(format!("{}/api/v1/auth/requestcode", base_url(settings)))
    .json(&request_code_body())
    .send()
    .await
    .map_err(|_| CompanionError::NotRunning)?;

  let body = parse_json_response(response, "auth code request").await?;
  let code = extract_token_like_value(&body, &["code"]).ok_or_else(|| {
    CompanionError::Unknown("Companion Server did not return an auth code.".to_string())
  })?;

  Ok(AuthCodeResponse { code })
}

async fn complete_auth_with_client(
  client: &reqwest::Client,
  settings: &ConnectionSettings,
  code: &str,
) -> Result<String, CompanionError> {
  let response = client
    .post(format!("{}/api/v1/auth/request", base_url(settings)))
    .json(&request_token_body(code))
    .send()
    .await
    .map_err(|_| CompanionError::NotRunning)?;

  let body = parse_json_response(response, "auth token request").await?;

  extract_token_like_value(&body, &["token", "authorization", "accessToken"]).ok_or_else(|| {
    CompanionError::Unknown("Companion Server did not return an auth token.".to_string())
  })
}

async fn validate_token_with_client(
  client: &reqwest::Client,
  settings: &ConnectionSettings,
  token: &str,
) -> Result<Value, CompanionError> {
  let url = format!("{}/api/v1/state", base_url(settings));
  let auth_values = authorization_header_values(token);
  for (index, auth_value) in auth_values.iter().enumerate() {
    let response = client
      .get(&url)
      .header(AUTHORIZATION, auth_value)
      .send()
      .await
      .map_err(|_| CompanionError::NotRunning)?;

    let status = response.status();
    let body = response
      .text()
      .await
      .map_err(|error| CompanionError::Network(error.to_string()))?;

    match validate_status_with_body(status, &body) {
      Ok(()) => {
        return serde_json::from_str::<Value>(&body)
          .map_err(|error| CompanionError::Unknown(error.to_string()));
      }
      Err(CompanionError::AuthRequired) if index + 1 < auth_values.len() => continue,
      Err(error) => return Err(error),
    }
  }

  Err(CompanionError::AuthRequired)
}

fn command_request_body(command: &PlaybackCommand) -> Value {
  match command {
    PlaybackCommand::PlayPause => json!({ "command": "playPause" }),
    PlaybackCommand::Play => json!({ "command": "play" }),
    PlaybackCommand::Pause => json!({ "command": "pause" }),
    PlaybackCommand::Next => json!({ "command": "next" }),
    PlaybackCommand::Previous => json!({ "command": "previous" }),
    PlaybackCommand::Mute => json!({ "command": "mute" }),
    PlaybackCommand::Unmute => json!({ "command": "unmute" }),
    PlaybackCommand::ToggleLike => json!({ "command": "toggleLike" }),
    PlaybackCommand::ToggleDislike => json!({ "command": "toggleDislike" }),
    PlaybackCommand::SeekTo { seconds } => json!({
      "command": "seekTo",
      "data": sanitize_seek_seconds(*seconds),
    }),
  }
}

fn sanitize_seek_seconds(seconds: f64) -> i64 {
  if !seconds.is_finite() {
    return 0;
  }

  seconds.max(0.0).round() as i64
}

fn authorization_header_values(token: &str) -> Vec<String> {
  let trimmed = token.trim();
  if let Some(raw_token) = strip_bearer_prefix(trimmed) {
    return vec![trimmed.to_string(), raw_token.to_string()];
  }

  vec![trimmed.to_string(), format!("Bearer {}", trimmed)]
}

fn companion_token_value(token: &str) -> String {
  let trimmed = token.trim();
  strip_bearer_prefix(trimmed)
    .unwrap_or(trimmed)
    .trim()
    .to_string()
}

fn strip_bearer_prefix(value: &str) -> Option<&str> {
  if value.len() >= 7 && value[..7].eq_ignore_ascii_case("bearer ") {
    let raw_token = value[7..].trim();
    if !raw_token.is_empty() {
      return Some(raw_token);
    }
  }

  None
}

async fn parse_json_response(
  response: reqwest::Response,
  context: &str,
) -> Result<Value, CompanionError> {
  let status = response.status();
  let body = response
    .text()
    .await
    .map_err(|error| CompanionError::Network(error.to_string()))?;

  validate_status_with_body(status, &body)?;
  serde_json::from_str::<Value>(&body).map_err(|error| {
    CompanionError::Unknown(format!(
      "Companion {} returned invalid JSON: {}",
      context,
      error
    ))
  })
}

fn validate_status_with_body(status: StatusCode, body: &str) -> Result<(), CompanionError> {
  if status == StatusCode::FORBIDDEN && is_authorization_disabled_body(body) {
    return Err(CompanionError::AuthorizationDisabled);
  }

  match status {
    StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => Err(CompanionError::AuthRequired),
    status if status.is_success() => Ok(()),
    StatusCode::SERVICE_UNAVAILABLE => Err(CompanionError::ApiUnavailable),
    status => Err(CompanionError::Unknown(format!(
      "Companion API returned HTTP {}.",
      status
    ))),
  }
}

fn keyring_account(settings: &ConnectionSettings) -> String {
  format!("companion-token-{}-{}", settings.host, settings.port)
}

fn extract_token_like_value(value: &Value, keys: &[&str]) -> Option<String> {
  match value {
    Value::String(content) => normalize_extracted_value(content),
    Value::Number(number) => Some(number.to_string()),
    Value::Object(map) => keys
      .iter()
      .find_map(|key| map.get(*key).and_then(extract_scalar_value))
      .or_else(|| {
        map.values().find_map(|nested| match nested {
          Value::Object(_) | Value::Array(_) => extract_token_like_value(nested, keys),
          _ => None,
        })
      }),
    Value::Array(values) => values
      .iter()
      .find_map(|nested| extract_token_like_value(nested, keys)),
    _ => None,
  }
}

fn extract_scalar_value(value: &Value) -> Option<String> {
  match value {
    Value::String(content) => normalize_extracted_value(content),
    Value::Number(number) => Some(number.to_string()),
    _ => None,
  }
}

fn normalize_extracted_value(content: &str) -> Option<String> {
  let trimmed = content.trim();
  if trimmed.is_empty() {
    None
  } else {
    Some(trimmed.to_string())
  }
}

#[allow(deprecated)]
fn payload_to_json(payload: Payload) -> Option<Value> {
  match payload {
    Payload::Text(values) => values.into_iter().next(),
    Payload::String(text) => serde_json::from_str(&text).ok(),
    Payload::Binary(bytes) => serde_json::from_slice(&bytes).ok(),
  }
}

#[allow(deprecated)]
fn payload_to_string(payload: Payload) -> String {
  match payload {
    Payload::Text(values) => values
      .into_iter()
      .next()
      .map(|value| value.to_string())
      .unwrap_or_else(|| "Socket message".to_string()),
    Payload::String(text) => text,
    Payload::Binary(bytes) => format!("{} bytes", bytes.len()),
  }
}

fn is_authorization_disabled_body(body: &str) -> bool {
  let Ok(value) = serde_json::from_str::<Value>(body) else {
    return false;
  };

  value
    .get("code")
    .and_then(Value::as_str)
    .is_some_and(|code| code == "AUTHORIZATION_DISABLED")
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;
  use tokio::io::{AsyncReadExt, AsyncWriteExt};
  use tokio::net::TcpListener;

  #[test]
  fn app_id_matches_companion_v2_constraints() {
    assert!(APP_ID.len() >= 2);
    assert!(APP_ID.len() <= 32);
    assert!(APP_ID
      .chars()
      .all(|character| character.is_ascii_lowercase() || character.is_ascii_digit()));
  }

  #[test]
  fn maps_basic_commands_to_v2_command_payloads() {
    assert_eq!(
      command_request_body(&PlaybackCommand::PlayPause),
      json!({ "command": "playPause" })
    );
    assert_eq!(
      command_request_body(&PlaybackCommand::Play),
      json!({ "command": "play" })
    );
    assert_eq!(
      command_request_body(&PlaybackCommand::Pause),
      json!({ "command": "pause" })
    );
    assert_eq!(
      command_request_body(&PlaybackCommand::Next),
      json!({ "command": "next" })
    );
    assert_eq!(
      command_request_body(&PlaybackCommand::Previous),
      json!({ "command": "previous" })
    );
    assert_eq!(
      command_request_body(&PlaybackCommand::Mute),
      json!({ "command": "mute" })
    );
    assert_eq!(
      command_request_body(&PlaybackCommand::Unmute),
      json!({ "command": "unmute" })
    );
    assert_eq!(
      command_request_body(&PlaybackCommand::ToggleLike),
      json!({ "command": "toggleLike" })
    );
    assert_eq!(
      command_request_body(&PlaybackCommand::ToggleDislike),
      json!({ "command": "toggleDislike" })
    );
  }

  #[test]
  fn maps_seek_to_v2_command_payload() {
    assert_eq!(
      command_request_body(&PlaybackCommand::SeekTo { seconds: 42.4 }),
      json!({ "command": "seekTo", "data": 42 })
    );
  }

  #[test]
  fn clamps_invalid_seek_payloads_to_zero() {
    assert_eq!(
      command_request_body(&PlaybackCommand::SeekTo { seconds: -12.6 }),
      json!({ "command": "seekTo", "data": 0 })
    );
    assert_eq!(
      command_request_body(&PlaybackCommand::SeekTo { seconds: f64::NAN }),
      json!({ "command": "seekTo", "data": 0 })
    );
  }

  #[test]
  fn creates_connection_keys_from_endpoint_and_token() {
    let settings = ConnectionSettings {
      host: "127.0.0.1".to_string(),
      port: 9863,
      source_mode: "auto".to_string(),
    };

    assert_eq!(
      connection_key(&settings, "token"),
      "http://127.0.0.1:9863|token"
    );
  }

  #[test]
  fn builds_socketio_url_from_endpoint() {
    let settings = ConnectionSettings {
      host: "127.0.0.1".to_string(),
      port: 9863,
      source_mode: "auto".to_string(),
    };

    assert_eq!(socketio_url(&settings), "http://127.0.0.1:9863");
  }

  #[test]
  fn provides_plain_and_bearer_authorization_fallbacks() {
    assert_eq!(
      authorization_header_values(" token "),
      vec!["token".to_string(), "Bearer token".to_string()]
    );
    assert_eq!(
      authorization_header_values("Bearer token"),
      vec!["Bearer token".to_string(), "token".to_string()]
    );
    assert_eq!(companion_token_value("Bearer token"), "token".to_string());
    assert_eq!(companion_token_value(" token "), "token".to_string());
  }

  #[test]
  fn builds_companion_auth_request_bodies() {
    assert_eq!(
      request_code_body(),
      json!({
        "appId": APP_ID,
        "appName": APP_NAME,
        "appVersion": APP_VERSION,
      })
    );
    assert_eq!(
      request_token_body("2413"),
      json!({
        "appId": APP_ID,
        "code": "2413",
      })
    );
  }

  #[tokio::test]
  async fn validates_a_fresh_token_with_the_exact_raw_authorization_value() {
    let listener = TcpListener::bind(("127.0.0.1", 0))
      .await
      .expect("bind token validation server");
    let port = listener.local_addr().expect("read validation address").port();
    let server = tokio::spawn(async move {
      let (mut stream, _) = listener.accept().await.expect("accept validation request");
      let mut buffer = vec![0_u8; 4096];
      let read = stream.read(&mut buffer).await.expect("read validation request");
      let request = String::from_utf8_lossy(&buffer[..read]).to_ascii_lowercase();

      assert!(request.starts_with("get /api/v1/state "));
      assert!(request.contains("\r\nauthorization: fresh-token\r\n"));

      stream
        .write_all(
          b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 2\r\nConnection: close\r\n\r\n{}",
        )
        .await
        .expect("write validation response");
    });
    let settings = ConnectionSettings {
      host: "127.0.0.1".to_string(),
      port,
      source_mode: "auto".to_string(),
    };

    let state =
      validate_token_with_client(&reqwest::Client::new(), &settings, "fresh-token")
        .await
        .expect("validate fresh token");

    assert_eq!(state, json!({}));
    server.await.expect("join validation server");
  }

  #[test]
  fn extracts_nested_companion_auth_values() {
    let body = json!({ "data": { "attributes": { "token": "  secret-token  " } } });

    assert_eq!(
      extract_token_like_value(&body, &["token"]),
      Some("secret-token".to_string())
    );
  }

  #[cfg(target_os = "windows")]
  #[test]
  fn windows_keyring_round_trips_companion_sized_tokens() {
    let settings = ConnectionSettings {
      host: format!("keyring-probe-{}", std::process::id()),
      port: 9863,
      source_mode: "auto".to_string(),
    };
    let token = "a".repeat(512);
    let _ = clear_token(&settings);

    store_token(&settings, &token).expect("store Companion-sized probe token");
    let loaded = load_token(&settings).expect("load Companion-sized probe token");
    clear_token(&settings).expect("delete Companion-sized probe token");

    assert_eq!(loaded, Some(token));
  }

  #[test]
  fn rejects_a_keyring_readback_that_differs_from_the_issued_token() {
    let result = verify_persisted_token("issued-token", "different-token");

    assert!(result.is_err());
  }

  #[test]
  fn extracts_numeric_auth_codes_when_needed() {
    let body = json!({ "code": 2413 });

    assert_eq!(
      extract_token_like_value(&body, &["code"]),
      Some("2413".to_string())
    );
  }

  #[test]
  fn does_not_extract_unrelated_nested_strings() {
    let body = json!({ "error": { "message": "UNAUTHORIZED" } });

    assert_eq!(extract_token_like_value(&body, &["token"]), None);
  }

  #[test]
  fn classifies_disabled_authorization_requests_from_error_body() {
    let body = json!({
      "statusCode": 403,
      "code": "AUTHORIZATION_DISABLED",
      "error": "Forbidden",
      "message": "Authorization requests are disabled",
    })
    .to_string();

    let error = validate_status_with_body(StatusCode::FORBIDDEN, &body)
      .expect_err("authorization-disabled body should not be treated as generic auth_required");

    assert!(matches!(error, CompanionError::AuthorizationDisabled));
  }

  #[test]
  fn does_not_include_companion_response_bodies_in_errors() {
    let secret_marker = "super-secret-companion-token";

    let error = validate_status_with_body(
      StatusCode::BAD_REQUEST,
      &format!(r#"{{"token":"{}"}}"#, secret_marker),
    )
    .expect_err("non-success status should return an error");

    assert!(!error.to_string().contains(secret_marker));
  }
}
