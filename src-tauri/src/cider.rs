use std::{
  sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
  },
  time::Duration,
};

use futures_util::FutureExt;
use reqwest::StatusCode;
use rust_socketio::asynchronous::{Client, ClientBuilder};
use rust_socketio::{Payload, TransportType};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};
use tokio::{
  sync::{mpsc, oneshot},
  task::JoinHandle,
};

use crate::models::{CommandError, CompanionConnectResponse, CompanionEvent, DiscoveryInfo, PlaybackCommand};

pub const CIDER_EVENT: &str = "cider://event";
const CIDER_BASE_URL: &str = "http://127.0.0.1:10767";
const CIDER_REQUEST_TIMEOUT: Duration = Duration::from_secs(5);
const CIDER_VOLUME_EPSILON: f64 = 0.0001;
const CIDER_SAFE_UNMUTE_FALLBACK: f64 = 0.25;
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

#[derive(Clone)]
struct CiderApi {
  client: reqwest::Client,
  base_url: Arc<str>,
}

impl CiderApi {
  fn production() -> Self {
    let client = reqwest::Client::builder()
      .timeout(CIDER_REQUEST_TIMEOUT)
      .build()
      .unwrap_or_else(|_| reqwest::Client::new());
    Self {
      client,
      base_url: Arc::from(CIDER_BASE_URL),
    }
  }

  #[cfg(test)]
  fn for_base_url(base_url: String) -> Self {
    Self::for_base_url_with_timeout(base_url, CIDER_REQUEST_TIMEOUT)
  }

  #[cfg(test)]
  fn for_base_url_with_timeout(base_url: String, timeout: Duration) -> Self {
    Self {
      client: reqwest::Client::builder()
        .timeout(timeout)
        .build()
        .unwrap_or_else(|_| reqwest::Client::new()),
      base_url: Arc::from(base_url.trim_end_matches('/')),
    }
  }

  fn url(&self, path: &str) -> String {
    format!("{}/api/v1/{path}", self.base_url)
  }

  async fn discover(&self) -> bool {
    self
      .client
      .get(self.url("playback/active"))
      .send()
      .await
      .is_ok_and(|response| response.status().is_success())
  }

  async fn fetch_now_playing(&self, token: &str) -> Result<Value, CommandError> {
    let response = self
      .client
      .get(self.url("playback/now-playing"))
      .header("apptoken", token)
      .send()
      .await
      .map_err(|_| CommandError::new("not_running", "Cider local API is not running."))?;
    validate_response(response.status())?;
    response
      .json::<Value>()
      .await
      .map_err(|_| CommandError::new("api_unavailable", "Cider returned invalid playback data."))
  }

  async fn fetch_volume(&self, token: &str) -> Result<f64, CommandError> {
    let response = self
      .client
      .get(self.url("playback/volume"))
      .header("apptoken", token)
      .send()
      .await
      .map_err(|_| CommandError::new("not_running", "Cider local API is not running."))?;
    validate_response(response.status())?;
    let body = response
      .json::<Value>()
      .await
      .map_err(|_| CommandError::new("api_unavailable", "Cider returned invalid volume data."))?;
    parse_volume_value(&body)
      .ok_or_else(|| CommandError::new("api_unavailable", "Cider returned invalid volume data."))
  }

  async fn post_volume(&self, token: &str, volume: f64) -> Result<(), CommandError> {
    let response = self
      .client
      .post(self.url("playback/volume"))
      .header("apptoken", token)
      .json(&json!({ "volume": volume }))
      .send()
      .await
      .map_err(|_| CommandError::new("not_running", "Cider local API is not running."))?;
    validate_response(response.status())
  }

  async fn post_command(
    &self,
    token: &str,
    path: &str,
    body: Option<Value>,
  ) -> Result<(), CommandError> {
    let mut request = self.client.post(self.url(path)).header("apptoken", token);
    if let Some(body) = body {
      request = request.json(&body);
    }
    let response = request
      .send()
      .await
      .map_err(|_| CommandError::new("not_running", "Cider local API is not running."))?;
    validate_response(response.status())
  }
}

#[derive(Default)]
struct CiderPlaybackCache {
  latest_state: Option<Value>,
  current_volume: Option<f64>,
  connection_last_nonzero_volume: Option<f64>,
  remembered_nonzero_volume: Option<f64>,
  volume_api_available: bool,
}

