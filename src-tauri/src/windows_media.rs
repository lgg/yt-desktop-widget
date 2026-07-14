use crate::models::{
  CommandDiagnostic, CommandError, CompanionConnectResponse, DiscoveryInfo, PlaybackCommand,
};
use serde_json::Value;

pub const WINDOWS_MEDIA_EVENT: &str = "windows-media://event";
const TICKS_PER_SECOND: i64 = 10_000_000;
const MAX_ARTWORK_BYTES: u64 = 8 * 1024 * 1024;
const MAX_METADATA_CHARS: usize = 2_048;

fn truncate_metadata(mut value: String) -> String {
  if let Some((truncate_at, _)) = value.char_indices().nth(MAX_METADATA_CHARS) {
    value.truncate(truncate_at);
  }
  value
}

#[derive(Clone, Copy, Debug)]
struct NormalizedTimeline {
  start_ticks: i64,
  min_seek_ticks: i64,
  max_seek_ticks: i64,
  duration_seconds: f64,
  elapsed_seconds: f64,
}

fn seconds_from_ticks(ticks: i64) -> f64 {
  (ticks.max(0) as f64 / TICKS_PER_SECOND as f64).max(0.0)
}

fn normalize_timeline(
  start_ticks: i64,
  end_ticks: i64,
  position_ticks: i64,
  min_seek_ticks: i64,
  max_seek_ticks: i64,
) -> NormalizedTimeline {
  let start_ticks = start_ticks.max(0);
  let end_ticks = end_ticks.max(start_ticks);
  let min_seek_ticks = min_seek_ticks.clamp(start_ticks, end_ticks);
  let max_seek_ticks = max_seek_ticks.clamp(min_seek_ticks, end_ticks);
  let position_ticks = position_ticks.clamp(start_ticks, end_ticks);

  NormalizedTimeline {
    start_ticks,
    min_seek_ticks,
    max_seek_ticks,
    duration_seconds: seconds_from_ticks(end_ticks.saturating_sub(start_ticks)),
    elapsed_seconds: seconds_from_ticks(position_ticks.saturating_sub(start_ticks)),
  }
}

fn seek_position_ticks(seconds: f64, timeline: NormalizedTimeline) -> i64 {
  let safe_seconds = if seconds.is_finite() { seconds.max(0.0) } else { 0.0 };
  let offset_ticks = (safe_seconds * TICKS_PER_SECOND as f64) as i64;
  timeline
    .start_ticks
    .saturating_add(offset_ticks)
    .clamp(timeline.min_seek_ticks, timeline.max_seek_ticks)
}

fn accepted_artwork_size(size: u64) -> Option<u32> {
  if size == 0 || size > MAX_ARTWORK_BYTES {
    return None;
  }

  u32::try_from(size).ok()
}

fn safe_artwork_content_type(content_type: &str) -> &'static str {
  for allowed in [
    "image/avif",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
  ] {
    if content_type.eq_ignore_ascii_case(allowed) {
      return allowed;
    }
  }

  "image/jpeg"
}

fn should_load_artwork(previous: Option<&Value>, track_id: &str) -> bool {
  previous.is_none_or(|state| {
    state["video"]["id"].as_str() != Some(track_id) || state["video"]["artworkResolved"].as_bool() != Some(true)
  })
}

fn is_unsupported_command(command: &PlaybackCommand) -> bool {
  matches!(
    command,
    PlaybackCommand::Mute | PlaybackCommand::Unmute | PlaybackCommand::ToggleLike | PlaybackCommand::ToggleDislike
  )
}

fn ensure_command_completed(completed: bool) -> Result<(), CommandError> {
  if completed {
    return Ok(());
  }

  Err(CommandError::new(
    "api_unavailable",
    "The current Windows media session did not accept the command.",
  )
  .with_diagnostic(CommandDiagnostic::new(
    "send_command.complete",
    "command_rejected",
  )))
}

fn should_dispatch_command(
  command: &PlaybackCommand,
  connected: bool,
) -> Result<bool, CommandError> {
  if is_unsupported_command(command) {
    return Ok(false);
  }
  if connected {
    return Ok(true);
  }

  Err(
    CommandError::new("not_running", "Windows Media Session is not connected.")
      .with_diagnostic(CommandDiagnostic::new(
        "send_command.prerequisite",
        "backend_not_connected",
      )),
  )
}

#[cfg(target_os = "windows")]
mod platform {
  use std::{
    fs::{self, OpenOptions},
    io::Write,
    sync::{
      mpsc::{self, Receiver, RecvTimeoutError, Sender},
      Mutex, OnceLock,
    },
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
  };

