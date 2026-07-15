use std::sync::{
  atomic::{AtomicBool, Ordering},
  Arc, Mutex,
};

use futures_util::FutureExt;
use reqwest::StatusCode;
use rust_socketio::asynchronous::{Client, ClientBuilder};
use rust_socketio::{Payload, TransportType};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};

use crate::models::{CommandError, CompanionConnectResponse, CompanionEvent, DiscoveryInfo, PlaybackCommand};

pub const CIDER_EVENT: &str = "cider://event";
const CIDER_BASE_URL: &str = "http://127.0.0.1:10767";
const KEYRING_SERVICE: &str = "io.github.lgg.ytm-desktop-widget";
const KEYRING_ACCOUNT: &str = "cider-api-token-127.0.0.1-10767";

#[derive(Default)]
struct SocketLifecycle {
  alive: Option<Arc<AtomicBool>>,
}

impl SocketLifecycle {
  fn start(&mut self) -> Arc<AtomicBool> {
    let alive = Arc::new(AtomicBool::new(true));
    self.alive = Some(Arc::clone(&alive));
    alive
  }

  fn can_reuse(&self, has_socket: bool, has_cached_state: bool) -> bool {
    has_socket
      && has_cached_state
      && self
        .alive
        .as_ref()
        .is_some_and(|alive| alive.load(Ordering::SeqCst))
  }

  fn invalidate(&mut self) {
    if let Some(alive) = self.alive.take() {
      alive.store(false, Ordering::SeqCst);
    }
  }

  fn mark_closed(alive: &AtomicBool) -> bool {
    alive.swap(false, Ordering::SeqCst)
  }
}

#[derive(Default)]
pub struct CiderManager {
  client: reqwest::Client,
  socket: Option<Client>,
  socket_lifecycle: SocketLifecycle,
  latest_state: Arc<Mutex<Option<Value>>>,
}

impl CiderManager {
  pub async fn discover(&self) -> DiscoveryInfo {
    let response = self.client.get(format!("{CIDER_BASE_URL}/api/v1/playback/active")).send().await;
    let available = response.is_ok();
    DiscoveryInfo {
      available,
      api_versions: vec!["Cider API v1".to_string()],
      supports_realtime: true,
      supports_seek: true,
      using_browser_bridge: false,
      detail: Some(if available {
        "Cider local API is available on 127.0.0.1:10767.".to_string()
      } else {
        "Waiting for Cider WebSockets on 127.0.0.1:10767.".to_string()
      }),
      diagnostic: None,
    }
  }

  pub async fn connect(&mut self, app: &AppHandle, token: &str) -> Result<CompanionConnectResponse, CommandError> {
    let cached_state = self.latest_state.lock().expect("Cider state poisoned").clone();
    if self.socket_lifecycle.can_reuse(self.socket.is_some(), cached_state.is_some()) {
      return Ok(CompanionConnectResponse { initial_state: cached_state });
    }

    self.disconnect().await;
    let initial_state = fetch_now_playing(&self.client, token).await?;
    *self.latest_state.lock().expect("Cider state poisoned") = Some(initial_state.clone());

    let state = Arc::clone(&self.latest_state);
    let state_app = app.clone();
    let error_app = app.clone();
    let close_app = app.clone();
    let socket_alive = self.socket_lifecycle.start();
    let error_alive = Arc::clone(&socket_alive);
    let close_alive = Arc::clone(&socket_alive);
    let socket_result = ClientBuilder::new(CIDER_BASE_URL)
      .transport_type(TransportType::Websocket)
      .on("API:Playback", move |payload, _| {
        let state = Arc::clone(&state);
        let app = state_app.clone();
        async move {
          if let Some(event) = payload_to_json(payload) {
            let next = {
              let mut guard = state.lock().expect("Cider state poisoned");
              let next = apply_playback_event(guard.as_ref(), &event);
              *guard = Some(next.clone());
              next
            };
            emit(&app, CompanionEvent::State { state: next });
          }
        }.boxed()
      })
      .on("error", move |payload, _| {
        let app = error_app.clone();
        let alive = Arc::clone(&error_alive);
        async move {
          if alive.load(Ordering::SeqCst) {
            emit(&app, CompanionEvent::Status { status: "socket_error".to_string(), detail: Some(payload_to_string(payload)), diagnostic: None });
          }
        }.boxed()
      })
      .on("close", move |payload, _| {
        let app = close_app.clone();
        let alive = Arc::clone(&close_alive);
        async move {
          if SocketLifecycle::mark_closed(&alive) {
            emit(&app, CompanionEvent::Status { status: "socket_closed".to_string(), detail: Some(payload_to_string(payload)), diagnostic: None });
          }
        }.boxed()
      })
      .connect()
      .await;
    let socket = match socket_result {
      Ok(socket) => socket,
      Err(_) => {
        self.socket_lifecycle.invalidate();
        return Err(CommandError::new("network", "Unable to connect to Cider WebSockets on 127.0.0.1:10767."));
      }
    };
    self.socket = Some(socket);
    emit(app, CompanionEvent::Status { status: "socket_open".to_string(), detail: None, diagnostic: None });
    Ok(CompanionConnectResponse { initial_state: Some(initial_state) })
  }