impl CiderPlaybackCache {
  fn begin_connection(&mut self, now_playing: &Value, volume: Option<f64>) -> Value {
    self.latest_state = None;
    self.current_volume = None;
    self.connection_last_nonzero_volume = None;
    self.volume_api_available = false;
    if let Some(volume) = volume.and_then(normalize_volume) {
      self.record_volume(volume);
    }
    let state = map_now_playing(
      now_playing,
      Some(self.display_volume()),
      self.volume_api_available,
    );
    self.latest_state = Some(state.clone());
    state
  }

  fn disconnect(&mut self) {
    self.latest_state = None;
    self.current_volume = None;
    self.connection_last_nonzero_volume = None;
    self.volume_api_available = false;
  }

  fn record_volume(&mut self, volume: f64) {
    self.current_volume = Some(volume);
    self.volume_api_available = true;
    if volume > CIDER_VOLUME_EPSILON {
      self.connection_last_nonzero_volume = Some(volume);
      self.remembered_nonzero_volume = Some(volume);
    }
  }

  fn apply_volume(&mut self, volume: f64) -> Option<Value> {
    let volume = normalize_volume(volume)?;
    self.record_volume(volume);
    let state = self
      .latest_state
      .get_or_insert_with(|| map_now_playing(&json!({}), Some(volume), true));
    state["player"]["volume"] = json!(volume_percentage(volume));
    state["capabilities"]["canMute"] = json!(true);
    Some(state.clone())
  }

  fn apply_event(&mut self, event: &Value) -> Option<Value> {
    let kind = event.get("type").and_then(Value::as_str).unwrap_or_default();
    let data = event.get("data").unwrap_or(&Value::Null);

    if kind == "playerStatus.volumeDidChange" {
      return parse_volume_value(data).and_then(|volume| self.apply_volume(volume));
    }

    if kind.contains("nowPlayingItemDidChange") || kind.contains("nowPlayingStatusDidChange") {
      let state = map_now_playing(
        data,
        Some(self.display_volume()),
        self.volume_api_available,
      );
      self.latest_state = Some(state.clone());
      return Some(state);
    }

    let state = self.latest_state.as_mut()?;
    if kind.contains("playbackTimeDidChange") {
      if let Some(value) = data.get("currentPlaybackTime").and_then(Value::as_f64) {
        state["player"]["videoProgress"] = json!(value.max(0.0));
      }
      if let Some(value) = data.get("currentPlaybackDuration").and_then(Value::as_f64) {
        state["video"]["durationSeconds"] = json!(value.max(0.0));
      }
      if let Some(value) = data.get("isPlaying") {
        state["player"]["trackState"] = json!(if value
          .as_bool()
          .unwrap_or_else(|| value.as_i64() == Some(1))
        {
          1
        } else {
          0
        });
      }
      return Some(state.clone());
    }
    if kind.contains("playbackStateDidChange") {
      state["player"]["trackState"] = json!(if data.get("state").and_then(Value::as_str)
        == Some("playing")
      {
        1
      } else {
        0
      });
      return Some(state.clone());
    }
    None
  }

  fn display_volume(&self) -> f64 {
    self
      .current_volume
      .or(self.connection_last_nonzero_volume)
      .or(self.remembered_nonzero_volume)
      .unwrap_or(CIDER_SAFE_UNMUTE_FALLBACK)
  }

  fn unmute_target(&self) -> f64 {
    self
      .connection_last_nonzero_volume
      .or(self.remembered_nonzero_volume)
      .filter(|volume| *volume > CIDER_VOLUME_EPSILON)
      .unwrap_or(CIDER_SAFE_UNMUTE_FALLBACK)
  }
}

struct CiderCommandRequest {
  token: String,
  command: PlaybackCommand,
  response: oneshot::Sender<Result<(), CommandError>>,
}

#[derive(Clone)]
pub struct CiderCommandClient {
  sender: mpsc::Sender<CiderCommandRequest>,
}

impl CiderCommandClient {
  pub async fn send(&self, token: String, command: PlaybackCommand) -> Result<(), CommandError> {
    let (response, receiver) = oneshot::channel();
    self
      .sender
      .send(CiderCommandRequest {
        token,
        command,
        response,
      })
      .await
      .map_err(|_| CommandError::new("api_unavailable", "Cider command worker is unavailable."))?;
    receiver
      .await
      .map_err(|_| CommandError::new("api_unavailable", "Cider command worker stopped."))?
  }
}

