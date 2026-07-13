use serde::{Deserialize, Serialize};
use tauri::Error as TauriError;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ConnectionSettings {
  pub host: String,
  pub port: u16,
  pub source_mode: String,
}

impl Default for ConnectionSettings {
  fn default() -> Self {
    Self {
      host: "127.0.0.1".to_string(),
      port: 9863,
      source_mode: "auto".to_string(),
    }
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct UiSettings {
  pub hide_playback_controls: bool,
  pub show_playback_controls_on_hover: bool,
  pub hide_progress_bar: bool,
  pub hide_connection_badge: bool,
  pub hide_settings_button: bool,
  pub hide_close_button: bool,
  pub theme_mode: String,
}

impl Default for UiSettings {
  fn default() -> Self {
    Self {
      hide_playback_controls: false,
      show_playback_controls_on_hover: true,
      hide_progress_bar: false,
      hide_connection_badge: false,
      hide_settings_button: true,
      hide_close_button: true,
      theme_mode: "dark".to_string(),
    }
  }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub struct WindowPosition {
  pub x: i32,
  pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct WindowSettings {
  pub always_on_top: bool,
  pub launch_on_startup: bool,
  pub close_button_action: String,
  pub main_position: Option<WindowPosition>,
  pub settings_position: Option<WindowPosition>,
}

impl Default for WindowSettings {
  fn default() -> Self {
    Self {
      always_on_top: false,
      launch_on_startup: false,
      close_button_action: "exit".to_string(),
      main_position: None,
      settings_position: None,
    }
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettings {
  pub api: ConnectionSettings,
  pub ui: UiSettings,
  pub window: WindowSettings,
}

impl Default for AppSettings {
  fn default() -> Self {
    Self {
      api: ConnectionSettings::default(),
      ui: UiSettings::default(),
      window: WindowSettings::default(),
    }
  }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveryInfo {
  pub available: bool,
  pub api_versions: Vec<String>,
  pub supports_realtime: bool,
  pub supports_seek: bool,
  pub using_browser_bridge: bool,
  pub detail: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompanionConnectResponse {
  pub initial_state: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum PlaybackCommand {
  PlayPause,
  Play,
  Pause,
  Next,
  Previous,
  SeekTo { seconds: f64 },
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum CompanionEvent {
  State { state: serde_json::Value },
  Status { status: String, detail: Option<String> },
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompanionAuthEvent {
  pub authorized: bool,
}

#[derive(Debug, Clone, Serialize, thiserror::Error)]
#[error("{message}")]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
  pub code: String,
  pub message: String,
}

impl CommandError {
  pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
    Self {
      code: code.into(),
      message: message.into(),
    }
  }

  pub fn unknown(message: impl Into<String>) -> Self {
    Self::new("unknown", message)
  }

  pub fn auth_required() -> Self {
    Self::new(
      "auth_required",
      "Companion authorization is required before the widget can connect.",
    )
  }
}

impl From<std::io::Error> for CommandError {
  fn from(error: std::io::Error) -> Self {
    Self::new("unknown", error.to_string())
  }
}

impl From<TauriError> for CommandError {
  fn from(error: TauriError) -> Self {
    Self::new("unknown", error.to_string())
  }
}

impl From<keyring::Error> for CommandError {
  fn from(error: keyring::Error) -> Self {
    Self::new("unknown", error.to_string())
  }
}

#[cfg(test)]
mod tests {
  use super::AppSettings;
  use serde_json::json;

  #[test]
  fn preserves_hover_and_connection_badge_preferences_through_native_settings() {
    let settings: AppSettings = serde_json::from_value(json!({
      "ui": {
        "showPlaybackControlsOnHover": false,
        "hideConnectionBadge": true
      }
    }))
    .expect("settings should deserialize");

    let serialized = serde_json::to_value(settings).expect("settings should serialize");
    assert_eq!(serialized["ui"]["showPlaybackControlsOnHover"], false);
    assert_eq!(serialized["ui"]["hideConnectionBadge"], true);
  }
}