  use base64::Engine;
  use serde_json::json;
  use tauri::{AppHandle, Emitter, Manager};
  use tokio::sync::oneshot;
  use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSession, GlobalSystemMediaTransportControlsSessionManager,
    GlobalSystemMediaTransportControlsSessionMediaProperties, GlobalSystemMediaTransportControlsSessionPlaybackStatus,
  };
  use windows::Storage::Streams::DataReader;
  use windows::Win32::System::WinRT::{RoInitialize, RoUninitialize, RO_INIT_MULTITHREADED};

  use super::{
    accepted_artwork_size, ensure_command_completed, normalize_timeline, safe_artwork_content_type,
    seek_position_ticks, should_dispatch_command, should_load_artwork, truncate_metadata, CommandDiagnostic,
    CommandError, CompanionConnectResponse, DiscoveryInfo, PlaybackCommand, Value, WINDOWS_MEDIA_EVENT,
  };
  use crate::models::CompanionEvent;

  const POLL_INTERVAL: Duration = Duration::from_millis(750);
  const WORKER_RESPONSE_TIMEOUT: Duration = Duration::from_secs(15);
  const DIAGNOSTIC_LOG_FILE: &str = "windows-media-diagnostics.jsonl";
  const PREVIOUS_DIAGNOSTIC_LOG_FILE: &str = "windows-media-diagnostics.previous.jsonl";
  const MAX_DIAGNOSTIC_LOG_BYTES: u64 = 256 * 1024;
  static DIAGNOSTIC_LOG_LOCK: Mutex<()> = Mutex::new(());

  const E_POINTER: i32 = 0x8000_4003_u32 as i32;

  pub(super) fn classify_windows_hresult(hresult: i32) -> &'static str {
    match hresult as u32 {
      0x8007_0005 => "access_denied",
      0x8004_01F0 => "apartment_not_initialized",
      0x8001_010E => "wrong_thread",
      0x8000_4003 => "empty_result",
      0x8007_0490 => "not_found",
      _ => "windows_error",
    }
  }

  pub(super) fn format_windows_hresult(hresult: i32) -> String {
    format!("0x{:08X}", hresult as u32)
  }

  fn windows_error(stage: &str, context: &str, error: windows::core::Error) -> CommandError {
    let hresult = error.code().0;
    CommandError::new("api_unavailable", context).with_diagnostic(
      CommandDiagnostic::new(stage, classify_windows_hresult(hresult))
        .with_hresult(format_windows_hresult(hresult)),
    )
  }

  fn worker_error(stage: &str, context: &str, category: &str) -> CommandError {
    CommandError::new("api_unavailable", context)
      .with_diagnostic(CommandDiagnostic::new(stage, category))
  }

  fn diagnostic_detail(error: &CommandError) -> String {
    let Some(diagnostic) = &error.diagnostic else {
      return error.message.clone();
    };
    let hresult = diagnostic.hresult.as_deref().unwrap_or("n/a");
    format!(
      "{} (stage: {}; HRESULT: {}; category: {})",
      error.message, diagnostic.stage, hresult, diagnostic.category
    )
  }

  pub(super) fn diagnostic_log_line(
    timestamp_unix_ms: u128,
    operation: &str,
    diagnostic: &CommandDiagnostic,
  ) -> Result<String, serde_json::Error> {
    serde_json::to_string(&json!({
      "timestampUnixMs": timestamp_unix_ms,
      "operation": operation,
      "stage": diagnostic.stage,
      "category": diagnostic.category,
      "hresult": diagnostic.hresult,
    }))
  }

  pub fn write_diagnostic(
    app: &AppHandle,
    operation: &str,
    diagnostic: Option<&CommandDiagnostic>,
  ) {
    let Some(diagnostic) = diagnostic else {
      return;
    };
    let Ok(_guard) = DIAGNOSTIC_LOG_LOCK.lock() else {
      return;
    };
    let Ok(log_dir) = app.path().app_log_dir() else {
      return;
    };
    if fs::create_dir_all(&log_dir).is_err() {
      return;
    }

    let log_path = log_dir.join(DIAGNOSTIC_LOG_FILE);
    if fs::metadata(&log_path)
      .map(|metadata| metadata.len() >= MAX_DIAGNOSTIC_LOG_BYTES)
      .unwrap_or(false)
    {
      let previous_log_path = log_dir.join(PREVIOUS_DIAGNOSTIC_LOG_FILE);
      let _ = fs::remove_file(&previous_log_path);
      let _ = fs::rename(&log_path, previous_log_path);
    }

    let timestamp_unix_ms = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .map(|duration| duration.as_millis())
      .unwrap_or_default();
    let Ok(line) = diagnostic_log_line(timestamp_unix_ms, operation, diagnostic) else {
      return;
    };
    let Ok(mut log) = OpenOptions::new().create(true).append(true).open(log_path) else {
      return;
    };
    let _ = writeln!(log, "{line}");
  }

  fn playback_track_state(status: GlobalSystemMediaTransportControlsSessionPlaybackStatus) -> i32 {
    if status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing {
      1
    } else if status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Changing {
      2
    } else if status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Paused
      || status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Stopped
    {
      0
    } else {
      -1
    }
  }

  fn artwork_data_url(properties: &GlobalSystemMediaTransportControlsSessionMediaProperties) -> Option<String> {
    let reference = properties.Thumbnail().ok()?;
    let stream = reference.OpenReadAsync().ok()?.get().ok()?;
    let size = accepted_artwork_size(stream.Size().ok()?)?;

    let input = stream.GetInputStreamAt(0).ok()?;
    let reader = DataReader::CreateDataReader(&input).ok()?;
    let loaded = reader.LoadAsync(size).ok()?.get().ok()?;
    if loaded != size {
      let _ = reader.Close();
      return None;
    }

    let mut bytes = vec![0_u8; loaded as usize];
    if reader.ReadBytes(&mut bytes).is_err() {
      let _ = reader.Close();
      return None;
    }
    let _ = reader.Close();

    let content_type = stream
      .ContentType()
      .ok()
      .map(|value| value.to_string())
      .unwrap_or_else(|| "image/jpeg".to_string());
    let content_type = safe_artwork_content_type(&content_type);
    Some(format!(
      "data:{content_type};base64,{}",
      base64::engine::general_purpose::STANDARD.encode(bytes)
    ))
  }

  fn snapshot_for_session(
    session: &GlobalSystemMediaTransportControlsSession,
    previous: Option<&Value>,
  ) -> Result<Value, CommandError> {
    let properties = session
      .TryGetMediaPropertiesAsync()
      .map_err(|error| {
        windows_error(
          "snapshot.media_properties.request",
          "Unable to request Windows media metadata",
          error,
        )
      })?
      .get()
      .map_err(|error| {
        windows_error(
          "snapshot.media_properties.await",
          "Unable to read Windows media metadata",
          error,
        )
      })?;
    let timeline = session
      .GetTimelineProperties()
      .map_err(|error| {
        windows_error(
          "snapshot.timeline",
          "Unable to read Windows media timeline",
          error,
        )
      })?;
    let playback = session
      .GetPlaybackInfo()
      .map_err(|error| {
        windows_error(
          "snapshot.playback_info",
          "Unable to read Windows playback state",
          error,
        )
      })?;
    let controls = playback
      .Controls()
      .map_err(|error| {
        windows_error(
          "snapshot.controls",
          "Unable to read Windows media controls",
          error,
        )
      })?;

    let source_app = truncate_metadata(
      session
        .SourceAppUserModelId()
        .map(|value| value.to_string())
        .unwrap_or_default(),
    );
    let title = truncate_metadata(properties.Title().map(|value| value.to_string()).unwrap_or_default());
    let artist = truncate_metadata(properties.Artist().map(|value| value.to_string()).unwrap_or_default());
    let album = properties
      .AlbumTitle()
      .map(|value| truncate_metadata(value.to_string()))
      .ok()
      .filter(|value| !value.is_empty());
    let start_ticks = timeline.StartTime().map(|value| value.Duration).unwrap_or(0);
    let end_ticks = timeline.EndTime().map(|value| value.Duration).unwrap_or(start_ticks);
    let normalized_timeline = normalize_timeline(
      start_ticks,
      end_ticks,
      timeline.Position().map(|value| value.Duration).unwrap_or(0),
      timeline
        .MinSeekTime()
        .map(|value| value.Duration)
        .unwrap_or(start_ticks),
      timeline.MaxSeekTime().map(|value| value.Duration).unwrap_or(end_ticks),
    );
    let duration_seconds = normalized_timeline.duration_seconds;
    let elapsed_seconds = normalized_timeline.elapsed_seconds;
    let status = playback
      .PlaybackStatus()
      .unwrap_or(GlobalSystemMediaTransportControlsSessionPlaybackStatus::Closed);
    let id = format!(
      "wms:{}:{}:{}:{}:{}:{:.0}",
      source_app,
      title,
      artist,
      album.as_deref().unwrap_or_default(),
      properties.TrackNumber().unwrap_or_default(),
      duration_seconds
    );
    let cover_url = should_load_artwork(previous, &id)
      .then(|| artwork_data_url(&properties))
      .flatten();

    let thumbnails = cover_url
      .map(|url| json!([{ "url": url, "width": 1, "height": 1 }]))
      .unwrap_or_else(|| json!([]));

    Ok(json!({
      "capabilities": {
        "canPlayPause": controls.IsPlayPauseToggleEnabled().unwrap_or(false)
          || controls.IsPlayEnabled().unwrap_or(false)
          || controls.IsPauseEnabled().unwrap_or(false),
        "canGoPrevious": controls.IsPreviousEnabled().unwrap_or(false),
        "canGoNext": controls.IsNextEnabled().unwrap_or(false),
        "canSeek": controls.IsPlaybackPositionEnabled().unwrap_or(false)
          && normalized_timeline.max_seek_ticks > normalized_timeline.min_seek_ticks,
        "canMute": false,
        "canRate": false
      },
      "player": {
        "trackState": playback_track_state(status),
        "videoProgress": elapsed_seconds,
        "volume": 100,
        "adPlaying": false
      },
      "video": {
        "id": id,
        "title": title,
        "author": artist,
        "album": album,
        "likeStatus": null,
        "thumbnails": thumbnails,
        "artworkResolved": true,
        "durationSeconds": duration_seconds,
        "isLive": duration_seconds <= 0.0,
        "metadataFilled": true
      }
    }))
  }

  fn current_session(
    manager: &GlobalSystemMediaTransportControlsSessionManager,
  ) -> Result<Option<GlobalSystemMediaTransportControlsSession>, CommandError> {
    match manager.GetCurrentSession() {
      Ok(session) => Ok(Some(session)),
      Err(error) if error.code().0 == E_POINTER => Ok(None),
      Err(error) => Err(windows_error(
        "current_session.get",
        "Unable to read the current Windows media session",
        error,
      )),
    }
  }

  fn current_snapshot(
    manager: &GlobalSystemMediaTransportControlsSessionManager,
    previous: Option<&Value>,
  ) -> Result<Option<Value>, CommandError> {
    let Some(session) = current_session(manager)? else {
      return Ok(None);
    };
    snapshot_for_session(&session, previous).map(Some)
  }

  fn request_manager() -> Result<GlobalSystemMediaTransportControlsSessionManager, CommandError> {
    GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
      .map_err(|error| {
        windows_error(
          "request_manager.request",
          "Unable to request Windows Media Session access",
          error,
        )
      })?
      .get()
      .map_err(|error| {
        windows_error(
          "request_manager.await",
          "Unable to initialize Windows Media Session",
          error,
        )
      })
  }

  fn session_count(
    manager: &GlobalSystemMediaTransportControlsSessionManager,
  ) -> Result<u32, CommandError> {
    let sessions = manager.GetSessions().map_err(|error| {
      windows_error(
        "discover.sessions",
        "Unable to enumerate Windows media sessions",
        error,
      )
    })?;
    sessions.Size().map_err(|error| {
      windows_error(
        "discover.sessions.size",
        "Unable to count Windows media sessions",
        error,
      )
    })
  }

  pub(super) fn unavailable_discovery(error: &CommandError) -> DiscoveryInfo {
    DiscoveryInfo {
      available: false,
      api_versions: Vec::new(),
      supports_realtime: false,
      supports_seek: false,
      using_browser_bridge: false,
      detail: Some(diagnostic_detail(error)),
      diagnostic: error.diagnostic.clone(),
    }
  }

  enum WorkerRequest {
    Discover {
      respond_to: oneshot::Sender<Result<DiscoveryInfo, CommandError>>,
    },
    Connect {
      app: AppHandle,
      respond_to: oneshot::Sender<Result<CompanionConnectResponse, CommandError>>,
    },
    Disconnect {
      respond_to: oneshot::Sender<()>,
    },
    SendCommand {
      command: PlaybackCommand,
      respond_to: oneshot::Sender<Result<(), CommandError>>,
    },
  }

  struct WorkerState {
    startup_error: Option<CommandError>,
    manager: Option<GlobalSystemMediaTransportControlsSessionManager>,
    connected: bool,
    app: Option<AppHandle>,
    previous_state: Option<Value>,
    poll_error_active: bool,
  }

  impl WorkerState {
    fn new(startup_error: Option<CommandError>) -> Self {
      Self {
        startup_error,
        manager: None,
        connected: false,
        app: None,
        previous_state: None,
        poll_error_active: false,
      }
    }

    fn ensure_started(&self) -> Result<(), CommandError> {
      match &self.startup_error {
        Some(error) => Err(error.clone()),
        None => Ok(()),
      }
    }

    fn ensure_manager(
      &mut self,
    ) -> Result<&GlobalSystemMediaTransportControlsSessionManager, CommandError> {
      self.ensure_started()?;
      if self.manager.is_none() {
        self.manager = Some(request_manager()?);
      }
      self.manager.as_ref().ok_or_else(|| {
        worker_error(
          "worker.manager",
          "Windows Media Session did not provide a manager",
          "manager_unavailable",
        )
      })
    }

    fn discover(&mut self) -> Result<DiscoveryInfo, CommandError> {
      let result = (|| {
        let (count, has_current_session) = {
          let manager = self.ensure_manager()?;
          (session_count(manager)?, current_session(manager)?.is_some())
        };
        let current_state = if has_current_session { "present" } else { "absent" };

        Ok(DiscoveryInfo {
          available: true,
          api_versions: vec!["Windows.Media.Control".to_string()],
          supports_realtime: true,
          supports_seek: true,
          using_browser_bridge: false,
          detail: Some(format!(
            "Windows Media Session is available ({count} sessions; current session {current_state})."
          )),
          diagnostic: None,
        })
      })();
      if result.is_err() {
        self.manager = None;
      }
      result
    }

    fn prepare_connection(&mut self) -> Result<CompanionConnectResponse, CommandError> {
      let result = (|| {
        let manager = self.ensure_manager()?;
        current_snapshot(manager, None)
      })();
      if result.is_err() {
        self.manager = None;
      }
      Ok(CompanionConnectResponse {
        initial_state: result?,
      })
    }

    fn commit_connection(&mut self, app: AppHandle, initial_state: Option<Value>) {
      self.connected = true;
      self.app = Some(app);
      self.previous_state = initial_state;
      self.poll_error_active = false;
      self.emit_status("socket_open", None);
    }

    fn disconnect(&mut self) {
      self.connected = false;
      self.app = None;
      self.previous_state = None;
      self.poll_error_active = false;
      self.manager = None;
    }

    fn send_command(&self, command: &PlaybackCommand) -> Result<(), CommandError> {
      if !should_dispatch_command(command, self.connected)? {
        return Ok(());
      }
      self.ensure_started()?;

      let manager = self.manager.as_ref().ok_or_else(|| {
        worker_error(
          "send_command.manager",
          "Windows Media Session is not connected.",
          "manager_unavailable",
        )
      })?;
      let session = current_session(manager)?.ok_or_else(|| {
        worker_error(
          "send_command.session",
          "No current Windows media session is available.",
          "no_current_session",
        )
      })?;

      let operation = match command {
        PlaybackCommand::PlayPause => session.TryTogglePlayPauseAsync(),
        PlaybackCommand::Play => session.TryPlayAsync(),
        PlaybackCommand::Pause => session.TryPauseAsync(),
        PlaybackCommand::Next => session.TrySkipNextAsync(),
        PlaybackCommand::Previous => session.TrySkipPreviousAsync(),
        PlaybackCommand::SeekTo { seconds } => {
          let timeline = session.GetTimelineProperties().map_err(|error| {
            windows_error(
              "send_command.seek.timeline",
              "Unable to read Windows media timeline",
              error,
            )
          })?;
          let start_ticks = timeline.StartTime().map(|value| value.Duration).unwrap_or(0);
          let end_ticks = timeline.EndTime().map(|value| value.Duration).unwrap_or(start_ticks);
          let normalized_timeline = normalize_timeline(
            start_ticks,
            end_ticks,
            timeline.Position().map(|value| value.Duration).unwrap_or(0),
            timeline
              .MinSeekTime()
              .map(|value| value.Duration)
              .unwrap_or(start_ticks),
            timeline.MaxSeekTime().map(|value| value.Duration).unwrap_or(end_ticks),
          );
          session.TryChangePlaybackPositionAsync(seek_position_ticks(*seconds, normalized_timeline))
        }
        PlaybackCommand::Mute
        | PlaybackCommand::Unmute
        | PlaybackCommand::ToggleLike
        | PlaybackCommand::ToggleDislike => return Ok(()),
      }
      .map_err(|error| {
        windows_error(
          "send_command.request",
          "Windows rejected the media command",
          error,
        )
      })?;

      let completed = operation.get().map_err(|error| {
        windows_error(
          "send_command.await",
          "Windows could not complete the media command",
          error,
        )
      })?;
      ensure_command_completed(completed)
    }

    fn poll(&mut self) {
      if !self.connected {
        return;
      }

      let result = match &self.manager {
        Some(manager) => current_snapshot(manager, self.previous_state.as_ref()),
        None => Err(worker_error(
          "poll.manager",
          "Windows Media Session is not connected.",
          "manager_unavailable",
        )),
      };

      match result {
        Ok(next_state) => {
          if self.poll_error_active {
            self.poll_error_active = false;
            self.emit_status("socket_open", None);
          }
          if next_state == self.previous_state {
            return;
          }
          self.previous_state = next_state.clone();
          self.emit(CompanionEvent::State {
            state: next_state.unwrap_or_else(|| json!({})),
          });
        }
        Err(error) => {
          if self.poll_error_active {
            return;
          }
          self.poll_error_active = true;
          if let Some(app) = &self.app {
            write_diagnostic(app, "poll", error.diagnostic.as_ref());
          }
          self.emit_status("socket_error", Some(diagnostic_detail(&error)));
        }
      }
    }

    fn emit_status(&self, status: &str, detail: Option<String>) {
      self.emit(CompanionEvent::Status {
        status: status.to_string(),
        detail,
      });
    }

    fn emit(&self, event: CompanionEvent) {
      if let Some(app) = &self.app {
        let _ = app.emit(WINDOWS_MEDIA_EVENT, event);
      }
    }

    fn handle(&mut self, request: WorkerRequest) {
      match request {
        WorkerRequest::Discover { respond_to } => {
          if respond_to.is_closed() {
            return;
          }
          let result = self.discover();
          let _ = respond_to.send(result);
        }
        WorkerRequest::Connect { app, respond_to } => {
          if respond_to.is_closed() {
            return;
          }
          match self.prepare_connection() {
            Ok(response) => {
              let initial_state = response.initial_state.clone();
              if respond_to.send(Ok(response)).is_ok() {
                self.commit_connection(app, initial_state);
              }
            }
            Err(error) => {
              let _ = respond_to.send(Err(error));
            }
          }
        }
        WorkerRequest::Disconnect { respond_to } => {
          self.disconnect();
          let _ = respond_to.send(());
        }
        WorkerRequest::SendCommand {
          command,
          respond_to,
        } => {
          if respond_to.is_closed() {
            return;
          }
          let result = self.send_command(&command);
          let _ = respond_to.send(result);
        }
      }
    }
  }

  struct WorkerApartment;

  impl WorkerApartment {
    fn initialize() -> Result<Self, CommandError> {
      unsafe { RoInitialize(RO_INIT_MULTITHREADED) }
        .map(|()| Self)
        .map_err(|error| {
          windows_error(
            "worker.initialize_mta",
            "Unable to initialize the Windows Media worker",
            error,
          )
        })
    }
  }

  impl Drop for WorkerApartment {
    fn drop(&mut self) {
      unsafe { RoUninitialize() };
    }
  }

  fn spawn_mta_thread(
    name: &str,
    run: impl FnOnce(Option<CommandError>) + Send + 'static,
  ) -> Result<thread::JoinHandle<()>, CommandError> {
    thread::Builder::new()
      .name(name.to_string())
      .spawn(move || {
        let apartment = WorkerApartment::initialize();
        let startup_error = apartment.as_ref().err().cloned();
        run(startup_error);
        drop(apartment);
      })
      .map_err(|_| {
        worker_error(
          "worker.spawn",
          "Unable to start the Windows Media worker",
          "worker_spawn_failed",
        )
      })
  }

  fn run_worker(receiver: Receiver<WorkerRequest>, startup_error: Option<CommandError>) {
    let mut state = WorkerState::new(startup_error);

    loop {
      let request = if state.connected {
        match receiver.recv_timeout(POLL_INTERVAL) {
          Ok(request) => Some(request),
          Err(RecvTimeoutError::Timeout) => {
            state.poll();
            None
          }
          Err(RecvTimeoutError::Disconnected) => break,
        }
      } else {
        match receiver.recv() {
          Ok(request) => Some(request),
          Err(_) => break,
        }
      };

      if let Some(request) = request {
        state.handle(request);
      }
    }

    state.disconnect();
  }

  #[cfg(test)]
  pub(super) async fn initialized_worker_thread_ids(
  ) -> Result<(thread::ThreadId, thread::ThreadId), CommandError> {
    let (respond_to, response) = oneshot::channel();
    let worker_thread = spawn_mta_thread("windows-media-worker-test", move |startup_error| {
      let result = match startup_error {
        Some(error) => Err(error),
        None => {
          let thread_id = thread::current().id();
          Ok((thread_id, thread_id))
        }
      };
      let _ = respond_to.send(result);
    })?;
    let result = response.await.map_err(|_| {
      worker_error(
        "worker.test.receive",
        "The Windows Media worker test stopped unexpectedly",
        "worker_stopped",
      )
    })?;
    let _ = worker_thread.join();
    result
  }

  struct WindowsMediaWorker {
    sender: Sender<WorkerRequest>,
    _thread: thread::JoinHandle<()>,
  }

  impl WindowsMediaWorker {
    fn spawn() -> Result<Self, CommandError> {
      let (sender, receiver) = mpsc::channel();
      let worker_thread = spawn_mta_thread("windows-media-worker", move |startup_error| {
        run_worker(receiver, startup_error);
      })?;
      Ok(Self {
        sender,
        _thread: worker_thread,
      })
    }

    async fn request<T>(
      &self,
      build_request: impl FnOnce(oneshot::Sender<Result<T, CommandError>>) -> WorkerRequest,
    ) -> Result<T, CommandError> {
      let (respond_to, response) = oneshot::channel();
      self.sender.send(build_request(respond_to)).map_err(|_| {
        worker_error(
          "worker.request.send",
          "The Windows Media worker is unavailable",
          "worker_stopped",
        )
      })?;
      let response = tokio::time::timeout(WORKER_RESPONSE_TIMEOUT, response)
        .await
        .map_err(|_| {
          worker_error(
            "worker.request.timeout",
            "The Windows Media worker did not respond in time",
            "worker_timeout",
          )
        })?;
      response.map_err(|_| {
        worker_error(
          "worker.request.receive",
          "The Windows Media worker stopped before completing the request",
          "worker_stopped",
        )
      })?
    }

    async fn discover(&self) -> Result<DiscoveryInfo, CommandError> {
      self
        .request(|respond_to| WorkerRequest::Discover { respond_to })
        .await
    }

    async fn connect(&self, app: AppHandle) -> Result<CompanionConnectResponse, CommandError> {
      self
        .request(|respond_to| WorkerRequest::Connect { app, respond_to })
        .await
    }

    async fn disconnect(&self) {
      let (respond_to, response) = oneshot::channel();
      if self
        .sender
        .send(WorkerRequest::Disconnect { respond_to })
        .is_ok()
      {
        let _ = tokio::time::timeout(WORKER_RESPONSE_TIMEOUT, response).await;
      }
    }

    async fn send_command(&self, command: PlaybackCommand) -> Result<(), CommandError> {
      self
        .request(|respond_to| WorkerRequest::SendCommand {
          command,
          respond_to,
        })
        .await
    }
  }

  pub struct WindowsMediaManager {
    worker: OnceLock<Result<WindowsMediaWorker, CommandError>>,
  }

  impl Default for WindowsMediaManager {
    fn default() -> Self {
      Self {
        worker: OnceLock::new(),
      }
    }
  }

  impl WindowsMediaManager {
    fn worker(&self) -> Result<&WindowsMediaWorker, CommandError> {
      match self.worker.get_or_init(WindowsMediaWorker::spawn) {
        Ok(worker) => Ok(worker),
        Err(error) => Err(error.clone()),
      }
    }

    pub async fn discover(&self) -> DiscoveryInfo {
      let result = match self.worker() {
        Ok(worker) => worker.discover().await,
        Err(error) => Err(error),
      };
      match result {
        Ok(discovery) => discovery,
        Err(error) => unavailable_discovery(&error),
      }
    }

    pub async fn connect(&mut self, app: &AppHandle) -> Result<CompanionConnectResponse, CommandError> {
      self.worker()?.connect(app.clone()).await
    }

    pub async fn disconnect(&mut self) {
      if let Ok(worker) = self.worker() {
        worker.disconnect().await;
      }
    }

    pub async fn send_command(&self, command: &PlaybackCommand) -> Result<(), CommandError> {
      if !should_dispatch_command(command, true)? {
        return Ok(());
      }
      self.worker()?.send_command(command.clone()).await
    }
  }
}