fn spawn_command_worker<F>(
  api: CiderApi,
  cache: Arc<Mutex<CiderPlaybackCache>>,
  publish: F,
) -> (CiderCommandClient, JoinHandle<()>)
where
  F: Fn(Value) + Send + 'static,
{
  let (sender, mut receiver) = mpsc::channel::<CiderCommandRequest>(16);
  let task = tokio::spawn(async move {
    while let Some(request) = receiver.recv().await {
      let result = execute_cider_command(&api, &cache, &request.token, &request.command).await;
      match result {
        Ok(Some(state)) => {
          publish(state);
          let _ = request.response.send(Ok(()));
        }
        Ok(None) => {
          let _ = request.response.send(Ok(()));
        }
        Err(error) => {
          let _ = request.response.send(Err(error));
        }
      }
    }
  });
  (CiderCommandClient { sender }, task)
}

async fn execute_cider_command(
  api: &CiderApi,
  cache: &Arc<Mutex<CiderPlaybackCache>>,
  token: &str,
  command: &PlaybackCommand,
) -> Result<Option<Value>, CommandError> {
  if matches!(command, PlaybackCommand::Mute | PlaybackCommand::Unmute) {
    let mut refreshed_state = None;
    let mut current_volume = cache.lock().expect("Cider state poisoned").current_volume;
    if current_volume.is_none() {
      let volume = api.fetch_volume(token).await?;
      let mut guard = cache.lock().expect("Cider state poisoned");
      refreshed_state = guard.apply_volume(volume);
      current_volume = guard.current_volume;
    }

    match command {
      PlaybackCommand::Mute if current_volume.is_some_and(|volume| volume <= CIDER_VOLUME_EPSILON) => {
        return Ok(refreshed_state);
      }
      PlaybackCommand::Unmute if current_volume.is_some_and(|volume| volume > CIDER_VOLUME_EPSILON) => {
        return Ok(refreshed_state);
      }
      PlaybackCommand::Mute => {
        api.post_volume(token, 0.0).await?;
        return Ok(cache.lock().expect("Cider state poisoned").apply_volume(0.0));
      }
      PlaybackCommand::Unmute => {
        let target = cache.lock().expect("Cider state poisoned").unmute_target();
        api.post_volume(token, target).await?;
        return Ok(cache.lock().expect("Cider state poisoned").apply_volume(target));
      }
      _ => {
        return Err(CommandError::new(
          "unknown",
          "Cider volume command routing changed unexpectedly.",
        ));
      }
    }
  }

  let (path, body) = cider_transport_command(command)?;
  api.post_command(token, path, body).await?;
  Ok(None)
}

pub struct CiderManager {
  api: CiderApi,
  socket: Option<Client>,
  socket_lifecycle: SocketLifecycle,
  cache: Arc<Mutex<CiderPlaybackCache>>,
  command_client: Option<CiderCommandClient>,
  command_task: Option<JoinHandle<()>>,
}

impl Default for CiderManager {
  fn default() -> Self {
    Self {
      api: CiderApi::production(),
      socket: None,
      socket_lifecycle: SocketLifecycle::default(),
      cache: Arc::new(Mutex::new(CiderPlaybackCache::default())),
      command_client: None,
      command_task: None,
    }
  }
}

