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
const APP_VERSION: &str = "1.0.0";
const KEYRING_SERVICE: &str = "io.github.lgg.ytm-desktop-widget";

#[derive(Debug, thiserror::Error)]
pub enum CompanionError {
  #[error("Companion authorization is required.")]
  AuthRequired,
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
}

impl CompanionManager {
  pub async fn discover(&self, settings: &ConnectionSettings) -> DiscoveryInfo {
    let url = format!("{}/metadata", base_url(settings));
    match self.client.get(url).send().await {
      Ok(response) if response.status().is_success() => {
        let body = response.json::<Value>().await.unwrap_or_else(|_| Value::Null);
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

    let socket = ClientBuilder::new(base_url(settings))
      .namespace("/api/v1/realtime")
      .auth(json!({ "token": token }))
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
    Ok(Some(initial_state))
  }

  pub async fn disconnect(&mut self) -> Result<(), CompanionError> {
    if let Some(socket) = self.socket.take() {
      socket
        .disconnect()
        .await
        .map_err(|error| CompanionError::Unknown(error.to_string()))?;
    }

    Ok(())
  }

  pub async fn request_auth_code(
    &self,
    settings: &ConnectionSettings,
  ) -> Result<AuthCodeResponse, CompanionError> {
    let response = self
      .client
      .post(format!("{}/api/v1/auth/requestcode", base_url(settings)))
      .json(&json!({
        "appId": APP_ID,
        "appName": APP_NAME,
        "appVersion": APP_VERSION,
      }))
      .send()
      .await
      .map_err(|_| CompanionError::NotRunning)?;

    validate_status(response.status())?;
    let body = response
      .json::<Value>()
      .await
      .map_err(|error| CompanionError::Unknown(error.to_string()))?;
    let code = extract_token_like_value(&body, &["code"]).ok_or_else(|| {
      CompanionError::Unknown("Companion Server did not return an auth code.".to_string())
    })?;

    Ok(AuthCodeResponse { code })
  }

  pub async fn complete_auth(
    &self,
    settings: &ConnectionSettings,
    code: &str,
  ) -> Result<String, CompanionError> {
    let response = self
      .client
      .post(format!("{}/api/v1/auth/request", base_url(settings)))
      .json(&json!({
        "appId": APP_ID,
        "code": code,
      }))
      .send()
      .await
      .map_err(|_| CompanionError::NotRunning)?;

    validate_status(response.status())?;
    let body = response
      .json::<Value>()
      .await
      .map_err(|error| CompanionError::Unknown(error.to_string()))?;

    extract_token_like_value(&body, &["token", "authorization", "accessToken"]).ok_or_else(|| {
      CompanionError::Unknown("Companion Server did not return an auth token.".to_string())
    })
  }

  pub async fn send_command(
    &self,
    settings: &ConnectionSettings,
    token: &str,
    command: &PlaybackCommand,
  ) -> Result<(), CompanionError> {
    let response = self
      .client
      .post(format!("{}/api/v1/command", base_url(settings)))
      .header(AUTHORIZATION, token)
      .json(&command_request_body(command))
      .send()
      .await
      .map_err(|error| CompanionError::Network(error.to_string()))?;

    validate_status(response.status())
  }

  async fn fetch_state(
    &self,
    settings: &ConnectionSettings,
    token: &str,
  ) -> Result<Value, CompanionError> {
    let response = self
      .client
      .get(format!("{}/api/v1/state", base_url(settings)))
      .header(AUTHORIZATION, token)
      .send()
      .await
      .map_err(|_| CompanionError::NotRunning)?;

    validate_status(response.status())?;
    response
      .json::<Value>()
      .await
      .map_err(|error| CompanionError::Unknown(error.to_string()))
  }
}

pub fn load_token(settings: &ConnectionSettings) -> Result<Option<String>, CommandError> {
  let entry = keyring::Entry::new(KEYRING_SERVICE, &keyring_account(settings))?;
  match entry.get_password() {
    Ok(value) => Ok(Some(value)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(error) => Err(CommandError::from(error)),
  }
}

pub fn store_token(settings: &ConnectionSettings, token: &str) -> Result<(), CommandError> {
  let entry = keyring::Entry::new(KEYRING_SERVICE, &keyring_account(settings))?;
  entry.set_password(token)?;
  Ok(())
}

pub fn clear_token(settings: &ConnectionSettings) -> Result<(), CommandError> {
  let entry = keyring::Entry::new(KEYRING_SERVICE, &keyring_account(settings))?;
  match entry.delete_credential() {
    Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
    Err(error) => Err(CommandError::from(error)),
  }
}

fn emit_event(app: &AppHandle, event_name: &str, payload: CompanionEvent) {
  let _ = app.emit(event_name, payload);
}

fn base_url(settings: &ConnectionSettings) -> String {
  format!("http://{}:{}", settings.host, settings.port)
}

fn command_request_body(command: &PlaybackCommand) -> Value {
  match command {
    PlaybackCommand::PlayPause => json!({ "command": "playPause" }),
    PlaybackCommand::Play => json!({ "command": "play" }),
    PlaybackCommand::Pause => json!({ "command": "pause" }),
    PlaybackCommand::Next => json!({ "command": "next" }),
    PlaybackCommand::Previous => json!({ "command": "previous" }),
    PlaybackCommand::SeekTo { seconds } => json!({
      "command": "seekTo",
      "data": seconds.round() as i64,
    }),
  }
}

fn validate_status(status: StatusCode) -> Result<(), CompanionError> {
  match status {
    StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN => Err(CompanionError::AuthRequired),
    status if status.is_success() => Ok(()),
    StatusCode::SERVICE_UNAVAILABLE => Err(CompanionError::ApiUnavailable),
    status => Err(CompanionError::Unknown(format!("Companion API returned HTTP {}.", status))),
  }
}

fn keyring_account(settings: &ConnectionSettings) -> String {
  format!("companion-token-{}-{}", settings.host, settings.port)
}

fn extract_token_like_value(value: &Value, keys: &[&str]) -> Option<String> {
  match value {
    Value::String(content) => Some(content.to_string()),
    Value::Object(map) => keys
      .iter()
      .find_map(|key| map.get(*key).and_then(Value::as_str).map(ToOwned::to_owned)),
    _ => None,
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

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn app_id_matches_companion_v2_constraints() {
    assert!(APP_ID.len() >= 2);
    assert!(APP_ID.len() <= 32);
    assert!(APP_ID.chars().all(|character| character.is_ascii_lowercase() || character.is_ascii_digit()));
  }

  #[test]
  fn maps_basic_commands_to_v2_command_payloads() {
    assert_eq!(command_request_body(&PlaybackCommand::PlayPause), json!({ "command": "playPause" }));
    assert_eq!(command_request_body(&PlaybackCommand::Play), json!({ "command": "play" }));
    assert_eq!(command_request_body(&PlaybackCommand::Pause), json!({ "command": "pause" }));
    assert_eq!(command_request_body(&PlaybackCommand::Next), json!({ "command": "next" }));
    assert_eq!(command_request_body(&PlaybackCommand::Previous), json!({ "command": "previous" }));
  }

  #[test]
  fn maps_seek_to_v2_command_payload() {
    assert_eq!(
      command_request_body(&PlaybackCommand::SeekTo { seconds: 42.4 }),
      json!({ "command": "seekTo", "data": 42 })
    );
  }
}