#[cfg(target_os = "windows")]
pub use platform::{write_diagnostic, WindowsMediaManager};

#[cfg(not(target_os = "windows"))]
#[derive(Default)]
pub struct WindowsMediaManager;

#[cfg(not(target_os = "windows"))]
impl WindowsMediaManager {
  pub async fn discover(&self) -> DiscoveryInfo {
    DiscoveryInfo {
      available: false,
      api_versions: Vec::new(),
      supports_realtime: false,
      supports_seek: false,
      using_browser_bridge: false,
      detail: Some("Windows Media Session is only available on Windows.".to_string()),
      diagnostic: None,
    }
  }

  pub async fn connect(&mut self, _app: &tauri::AppHandle) -> Result<CompanionConnectResponse, CommandError> {
    Err(CommandError::new(
      "api_unavailable",
      "Windows Media Session is only available on Windows.",
    ))
  }

  pub async fn disconnect(&mut self) {}

  pub async fn send_command(&self, command: &PlaybackCommand) -> Result<(), CommandError> {
    if !should_dispatch_command(command, true)? {
      return Ok(());
    }
    Err(CommandError::new(
      "api_unavailable",
      "Windows Media Session is only available on Windows.",
    ))
  }
}

#[cfg(not(target_os = "windows"))]
pub fn write_diagnostic(
  _app: &tauri::AppHandle,
  _operation: &str,
  _diagnostic: Option<&CommandDiagnostic>,
) {
}