impl CiderManager {
  pub async fn discover(&self) -> DiscoveryInfo {
    let available = self.api.discover().await;
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
    let (cached_state, volume_api_available) = {
      let cache = self.cache.lock().expect("Cider state poisoned");
      (cache.latest_state.clone(), cache.volume_api_available)
    };
    let reusable_transport = self.socket.is_some() && self.command_client.is_some();
    if self.socket_lifecycle.can_reuse(reusable_transport, cached_state.is_some()) {
      if !volume_api_available {
        if let Ok(volume) = self.api.fetch_volume(token).await {
          if let Some(state) = self.cache.lock().expect("Cider state poisoned").apply_volume(volume) {
            emit(app, CompanionEvent::State { state });
          }
        }
      }
      let initial_state = self.cache.lock().expect("Cider state poisoned").latest_state.clone();
      return Ok(CompanionConnectResponse { initial_state });
    }

    self.disconnect().await;
    let now_playing = self.api.fetch_now_playing(token).await?;
    let volume = self.api.fetch_volume(token).await.ok();
    let initial_state = self
      .cache
      .lock()
      .expect("Cider state poisoned")
      .begin_connection(&now_playing, volume);

    let state = Arc::clone(&self.cache);
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
            let next = state.lock().expect("Cider state poisoned").apply_event(&event);
            if let Some(state) = next {
              emit(&app, CompanionEvent::State { state });
            }
          }
        }.boxed()
      })
      .on("error", move |_payload, _| {
        let app = error_app.clone();
        let alive = Arc::clone(&error_alive);
        async move {
          if alive.load(Ordering::SeqCst) {
            emit(&app, CompanionEvent::Status { status: "socket_error".to_string(), detail: Some("Cider WebSockets reported an error.".to_string()), diagnostic: None });
          }
        }.boxed()
      })
      .on("close", move |_payload, _| {
        let app = close_app.clone();
        let alive = Arc::clone(&close_alive);
        async move {
          if SocketLifecycle::mark_closed(&alive) {
            emit(&app, CompanionEvent::Status { status: "socket_closed".to_string(), detail: Some("Cider WebSockets connection closed.".to_string()), diagnostic: None });
          }
        }.boxed()
      })
      .connect()
      .await;
    let socket = match socket_result {
      Ok(socket) => socket,
      Err(_) => {
        self.socket_lifecycle.invalidate();
        self.cache.lock().expect("Cider state poisoned").disconnect();
        return Err(CommandError::new("network", "Unable to connect to Cider WebSockets on 127.0.0.1:10767."));
      }
    };
    self.socket = Some(socket);
    let worker_app = app.clone();
    let (command_client, command_task) = spawn_command_worker(
      self.api.clone(),
      Arc::clone(&self.cache),
      move |state| emit(&worker_app, CompanionEvent::State { state }),
    );
    self.command_client = Some(command_client);
    self.command_task = Some(command_task);
    emit(app, CompanionEvent::Status { status: "socket_open".to_string(), detail: None, diagnostic: None });
    Ok(CompanionConnectResponse { initial_state: Some(initial_state) })
  }

  pub async fn disconnect(&mut self) {
    self.socket_lifecycle.invalidate();
    self.command_client = None;
    if let Some(task) = self.command_task.take() {
      task.abort();
    }
    if let Some(socket) = self.socket.take() {
      let _ = socket.disconnect().await;
    }
    self.cache.lock().expect("Cider state poisoned").disconnect();
  }

  pub fn command_client(&self) -> Result<CiderCommandClient, CommandError> {
    self.command_client.clone().ok_or_else(|| {
      CommandError::new(
        "api_unavailable",
        "Connect to Cider before sending playback commands.",
      )
    })
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
  CiderApi::production().fetch_now_playing(token).await?;
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

fn validate_response(status: StatusCode) -> Result<(), CommandError> {
  if status.is_success() { Ok(()) }
  else if status == StatusCode::UNAUTHORIZED || status == StatusCode::FORBIDDEN { Err(CommandError::auth_required()) }
  else { Err(CommandError::new("api_unavailable", format!("Cider API returned HTTP {}.", status.as_u16()))) }
}

fn bounded(value: Option<&str>) -> String { value.unwrap_or_default().chars().take(2048).collect() }

fn normalize_volume(volume: f64) -> Option<f64> {
  (volume.is_finite() && (0.0..=1.0).contains(&volume)).then_some(volume)
}

fn parse_volume_value(value: &Value) -> Option<f64> {
  match value {
    Value::Number(value) => value.as_f64().and_then(normalize_volume),
    Value::String(value) => value.trim().parse::<f64>().ok().and_then(normalize_volume),
    Value::Object(value) => value.get("volume").and_then(parse_volume_value),
    _ => None,
  }
}

fn volume_percentage(volume: f64) -> f64 {
  (volume * 10_000.0).round() / 100.0
}

fn map_now_playing(value: &Value, volume: Option<f64>, can_mute: bool) -> Value {
  let info = value.get("info").unwrap_or(value);
  let id = bounded(info.pointer("/playParams/id").and_then(Value::as_str));
  let title = bounded(info.get("name").and_then(Value::as_str));
  let artist = bounded(info.get("artistName").and_then(Value::as_str));
  let album = bounded(info.get("albumName").and_then(Value::as_str));
  let duration = info.get("durationInMillis").and_then(Value::as_f64).unwrap_or(0.0).max(0.0) / 1000.0;
  let elapsed = info.get("currentPlaybackTime").and_then(Value::as_f64).unwrap_or(0.0).clamp(0.0, duration.max(0.0));
  let artwork = info.pointer("/artwork/url").and_then(Value::as_str).map(|url| url.replace("{w}", "1024").replace("{h}", "1024"));
  let is_playing = info.get("isPlaying").and_then(Value::as_bool).unwrap_or(false);
  let volume = volume_percentage(
    volume
      .and_then(normalize_volume)
      .unwrap_or(CIDER_SAFE_UNMUTE_FALLBACK),
  );
  json!({
    "capabilities": { "canPlayPause": true, "canGoPrevious": true, "canGoNext": true, "canSeek": duration > 0.0, "canMute": can_mute, "canRate": true },
    "player": { "trackState": if is_playing { 1 } else { 0 }, "videoProgress": elapsed, "volume": volume, "adPlaying": false },
    "video": { "id": format!("cider:{id}"), "title": title, "author": artist, "album": album, "likeStatus": null, "thumbnails": artwork.map(|url| json!([{"url": url, "width": 1024, "height": 1024}])).unwrap_or_else(|| json!([])), "durationSeconds": duration, "isLive": false, "metadataFilled": !id.is_empty() }
  })
}

fn cider_transport_command(
  command: &PlaybackCommand,
) -> Result<(&'static str, Option<Value>), CommandError> {
  match command {
    PlaybackCommand::PlayPause => Ok(("playback/playpause", None)),
    PlaybackCommand::Play => Ok(("playback/play", None)),
    PlaybackCommand::Pause => Ok(("playback/pause", None)),
    PlaybackCommand::Next => Ok(("playback/next", None)),
    PlaybackCommand::Previous => Ok(("playback/previous", None)),
    PlaybackCommand::SeekTo { seconds } => Ok(("playback/seek", Some(json!({"position": if seconds.is_finite() { seconds.max(0.0) } else { 0.0 }})))),
    PlaybackCommand::ToggleLike => Ok(("playback/set-rating", Some(json!({"rating": 1})))),
    PlaybackCommand::ToggleDislike => Ok(("playback/set-rating", Some(json!({"rating": -1})))),
    PlaybackCommand::Mute | PlaybackCommand::Unmute => Err(CommandError::new(
      "unknown",
      "Cider volume command reached the transport-only command mapper.",
    )),
  }
}

fn emit(app: &AppHandle, event: CompanionEvent) { let _ = app.emit(CIDER_EVENT, event); }

#[allow(deprecated)]
fn payload_to_json(payload: Payload) -> Option<Value> { match payload { Payload::Text(values) => values.into_iter().next(), Payload::String(text) => serde_json::from_str(&text).ok(), Payload::Binary(bytes) => serde_json::from_slice(&bytes).ok() } }

#[cfg(test)]
mod tests {
  use super::*;
  use crate::models::PlaybackCommand;
  use serde_json::json;
  use std::sync::{atomic::Ordering, Arc, Mutex};
  use tokio::io::{AsyncReadExt, AsyncWriteExt};
  use tokio::net::TcpListener;

  async fn spawn_http_server(
    responses: Vec<(u16, &'static str)>,
  ) -> (
    String,
    Arc<Mutex<Vec<String>>>,
    tokio::task::JoinHandle<()>,
  ) {
    let listener = TcpListener::bind(("127.0.0.1", 0))
      .await
      .expect("bind Cider test server");
    let address = listener.local_addr().expect("read Cider test address");
    let requests = Arc::new(Mutex::new(Vec::new()));
    let captured = Arc::clone(&requests);
    let task = tokio::spawn(async move {
      for (status, body) in responses {
        let (mut stream, _) = listener.accept().await.expect("accept Cider request");
        let mut request = Vec::new();
        let mut buffer = [0_u8; 4096];
        loop {
          let read = stream.read(&mut buffer).await.expect("read Cider request");
          if read == 0 {
            break;
          }
          request.extend_from_slice(&buffer[..read]);
          let text = String::from_utf8_lossy(&request);
          let Some(header_end) = text.find("\r\n\r\n") else {
            continue;
          };
          let content_length = text[..header_end]
            .lines()
            .find_map(|line| {
              let (name, value) = line.split_once(':')?;
              name.eq_ignore_ascii_case("content-length")
                .then(|| value.trim().parse::<usize>().ok())
                .flatten()
            })
            .unwrap_or(0);
          if request.len() >= header_end + 4 + content_length {
            break;
          }
        }
        captured
          .lock()
          .expect("request capture poisoned")
          .push(String::from_utf8_lossy(&request).into_owned());
        let reason = if status == 200 { "OK" } else { "Error" };
        let response = format!(
          "HTTP/1.1 {status} {reason}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
          body.len()
        );
        stream
          .write_all(response.as_bytes())
          .await
          .expect("write Cider response");
      }
    });
    (format!("http://{address}"), requests, task)
  }

  #[test]
  fn maps_cider_now_playing_into_the_shared_playback_contract() {
    let state = map_now_playing(
      &json!({"info":{"playParams":{"id":"track-1"},"name":"Title","artistName":"Artist","albumName":"Album","durationInMillis":180000,"currentPlaybackTime":12.5,"artwork":{"url":"https://example.test/{w}x{h}.jpg"}}}),
      Some(0.37),
      true,
    );
    assert_eq!(state["video"]["id"], "cider:track-1");
    assert_eq!(state["video"]["durationSeconds"], 180.0);
    assert_eq!(state["player"]["videoProgress"], 12.5);
    assert_eq!(state["player"]["volume"], 37.0);
    assert_eq!(state["capabilities"]["canMute"], true);
    assert_eq!(state["video"]["thumbnails"][0]["url"], "https://example.test/1024x1024.jpg");
  }

  #[test]
  fn validates_rest_and_socket_volume_shapes_without_touching_track_metadata() {
    assert_eq!(parse_volume_value(&json!(0.42)), Some(0.42));
    assert_eq!(parse_volume_value(&json!("0.58")), Some(0.58));
    assert_eq!(parse_volume_value(&json!({"volume": 0.73})), Some(0.73));
    assert_eq!(parse_volume_value(&json!({"volume": "0.19"})), Some(0.19));
    assert_eq!(parse_volume_value(&json!(-0.1)), None);
    assert_eq!(parse_volume_value(&json!(1.1)), None);
    assert_eq!(parse_volume_value(&json!(null)), None);
    assert_eq!(normalize_volume(f64::NAN), None);
    assert_eq!(normalize_volume(f64::INFINITY), None);

    let mut cache = CiderPlaybackCache::default();
    cache.begin_connection(
      &json!({"info":{"playParams":{"id":"track-1"},"name":"Keep me"}}),
      Some(0.37),
    );
    let muted = cache
      .apply_event(&json!({"type":"playerStatus.volumeDidChange","data":0}))
      .expect("valid mute event");
    assert_eq!(muted["player"]["volume"], 0.0);
    assert_eq!(muted["video"]["title"], "Keep me");
    assert_eq!(cache.connection_last_nonzero_volume, Some(0.37));

    let changed = cache
      .apply_event(&json!({"type":"playerStatus.volumeDidChange","data":{"volume":"0.58"}}))
      .expect("valid object volume event");
    assert_eq!(changed["player"]["volume"], 58.0);
    assert_eq!(changed["capabilities"]["canMute"], true);
    assert!(cache
      .apply_event(&json!({"type":"playerStatus.volumeDidChange","data":"loud"}))
      .is_none());
    assert_eq!(cache.current_volume, Some(0.58));
  }

  #[tokio::test]
  async fn reads_actual_volume_with_apptoken_and_rejects_malformed_volume() {
    let (base_url, requests, server) = spawn_http_server(vec![(200, "{\"volume\":0.42}")]).await;
    let api = CiderApi::for_base_url(base_url);
    assert_eq!(api.fetch_volume("test-token").await.expect("read volume"), 0.42);
    server.await.expect("join volume server");
    let request = requests.lock().expect("requests poisoned")[0].to_ascii_lowercase();
    assert!(request.starts_with("get /api/v1/playback/volume "));
    assert!(request.contains("\r\napptoken: test-token\r\n"));

    let (base_url, _, server) = spawn_http_server(vec![(200, "{\"volume\":\"loud\"}")]).await;
    let error = CiderApi::for_base_url(base_url)
      .fetch_volume("private-token")
      .await
      .expect_err("malformed volume must fail");
    assert_eq!(error.code, "api_unavailable");
    assert!(!error.message.contains("private-token"));
    server.await.expect("join malformed server");
  }

  #[tokio::test]
  async fn maps_volume_http_failures_and_timeouts_without_exposing_the_token() {
    let (base_url, _, server) = spawn_http_server(vec![
      (401, "{}"),
      (403, "{}"),
      (404, "{}"),
      (200, "not-json"),
    ])
    .await;
    let api = CiderApi::for_base_url(base_url);
    for (expected_code, label) in [
      ("auth_required", "401"),
      ("auth_required", "403"),
      ("api_unavailable", "404"),
      ("api_unavailable", "invalid JSON"),
    ] {
      let error = api
        .fetch_volume("private-token")
        .await
        .expect_err(label);
      assert_eq!(error.code, expected_code);
      assert!(!error.message.contains("private-token"));
    }
    server.await.expect("join status server");

    let listener = TcpListener::bind(("127.0.0.1", 0))
      .await
      .expect("bind timeout server");
    let address = listener.local_addr().expect("read timeout address");
    let timeout_server = tokio::spawn(async move {
      let (mut stream, _) = listener.accept().await.expect("accept timeout request");
      let mut buffer = [0_u8; 1024];
      let _ = stream.read(&mut buffer).await.expect("read timeout request");
      tokio::time::sleep(Duration::from_millis(150)).await;
    });
    let error = CiderApi::for_base_url_with_timeout(
      format!("http://{address}"),
      Duration::from_millis(30),
    )
    .fetch_volume("private-token")
    .await
    .expect_err("timeout must be bounded");
    assert_eq!(error.code, "not_running");
    assert!(!error.message.contains("private-token"));
    timeout_server.await.expect("join timeout server");
  }

  #[test]
  fn volume_failure_keeps_now_playing_safe_and_a_later_event_recovers_capability() {
    let mut cache = CiderPlaybackCache::default();
    let initial = cache.begin_connection(
      &json!({"info":{"playParams":{"id":"track-1"},"name":"Track"}}),
      None,
    );
    assert_eq!(initial["video"]["title"], "Track");
    assert_eq!(initial["player"]["volume"], 25.0);
    assert_eq!(initial["capabilities"]["canMute"], false);

    let recovered = cache
      .apply_event(&json!({"type":"playerStatus.volumeDidChange","data":"0.64"}))
      .expect("later valid event recovers volume support");
    assert_eq!(recovered["player"]["volume"], 64.0);
    assert_eq!(recovered["capabilities"]["canMute"], true);
  }

  #[tokio::test]
  async fn mute_and_unmute_post_zero_then_restore_the_last_reliable_level() {
    let (base_url, requests, server) =
      spawn_http_server(vec![(200, "{}"), (200, "{}")]).await;
    let api = CiderApi::for_base_url(base_url);
    let cache = Arc::new(Mutex::new(CiderPlaybackCache::default()));
    cache
      .lock()
      .expect("cache poisoned")
      .begin_connection(&json!({"info":{"name":"Track"}}), Some(0.42));

    let muted = execute_cider_command(&api, &cache, "test-token", &PlaybackCommand::Mute)
      .await
      .expect("mute succeeds")
      .expect("mute publishes state");
    assert_eq!(muted["player"]["volume"], 0.0);
    let restored = execute_cider_command(&api, &cache, "test-token", &PlaybackCommand::Unmute)
      .await
      .expect("unmute succeeds")
      .expect("unmute publishes state");
    assert_eq!(restored["player"]["volume"], 42.0);
    server.await.expect("join command server");

    let requests = requests.lock().expect("requests poisoned");
    assert!(requests[0].starts_with("POST /api/v1/playback/volume "));
    assert!(requests[0].contains("{\"volume\":0.0}"));
    assert!(requests[1].contains("{\"volume\":0.42}"));
  }

  #[tokio::test]
  async fn failed_mute_does_not_publish_false_state_or_forget_the_restore_level() {
    let (base_url, _, server) = spawn_http_server(vec![(500, "{}")]).await;
    let api = CiderApi::for_base_url(base_url);
    let cache = Arc::new(Mutex::new(CiderPlaybackCache::default()));
    cache
      .lock()
      .expect("cache poisoned")
      .begin_connection(&json!({"info":{"name":"Track"}}), Some(0.42));

    let error = execute_cider_command(&api, &cache, "test-token", &PlaybackCommand::Mute)
      .await
      .expect_err("failed REST call must fail the command");
    assert_eq!(error.code, "api_unavailable");
    let cache = cache.lock().expect("cache poisoned");
    assert_eq!(cache.current_volume, Some(0.42));
    assert_eq!(cache.connection_last_nonzero_volume, Some(0.42));
    assert_eq!(cache.latest_state.as_ref().expect("state")["player"]["volume"], 42.0);
    server.await.expect("join failure server");
  }

  #[tokio::test]
  async fn repeated_mute_and_unmute_are_idempotent_without_extra_http_calls() {
    let api = CiderApi::for_base_url("http://127.0.0.1:9".to_string());
    let cache = Arc::new(Mutex::new(CiderPlaybackCache::default()));
    cache
      .lock()
      .expect("cache poisoned")
      .begin_connection(&json!({"info":{"name":"Track"}}), Some(0.0));
    assert!(execute_cider_command(&api, &cache, "test-token", &PlaybackCommand::Mute)
      .await
      .expect("already muted is successful")
      .is_none());

    cache
      .lock()
      .expect("cache poisoned")
      .apply_volume(0.42);
    assert!(execute_cider_command(&api, &cache, "test-token", &PlaybackCommand::Unmute)
      .await
      .expect("already unmuted is successful")
      .is_none());
  }

  #[test]
  fn reconnect_uses_manager_level_nonzero_volume_when_connection_memory_is_empty() {
    let mut cache = CiderPlaybackCache::default();
    cache.begin_connection(&json!({"info":{"name":"Track"}}), Some(0.42));
    cache.disconnect();
    cache.begin_connection(&json!({"info":{"name":"Track 2"}}), None);

    assert_eq!(cache.current_volume, None);
    assert_eq!(cache.connection_last_nonzero_volume, None);
    assert_eq!(cache.remembered_nonzero_volume, Some(0.42));
    assert_eq!(cache.unmute_target(), 0.42);
  }

  #[tokio::test]
  async fn volume_http_wait_does_not_hold_the_shared_playback_state_lock() {
    let listener = TcpListener::bind(("127.0.0.1", 0))
      .await
      .expect("bind delayed command server");
    let address = listener.local_addr().expect("read delayed address");
    let (received_sender, received) = oneshot::channel();
    let (release_sender, release) = oneshot::channel();
    let server = tokio::spawn(async move {
      let (mut stream, _) = listener.accept().await.expect("accept delayed request");
      let mut buffer = [0_u8; 4096];
      let _ = stream.read(&mut buffer).await.expect("read delayed request");
      let _ = received_sender.send(());
      let _ = release.await;
      stream
        .write_all(b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 2\r\nConnection: close\r\n\r\n{}")
        .await
        .expect("write delayed response");
    });
    let api = CiderApi::for_base_url(format!("http://{address}"));
    let cache = Arc::new(Mutex::new(CiderPlaybackCache::default()));
    cache
      .lock()
      .expect("cache poisoned")
      .begin_connection(&json!({"info":{"name":"Track"}}), Some(0.42));
    let command_cache = Arc::clone(&cache);
    let command = tokio::spawn(async move {
      execute_cider_command(&api, &command_cache, "test-token", &PlaybackCommand::Mute).await
    });

    received.await.expect("command reached delayed server");
    assert!(cache.try_lock().is_ok(), "state lock must be free during HTTP");
    let _ = release_sender.send(());
    command
      .await
      .expect("join delayed command")
      .expect("delayed command succeeds");
    server.await.expect("join delayed server");
  }

  #[tokio::test]
  async fn one_command_actor_serializes_mute_and_unmute_for_multiple_windows() {
    let (base_url, requests, server) =
      spawn_http_server(vec![(200, "{}"), (200, "{}")]).await;
    let cache = Arc::new(Mutex::new(CiderPlaybackCache::default()));
    cache
      .lock()
      .expect("cache poisoned")
      .begin_connection(&json!({"info":{"name":"Track"}}), Some(0.42));
    let published = Arc::new(Mutex::new(Vec::<Value>::new()));
    let published_states = Arc::clone(&published);
    let (main_client, worker) = spawn_command_worker(
      CiderApi::for_base_url(base_url),
      Arc::clone(&cache),
      move |state| published_states.lock().expect("published poisoned").push(state),
    );
    let settings_client = main_client.clone();

    let (mute, unmute) = tokio::join!(
      main_client.send("test-token".to_string(), PlaybackCommand::Mute),
      settings_client.send("test-token".to_string(), PlaybackCommand::Unmute),
    );
    mute.expect("main-window mute succeeds");
    unmute.expect("settings-window unmute succeeds");
    server.await.expect("join multi-window server");

    assert_eq!(
      cache.lock().expect("cache poisoned").current_volume,
      Some(0.42)
    );
    let states = published.lock().expect("published poisoned");
    assert_eq!(states.len(), 2);
    assert_eq!(states[0]["player"]["volume"], 0.0);
    assert_eq!(states[1]["player"]["volume"], 42.0);
    let requests = requests.lock().expect("requests poisoned");
    assert!(requests[0].contains("{\"volume\":0.0}"));
    assert!(requests[1].contains("{\"volume\":0.42}"));
    worker.abort();
  }

  #[test]
  fn unmute_fallback_is_conservative_and_below_full_volume() {
    let cache = CiderPlaybackCache::default();
    assert_eq!(cache.unmute_target(), CIDER_SAFE_UNMUTE_FALLBACK);
    assert!(CIDER_SAFE_UNMUTE_FALLBACK > CIDER_VOLUME_EPSILON);
    assert!(CIDER_SAFE_UNMUTE_FALLBACK < 1.0);
  }

  #[test]
  fn maps_only_supported_cider_commands_to_local_api_requests() {
    assert_eq!(
      cider_transport_command(&PlaybackCommand::PlayPause).expect("play/pause transport"),
      ("playback/playpause", None)
    );
    assert_eq!(
      cider_transport_command(&PlaybackCommand::Next).expect("next transport"),
      ("playback/next", None)
    );
    assert_eq!(
      cider_transport_command(&PlaybackCommand::Mute)
        .expect_err("mute must use the stateful volume path")
        .code,
      "unknown"
    );
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
