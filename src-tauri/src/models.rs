use serde::{Deserialize, Deserializer, Serialize};
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
  #[serde(
    alias = "hideConnectionBadge",
    deserialize_with = "deserialize_connection_badge_visibility"
  )]
  pub connection_badge_visibility: String,
  pub hide_track_details: bool,
  pub use_artwork_as_playback_control: bool,
  pub hide_settings_button: bool,
  pub hide_close_button: bool,
  pub window_surface_opacity: f64,
  pub artwork_background_opacity: f64,
  pub artwork_gradient_opacity: f64,
  #[serde(deserialize_with = "deserialize_widget_size_mode")]
  pub widget_size_mode: String,
  #[serde(deserialize_with = "deserialize_custom_widget_scale_percentage")]
  pub custom_widget_scale_percentage: f64,
  pub theme_mode: String,
  pub locale: String,
}

impl Default for UiSettings {
  fn default() -> Self {
    Self {
      hide_playback_controls: false,
      show_playback_controls_on_hover: true,
      hide_progress_bar: false,
      connection_badge_visibility: "always".to_string(),
      hide_track_details: false,
      use_artwork_as_playback_control: false,
      hide_settings_button: true,
      hide_close_button: true,
      window_surface_opacity: 100.0,
      artwork_background_opacity: 100.0,
      artwork_gradient_opacity: 100.0,
      widget_size_mode: "default".to_string(),
      custom_widget_scale_percentage: 100.0,
      theme_mode: "dark".to_string(),
      locale: "en".to_string(),
    }
  }
}

fn deserialize_connection_badge_visibility<'de, D>(deserializer: D) -> Result<String, D::Error>
where
  D: Deserializer<'de>,
{
  #[derive(Deserialize)]
  #[serde(untagged)]
  enum StoredVisibility {
    Explicit(String),
    LegacyHiddenUntilHover(bool),
  }

  let visibility = StoredVisibility::deserialize(deserializer)?;
  Ok(match visibility {
    StoredVisibility::Explicit(value)
      if matches!(value.as_str(), "always" | "hover" | "hidden") =>
    {
      value
    }
    StoredVisibility::LegacyHiddenUntilHover(true) => "hover".to_string(),
    StoredVisibility::Explicit(_) | StoredVisibility::LegacyHiddenUntilHover(false) => {
      "always".to_string()
    }
  })
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

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettings {
  pub api: ConnectionSettings,
  pub ui: UiSettings,
  pub window: WindowSettings,
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
        "connectionBadgeVisibility": "hidden",
        "hideTrackDetails": true,
        "useArtworkAsPlaybackControl": true,
        "themeMode": "light",
        "locale": "ru"
      }
    }))
    .expect("settings should deserialize");

    let serialized = serde_json::to_value(settings).expect("settings should serialize");
    assert_eq!(serialized["ui"]["showPlaybackControlsOnHover"], false);
    assert_eq!(serialized["ui"]["connectionBadgeVisibility"], "hidden");
    assert_eq!(serialized["ui"]["hideTrackDetails"], true);
    assert_eq!(serialized["ui"]["useArtworkAsPlaybackControl"], true);
    assert_eq!(serialized["ui"]["themeMode"], "light");
    assert_eq!(serialized["ui"]["locale"], "ru");
  }

  #[test]
  fn migrates_legacy_connection_badge_boolean_to_explicit_visibility() {
    let legacy_hover: AppSettings = serde_json::from_value(json!({
      "ui": { "hideConnectionBadge": true }
    }))
    .expect("legacy hover setting should deserialize");
    let legacy_always: AppSettings = serde_json::from_value(json!({
      "ui": { "hideConnectionBadge": false }
    }))
    .expect("legacy always setting should deserialize");

    let hover = serde_json::to_value(legacy_hover).expect("hover should serialize");
    let always = serde_json::to_value(legacy_always).expect("always should serialize");
    assert_eq!(hover["ui"]["connectionBadgeVisibility"], "hover");
    assert_eq!(always["ui"]["connectionBadgeVisibility"], "always");
    assert!(hover["ui"].get("hideConnectionBadge").is_none());
  }

  #[test]
  fn legacy_settings_receive_current_transparency_defaults() {
    let settings: AppSettings = serde_json::from_value(json!({
      "ui": {
        "themeMode": "dark"
      }
    }))
    .expect("legacy settings should deserialize");

    let serialized = serde_json::to_value(settings).expect("settings should serialize");
    assert_eq!(serialized["ui"]["windowSurfaceOpacity"], 100.0);
    assert_eq!(serialized["ui"]["artworkBackgroundOpacity"], 100.0);
    assert_eq!(serialized["ui"]["artworkGradientOpacity"], 100.0);
  }

  #[test]
  fn preserves_widget_size_preferences_and_migrates_legacy_defaults() {
    let custom: AppSettings = serde_json::from_value(json!({
      "ui": {
        "widgetSizeMode": "custom",
        "customWidgetScalePercentage": 119.047619
      }
    }))
    .expect("custom widget size should deserialize");
    let legacy: AppSettings = serde_json::from_value(json!({
      "ui": { "themeMode": "dark" }
    }))
    .expect("legacy widget size should deserialize");

    let custom = serde_json::to_value(custom).expect("custom settings should serialize");
    let legacy = serde_json::to_value(legacy).expect("legacy settings should serialize");
    assert_eq!(custom["ui"]["widgetSizeMode"], "custom");
    assert_eq!(custom["ui"]["customWidgetScalePercentage"], 119.047619);
    assert_eq!(legacy["ui"]["widgetSizeMode"], "default");
    assert_eq!(legacy["ui"]["customWidgetScalePercentage"], 100.0);
  }

  #[test]
  fn repairs_invalid_native_widget_size_preferences() {
    let settings: AppSettings = serde_json::from_value(json!({
      "ui": {
        "widgetSizeMode": "stretched",
        "customWidgetScalePercentage": 999.0
      }
    }))
    .expect("invalid widget size should be repairable");

    let serialized = serde_json::to_value(settings).expect("settings should serialize");
    assert_eq!(serialized["ui"]["widgetSizeMode"], "default");
    assert_eq!(serialized["ui"]["customWidgetScalePercentage"], 150.0);
  }
}

fn deserialize_widget_size_mode<'de, D>(deserializer: D) -> Result<String, D::Error>
where
  D: Deserializer<'de>,
{
  let value = String::deserialize(deserializer)?;
  Ok(
    if matches!(value.as_str(), "compact" | "default" | "large" | "custom") {
      value
    } else {
      "default".to_string()
    },
  )
}

fn deserialize_custom_widget_scale_percentage<'de, D>(deserializer: D) -> Result<f64, D::Error>
where
  D: Deserializer<'de>,
{
  let value = f64::deserialize(deserializer)?;
  Ok(if value.is_finite() {
    value.clamp(75.0, 150.0)
  } else {
    100.0
  })
}