#[cfg(test)]
mod tests {
  use serde_json::json;

  use super::{
    accepted_artwork_size, ensure_command_completed, is_unsupported_command, normalize_timeline,
    safe_artwork_content_type, seek_position_ticks, should_dispatch_command, should_load_artwork,
    truncate_metadata, MAX_ARTWORK_BYTES, MAX_METADATA_CHARS, TICKS_PER_SECOND,
  };
  use crate::models::PlaybackCommand;

  #[cfg(target_os = "windows")]
  use super::platform::{
    classify_windows_hresult, diagnostic_log_line, format_windows_hresult,
    initialized_worker_thread_ids, unavailable_discovery,
  };

  #[test]
  fn rating_and_mute_commands_are_safe_no_ops() {
    assert!(is_unsupported_command(&PlaybackCommand::ToggleLike));
    assert!(is_unsupported_command(&PlaybackCommand::ToggleDislike));
    assert!(is_unsupported_command(&PlaybackCommand::Mute));
    assert!(is_unsupported_command(&PlaybackCommand::Unmute));
    assert!(!is_unsupported_command(&PlaybackCommand::PlayPause));
  }

  #[test]
  fn rejected_transport_result_surfaces_a_safe_error() {
    assert!(ensure_command_completed(true).is_ok());
    let error = ensure_command_completed(false).expect_err("false result should be rejected");
    assert_eq!(error.code, "api_unavailable");
    assert!(!error.message.is_empty());
  }