  pub async fn disconnect(&mut self) {
    self.socket_lifecycle.invalidate();
    if let Some(socket) = self.socket.take() {
      let _ = socket.disconnect().await;
    }
    *self.latest_state.lock().expect("Cider state poisoned") = None;
  }

  pub async fn send_command(&self, token: &str, command: &PlaybackCommand) -> Result<(), CommandError> {
    let Some((path, body)) = cider_command(command) else { return Ok(()); };
    let mut request = self.client.post(format!("{CIDER_BASE_URL}/api/v1/{path}")).header("apptoken", token);
    if let Some(body) = body { request = request.json(&body); }
    let response = request.send().await.map_err(|_| CommandError::new("not_running", "Cider local API is not running."))?;
    validate_response(response.status())
  }
}

pub fn has_token() -> Result<bool, CommandError> { Ok(load_token()?.is_some()) }

pub fn load_token() -> Result<Option<String>, CommandError> {
  match token_entry()?.get_password() {
    Ok(token) if !token.trim().is_empty() => Ok(Some(token)),
    Ok(_) | Err(keyring::Error::NoEntry) => Ok(None),
    Err(_) => Err(credential_error("read")),
  }
}

pub async fn store_token(token: &str) -> Result<(), CommandError> {
  let token = token.trim();
  if token.is_empty() || token.len() > 4096 { return Err(CommandError::new("auth_required", "Enter a valid Cider application token.")); }
  let client = reqwest::Client::new();
  fetch_now_playing(&client, token).await?;
  let entry = token_entry()?;
  entry.set_password(token).map_err(|_| credential_error("store"))?;
  if entry.get_password().map_err(|_| credential_error("verify"))? != token {
    let _ = entry.delete_credential();
    return Err(credential_error("verify"));
  }
  Ok(())
}

pub fn clear_token() -> Result<(), CommandError> {
  match token_entry()?.delete_credential() {
    Ok(_) | Err(keyring::Error::NoEntry) => Ok(()),
    Err(_) => Err(credential_error("delete")),
  }
}

fn token_entry() -> Result<keyring::Entry, CommandError> {
  keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|_| credential_error("open"))
}

fn credential_error(action: &str) -> CommandError {
  CommandError::new("credential_storage", format!("Windows Credential Manager could not {action} the Cider token."))
}

async fn fetch_now_playing(client: &reqwest::Client, token: &str) -> Result<Value, CommandError> {
  let response = client.get(format!("{CIDER_BASE_URL}/api/v1/playback/now-playing")).header("apptoken", token).send().await
    .map_err(|_| CommandError::new("not_running", "Cider local API is not running."))?;
  validate_response(response.status())?;
  let body = response.json::<Value>().await.map_err(|_| CommandError::new("api_unavailable", "Cider returned invalid playback data."))?;
  Ok(map_now_playing(&body))
}

fn validate_response(status: StatusCode) -> Result<(), CommandError> {
  if status.is_success() { Ok(()) }
  else if status == StatusCode::UNAUTHORIZED || status == StatusCode::FORBIDDEN { Err(CommandError::auth_required()) }
  else { Err(CommandError::new("api_unavailable", format!("Cider API returned HTTP {}.", status.as_u16()))) }
}

fn bounded(value: Option<&str>) -> String { value.unwrap_or_default().chars().take(2048).collect() }

fn map_now_playing(value: &Value) -> Value {
  let info = value.get("info").unwrap_or(value);
  let id = bounded(info.pointer("/playParams/id").and_then(Value::as_str));
  let title = bounded(info.get("name").and_then(Value::as_str));
  let artist = bounded(info.get("artistName").and_then(Value::as_str));
  let album = bounded(info.get("albumName").and_then(Value::as_str));
  let duration = info.get("durationInMillis").and_then(Value::as_f64).unwrap_or(0.0).max(0.0) / 1000.0;
  let elapsed = info.get("currentPlaybackTime").and_then(Value::as_f64).unwrap_or(0.0).clamp(0.0, duration.max(0.0));
  let artwork = info.pointer("/artwork/url").and_then(Value::as_str).map(|url| url.replace("{w}", "1024").replace("{h}", "1024"));
  let is_playing = info.get("isPlaying").and_then(Value::as_bool).unwrap_or(false);
  json!({
    "capabilities": { "canPlayPause": true, "canGoPrevious": true, "canGoNext": true, "canSeek": duration > 0.0, "canMute": false, "canRate": true },
    "player": { "trackState": if is_playing { 1 } else { 0 }, "videoProgress": elapsed, "volume": 100, "adPlaying": false },
    "video": { "id": format!("cider:{id}"), "title": title, "author": artist, "album": album, "likeStatus": null, "thumbnails": artwork.map(|url| json!([{"url": url, "width": 1024, "height": 1024}])).unwrap_or_else(|| json!([])), "durationSeconds": duration, "isLive": false, "metadataFilled": !id.is_empty() }
  })
}

