use crate::models::{CommandError, CompanionConnectResponse, DiscoveryInfo, PlaybackCommand};

pub const WINDOWS_MEDIA_EVENT: &str = "windows-media://event";

fn is_unsupported_command(command: &PlaybackCommand) -> bool {
  matches!(
    command,
    PlaybackCommand::Mute
      | PlaybackCommand::Unmute
      | PlaybackCommand::ToggleLike
      | PlaybackCommand::ToggleDislike
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
  use serde_json::{json, Value};
  use tauri::{AppHandle, Emitter};
  use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSession,
    GlobalSystemMediaTransportControlsSessionManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus,
  };
  use windows::Storage::Streams::DataReader;

  use super::{
    ensure_command_completed, is_unsupported_command, CommandError, CompanionConnectResponse,
    DiscoveryInfo, PlaybackCommand, WINDOWS_MEDIA_EVENT,
  };
  use crate::models::CompanionEvent;

  const TICKS_PER_SECOND: f64 = 10_000_000.0;
  const POLL_INTERVAL: Duration = Duration::from_millis(750);
  const MAX_ARTWORK_BYTES: u64 = 8 * 1024 * 1024;

  fn windows_error(context: &str, error: windows::core::Error) -> CommandError {
    CommandError::new("api_unavailable", format!("{context}: {error}"))
  }

  fn seconds_from_ticks(ticks: i64) -> f64 {
    (ticks.max(0) as f64 / TICKS_PER_SECOND).max(0.0)
  }

  fn playback_track_state(
    status: GlobalSystemMediaTransportControlsSessionPlaybackStatus,
  ) -> i32 {
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

  fn artwork_data_url(
    session: &GlobalSystemMediaTransportControlsSession,
  ) -> Option<String> {
    let properties = session.TryGetMediaPropertiesAsync().ok()?.get().ok()?;
    let reference = properties.Thumbnail().ok()?;
    let stream = reference.OpenReadAsync().ok()?.get().ok()?;
    let size = stream.Size().ok()?.min(MAX_ARTWORK_BYTES);
    if size == 0 {
      return None;
    }

    let input = stream.GetInputStreamAt(0).ok()?;
    let reader = DataReader::CreateDataReader(&input).ok()?;
    let loaded = reader.LoadAsync(size as u32).ok()?.get().ok()?;
    if loaded == 0 {
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
      .filter(|value| value.starts_with("image/"))
      .unwrap_or_else(|| "image/jpeg".to_string());
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

    let source_app = session
      .SourceAppUserModelId()
      .map(|value| value.to_string())
      .unwrap_or_default();
    let title = properties
      .Title()
      .map(|value| value.to_string())
      .unwrap_or_default();
    let artist = properties
      .Artist()
      .map(|value| value.to_string())
      .unwrap_or_default();
    let album = properties
      .AlbumTitle()
      .map(|value| value.to_string())
      .ok()
      .filter(|value| !value.is_empty());
    let duration_seconds = timeline
      .EndTime()
      .map(|value| seconds_from_ticks(value.Duration))
      .unwrap_or(0.0);
    let elapsed_seconds = timeline
      .Position()
      .map(|value| seconds_from_ticks(value.Duration))
      .unwrap_or(0.0)
      .min(duration_seconds.max(0.0));
    let status = playback
      .PlaybackStatus()
      .unwrap_or(GlobalSystemMediaTransportControlsSessionPlaybackStatus::Closed);
    let id = format!(
      "wms:{}:{}:{}:{:.0}",
      source_app, title, artist, duration_seconds
    );
    let previous_cover_url = previous
      .filter(|state| state["video"]["id"].as_str() == Some(id.as_str()))
      .and_then(|state| state["video"]["thumbnails"].as_array())
      .and_then(|thumbnails| thumbnails.first())
      .and_then(|thumbnail| thumbnail["url"].as_str())
      .map(str::to_string);
    let cover_url = previous_cover_url.or_else(|| artwork_data_url(session));

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
          && duration_seconds > 0.0,
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
          detail: Some(
            "Windows Media Session is available; controls depend on the current player."
              .to_string(),
          ),
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

    pub async fn connect(
      &mut self,
      app: &AppHandle,
    ) -> Result<CompanionConnectResponse, CommandError> {
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
          let safe_seconds = if seconds.is_finite() {
            seconds.max(0.0)
          } else {
            0.0
          };
          session.TryChangePlaybackPositionAsync((safe_seconds * TICKS_PER_SECOND) as i64)
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

  pub async fn connect(
    &mut self,
    _app: &tauri::AppHandle,
  ) -> Result<CompanionConnectResponse, CommandError> {
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
  use super::{ensure_command_completed, is_unsupported_command, WindowsMediaManager};
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

  #[cfg(target_os = "windows")]
  #[tokio::test]
  #[ignore = "manual Windows integration smoke"]
  async fn requests_windows_media_session_access() {
    let discovery = WindowsMediaManager::default().discover().await;
    assert!(discovery.available, "{:?}", discovery.detail);
  }
}