  #[test]
  fn normalizes_non_zero_timeline_origins_and_seek_ranges() {
    let timeline = normalize_timeline(
      3 * TICKS_PER_SECOND,
      13 * TICKS_PER_SECOND,
      55 * TICKS_PER_SECOND / 10,
      4 * TICKS_PER_SECOND,
      12 * TICKS_PER_SECOND,
    );

    assert_eq!(timeline.duration_seconds, 10.0);
    assert_eq!(timeline.elapsed_seconds, 2.5);
    assert_eq!(seek_position_ticks(0.0, timeline), 4 * TICKS_PER_SECOND);
    assert_eq!(seek_position_ticks(7.0, timeline), 10 * TICKS_PER_SECOND);
    assert_eq!(seek_position_ticks(99.0, timeline), 12 * TICKS_PER_SECOND);
  }

  #[test]
  fn rejects_oversized_artwork_instead_of_emitting_a_truncated_image() {
    assert_eq!(accepted_artwork_size(0), None);
    assert_eq!(accepted_artwork_size(MAX_ARTWORK_BYTES), Some(MAX_ARTWORK_BYTES as u32));
    assert_eq!(accepted_artwork_size(MAX_ARTWORK_BYTES + 1), None);
  }

  #[test]
  fn allows_only_inert_raster_artwork_content_types() {
    assert_eq!(safe_artwork_content_type("image/PNG"), "image/png");
    assert_eq!(safe_artwork_content_type("image/svg+xml"), "image/jpeg");
    assert_eq!(safe_artwork_content_type("text/html"), "image/jpeg");
  }

