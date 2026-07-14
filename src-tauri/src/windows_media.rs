use crate::models::{CommandError, CompanionConnectResponse, DiscoveryInfo, PlaybackCommand};
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
  ))
}

#[cfg(target_os = "windows")]
mod platform {
  use std::time::Duration;

  use base64::Engine;
  use serde_json::json;
  use tauri::{AppHandle, Emitter};
  use tokio::time::MissedTickBehavior;
  use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSession, GlobalSystemMediaTransportControlsSessionManager,
    GlobalSystemMediaTransportControlsSessionMediaProperties, GlobalSystemMediaTransportControlsSessionPlaybackStatus,
  };
  use windows::Storage::Streams::DataReader;

  use super::{
    accepted_artwork_size, ensure_command_completed, is_unsupported_command, normalize_timeline,
    safe_artwork_content_type, seek_position_ticks, should_load_artwork, truncate_metadata, CommandError,
    CompanionConnectResponse, DiscoveryInfo, PlaybackCommand, Value, WINDOWS_MEDIA_EVENT,
  };
  use crate::models::CompanionEvent;

  const POLL_INTERVAL: Duration = Duration::from_millis(750);

  fn windows_error(context: &str, _error: windows::core::Error) -> CommandError {
    CommandError::new("api_unavailable", context)
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
      .map_err(|error| windows_error("Unable to request Windows media metadata", error))?
      .get()
      .map_err(|error| windows_error("Unable to read Windows media metadata", error))?;
    let timeline = session
      .GetTimelineProperties()
      .map_err(|error| windows_error("Unable to read Windows media timeline", error))?;
    let playback = session
      .GetPlaybackInfo()
      .map_err(|error| windows_error("Unable to read Windows playback state", error))?;
    let controls = playback
      .Controls()
      .map_err(|error| windows_error("Unable to read Windows media controls", error))?;

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

  fn current_snapshot(
    manager: &GlobalSystemMediaTransportControlsSessionManager,
    previous: Option<&Value>,
  ) -> Result<Option<Value>, CommandError> {
    let Some(session) = manager.GetCurrentSession().ok() else {
      return Ok(None);
    };
    snapshot_for_session(&session, previous).map(Some)
  }

  fn request_manager() -> Result<GlobalSystemMediaTransportControlsSessionManager, CommandError> {
    GlobalSystemMediaTransportControlsSessionManager::RequestAsync()
      .map_err(|error| windows_error("Unable to request Windows Media Session access", error))?
      .get()
      .map_err(|error| windows_error("Unable to initialize Windows Media Session", error))
  }

  #[derive(Default)]
  pub struct WindowsMediaManager {
    manager: Option<GlobalSystemMediaTransportControlsSessionManager>,
    poll_task: Option<tauri::async_runtime::JoinHandle<()>>,
  }

  impl WindowsMediaManager {
    pub async fn discover(&self) -> DiscoveryInfo {
      match request_manager() {
        Ok(_) => DiscoveryInfo {
          available: true,
          api_versions: vec!["Windows.Media.Control".to_string()],
          supports_realtime: true,
          supports_seek: true,
          using_browser_bridge: false,
          detail: Some("Windows Media Session is available; controls depend on the current player.".to_string()),
        },
        Err(error) => DiscoveryInfo {
          available: false,
          api_versions: Vec::new(),
          supports_realtime: false,
          supports_seek: false,
          using_browser_bridge: false,
          detail: Some(error.message),
        },
      }
    }

    pub async fn connect(&mut self, app: &AppHandle) -> Result<CompanionConnectResponse, CommandError> {
      if let (Some(manager), Some(_)) = (&self.manager, &self.poll_task) {
        let initial_state = current_snapshot(manager, None)?;
        let _ = app.emit(
          WINDOWS_MEDIA_EVENT,
          CompanionEvent::Status {
            status: "socket_open".to_string(),
            detail: None,
          },
        );
        return Ok(CompanionConnectResponse { initial_state });
      }

      self.disconnect().await;
      let manager = request_manager()?;
      let initial_state = current_snapshot(&manager, None)?;
      let poll_manager = manager.clone();
      let app_handle = app.clone();
      let mut previous_state = initial_state.clone();

      let _ = app.emit(
        WINDOWS_MEDIA_EVENT,
        CompanionEvent::Status {
          status: "socket_open".to_string(),
          detail: None,
        },
      );

      self.poll_task = Some(tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(POLL_INTERVAL);
        interval.set_missed_tick_behavior(MissedTickBehavior::Skip);
        let mut poll_error_active = false;
        interval.tick().await;
        loop {
          interval.tick().await;
          match current_snapshot(&poll_manager, previous_state.as_ref()) {
            Ok(next_state) => {
              if poll_error_active {
                poll_error_active = false;
                let _ = app_handle.emit(
                  WINDOWS_MEDIA_EVENT,
                  CompanionEvent::Status {
                    status: "socket_open".to_string(),
                    detail: None,
                  },
                );
              }
              if next_state == previous_state {
                continue;
              }
              previous_state = next_state.clone();
              let _ = app_handle.emit(
                WINDOWS_MEDIA_EVENT,
                CompanionEvent::State {
                  state: next_state.unwrap_or_else(|| json!({})),
                },
              );
            }
            Err(error) => {
              if poll_error_active {
                continue;
              }
              poll_error_active = true;
              let _ = app_handle.emit(
                WINDOWS_MEDIA_EVENT,
                CompanionEvent::Status {
                  status: "socket_error".to_string(),
                  detail: Some(error.message),
                },
              );
            }
          }
        }
      }));
      self.manager = Some(manager);

      Ok(CompanionConnectResponse { initial_state })
    }

    pub async fn disconnect(&mut self) {
      if let Some(task) = self.poll_task.take() {
        task.abort();
      }
      self.manager = None;
    }

    pub async fn send_command(&self, command: &PlaybackCommand) -> Result<(), CommandError> {
      if is_unsupported_command(command) {
        return Ok(());
      }

      let Some(manager) = &self.manager else {
        return Ok(());
      };
      let Some(session) = manager.GetCurrentSession().ok() else {
        return Ok(());
      };

      let operation = match command {
        PlaybackCommand::PlayPause => session.TryTogglePlayPauseAsync(),
        PlaybackCommand::Play => session.TryPlayAsync(),
        PlaybackCommand::Pause => session.TryPauseAsync(),
        PlaybackCommand::Next => session.TrySkipNextAsync(),
        PlaybackCommand::Previous => session.TrySkipPreviousAsync(),
        PlaybackCommand::SeekTo { seconds } => {
          let timeline = session
            .GetTimelineProperties()
            .map_err(|error| windows_error("Unable to read Windows media timeline", error))?;
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
      .map_err(|error| windows_error("Windows rejected the media command", error))?;

      let completed = operation
        .get()
        .map_err(|error| windows_error("Windows could not complete the media command", error))?;
      ensure_command_completed(completed)
    }
  }
}

#[cfg(target_os = "windows")]
pub use platform::WindowsMediaManager;

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
    }
  }

  pub async fn connect(&mut self, _app: &tauri::AppHandle) -> Result<CompanionConnectResponse, CommandError> {
    Err(CommandError::new(
      "api_unavailable",
      "Windows Media Session is only available on Windows.",
    ))
  }

  pub async fn disconnect(&mut self) {}

  pub async fn send_command(&self, _command: &PlaybackCommand) -> Result<(), CommandError> {
    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use serde_json::json;

  use super::{
    accepted_artwork_size, ensure_command_completed, is_unsupported_command, normalize_timeline,
    safe_artwork_content_type, seek_position_ticks, should_load_artwork, truncate_metadata, WindowsMediaManager,
    MAX_ARTWORK_BYTES, MAX_METADATA_CHARS, TICKS_PER_SECOND,
  };
  use crate::models::PlaybackCommand;

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

  #[cfg(target_os = "windows")]
  #[tokio::test]
  #[ignore = "manual Windows integration smoke"]
  async fn requests_windows_media_session_access() {
    let discovery = WindowsMediaManager::default().discover().await;
    assert!(discovery.available, "{:?}", discovery.detail);
  }
}