fn apply_playback_event(previous: Option<&Value>, event: &Value) -> Value {
  let kind = event.get("type").and_then(Value::as_str).unwrap_or_default();
  let data = event.get("data").unwrap_or(&Value::Null);
  if kind.contains("nowPlayingItemDidChange") || kind.contains("nowPlayingStatusDidChange") { return map_now_playing(data); }
  let mut next = previous.cloned().unwrap_or_else(|| map_now_playing(&json!({})));
  if kind.contains("playbackTimeDidChange") {
    if let Some(value) = data.get("currentPlaybackTime").and_then(Value::as_f64) { next["player"]["videoProgress"] = json!(value.max(0.0)); }
    if let Some(value) = data.get("currentPlaybackDuration").and_then(Value::as_f64) { next["video"]["durationSeconds"] = json!(value.max(0.0)); }
    if let Some(value) = data.get("isPlaying") { next["player"]["trackState"] = json!(if value.as_bool().unwrap_or_else(|| value.as_i64() == Some(1)) { 1 } else { 0 }); }
  } else if kind.contains("playbackStateDidChange") {
    next["player"]["trackState"] = json!(if data.get("state").and_then(Value::as_str) == Some("playing") { 1 } else { 0 });
  }
  next
}

fn cider_command(command: &PlaybackCommand) -> Option<(&'static str, Option<Value>)> {
  match command {
    PlaybackCommand::PlayPause => Some(("playback/playpause", None)),
    PlaybackCommand::Play => Some(("playback/play", None)),
    PlaybackCommand::Pause => Some(("playback/pause", None)),
    PlaybackCommand::Next => Some(("playback/next", None)),
    PlaybackCommand::Previous => Some(("playback/previous", None)),
    PlaybackCommand::SeekTo { seconds } => Some(("playback/seek", Some(json!({"position": if seconds.is_finite() { seconds.max(0.0) } else { 0.0 }})))),
    PlaybackCommand::ToggleLike => Some(("playback/set-rating", Some(json!({"rating": 1})))),
    PlaybackCommand::ToggleDislike => Some(("playback/set-rating", Some(json!({"rating": -1})))),
    PlaybackCommand::Mute | PlaybackCommand::Unmute => None,
  }
}

fn emit(app: &AppHandle, event: CompanionEvent) { let _ = app.emit(CIDER_EVENT, event); }

#[allow(deprecated)]
fn payload_to_json(payload: Payload) -> Option<Value> { match payload { Payload::Text(values) => values.into_iter().next(), Payload::String(text) => serde_json::from_str(&text).ok(), Payload::Binary(bytes) => serde_json::from_slice(&bytes).ok() } }
#[allow(deprecated)]
fn payload_to_string(payload: Payload) -> String { match payload { Payload::Text(values) => values.into_iter().next().map(|v| v.to_string()).unwrap_or_else(|| "Cider socket error".to_string()), Payload::String(text) => text, Payload::Binary(bytes) => format!("{} bytes", bytes.len()) } }

#[cfg(test)]
mod tests {
  use super::{cider_command, map_now_playing, SocketLifecycle};
  use crate::models::PlaybackCommand;
  use serde_json::json;
  use std::sync::atomic::Ordering;

  #[test]
  fn maps_cider_now_playing_into_the_shared_playback_contract() {
    let state = map_now_playing(&json!({"info":{"playParams":{"id":"track-1"},"name":"Title","artistName":"Artist","albumName":"Album","durationInMillis":180000,"currentPlaybackTime":12.5,"artwork":{"url":"https://example.test/{w}x{h}.jpg"}}}));
    assert_eq!(state["video"]["id"], "cider:track-1");
    assert_eq!(state["video"]["durationSeconds"], 180.0);
    assert_eq!(state["player"]["videoProgress"], 12.5);
    assert_eq!(state["video"]["thumbnails"][0]["url"], "https://example.test/1024x1024.jpg");
  }
  #[test]
  fn maps_only_supported_cider_commands_to_local_api_requests() {
    assert_eq!(cider_command(&PlaybackCommand::PlayPause), Some(("playback/playpause", None)));
    assert_eq!(cider_command(&PlaybackCommand::Next), Some(("playback/next", None)));
    assert_eq!(cider_command(&PlaybackCommand::Mute), None);
  }

  #[test]
  fn reuses_one_live_socket_across_main_and_settings_windows() {
    let mut lifecycle = SocketLifecycle::default();
    let alive = lifecycle.start();

    assert!(lifecycle.can_reuse(true, true));
    assert!(alive.load(Ordering::SeqCst));
  }

  #[test]
  fn intentional_disconnect_does_not_publish_a_socket_closed_event() {
    let mut lifecycle = SocketLifecycle::default();
    let alive = lifecycle.start();

    lifecycle.invalidate();

    assert!(!SocketLifecycle::mark_closed(&alive));
    assert!(!lifecycle.can_reuse(true, true));
  }
}