  #[test]
  fn loads_artwork_once_per_resolved_track_snapshot() {
    let previous = json!({
      "video": {
        "id": "wms:track-1",
        "artworkResolved": true
      }
    });

    assert!(should_load_artwork(None, "wms:track-1"));
    assert!(!should_load_artwork(Some(&previous), "wms:track-1"));
    assert!(should_load_artwork(Some(&previous), "wms:track-2"));
  }

  #[test]
  fn bounds_untrusted_media_metadata_on_character_boundaries() {
    let input = "🎵".repeat(MAX_METADATA_CHARS + 3);
    let output = truncate_metadata(input);

    assert_eq!(output.chars().count(), MAX_METADATA_CHARS);
    assert!(output.ends_with('🎵'));
  }

  #[test]
  fn supported_commands_require_a_connected_backend() {
    assert!(!should_dispatch_command(&PlaybackCommand::ToggleLike, false)
      .expect("rating stays a no-op"));
    let error = should_dispatch_command(&PlaybackCommand::PlayPause, false)
      .expect_err("transport must not silently succeed while disconnected");
    assert_eq!(error.code, "not_running");
    assert_eq!(
      error.diagnostic.expect("diagnostic should exist").category,
      "backend_not_connected"
    );
    assert!(should_dispatch_command(&PlaybackCommand::PlayPause, true)
      .expect("connected transport should dispatch"));
  }

  #[cfg(target_os = "windows")]
  #[test]
  fn classifies_winrt_hresult_without_media_metadata() {
    assert_eq!(
      classify_windows_hresult(0x8007_0005_u32 as i32),
      "access_denied"
    );
    assert_eq!(
      classify_windows_hresult(0x8004_01F0_u32 as i32),
      "apartment_not_initialized"
    );
    assert_eq!(
      classify_windows_hresult(0x8001_010E_u32 as i32),
      "wrong_thread"
    );
    assert_eq!(classify_windows_hresult(-1), "windows_error");
    assert_eq!(format_windows_hresult(0x8007_0005_u32 as i32), "0x80070005");
  }

  #[cfg(target_os = "windows")]
  #[test]
  fn retains_access_denied_diagnostic_in_discovery_and_whitelisted_log_line() {
    let error = crate::models::CommandError::new(
      "api_unavailable",
      "Windows Media Session is unavailable.",
    )
    .with_diagnostic(
      crate::models::CommandDiagnostic::new("request_manager.await", "access_denied")
        .with_hresult("0x80070005"),
    );

    let discovery = unavailable_discovery(&error);
    assert_eq!(
      discovery.diagnostic.as_ref().map(|value| value.stage.as_str()),
      Some("request_manager.await")
    );

    let diagnostic = error.diagnostic.as_ref().expect("diagnostic should exist");
    let log_line = diagnostic_log_line(1234, "discover", diagnostic)
      .expect("diagnostic should serialize");
    let value: serde_json::Value =
      serde_json::from_str(&log_line).expect("diagnostic log should be JSON");
    assert_eq!(value["timestampUnixMs"], 1234);
    assert_eq!(value["operation"], "discover");
    assert_eq!(value["stage"], "request_manager.await");
    assert_eq!(value["category"], "access_denied");
    assert_eq!(value["hresult"], "0x80070005");
    assert_eq!(value.as_object().map(serde_json::Map::len), Some(5));
    assert!(!log_line.contains("track"));
    assert!(!log_line.contains("artist"));
  }

  #[cfg(target_os = "windows")]
  #[tokio::test]
  async fn serializes_winrt_work_on_one_initialized_worker_thread() {
    let caller = std::thread::current().id();
    let (first, second) = initialized_worker_thread_ids()
      .await
      .expect("worker apartment should initialize");

    assert_ne!(first, caller);
    assert_eq!(first, second);
  }
}
