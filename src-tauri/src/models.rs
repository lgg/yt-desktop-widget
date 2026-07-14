use serde::{Deserialize, Deserializer, Serialize};
use tauri::Error as TauriError;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionSettings {
  pub host: String,
  pub port: u16,
  pub source_mode: String,
  pub playback_source: String,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct StoredConnectionSettings {
  host: Option<String>,
  port: Option<u16>,
  source_mode: Option<String>,
  playback_source: Option<String>,
}

impl Default for ConnectionSettings {
  fn default() -> Self {
    Self {
      host: "127.0.0.1".to_string(),
      port: 9863,
      source_mode: "auto".to_string(),
      playback_source: "companion".to_string(),
    }
  }
}

impl<'de> Deserialize<'de> for ConnectionSettings {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: Deserializer<'de>,
  {
    let stored = StoredConnectionSettings::deserialize(deserializer)?;
    let defaults = Self::default();
    let host = stored
      .host
      .map(|value| value.trim().to_string())
      .filter(|value| !value.is_empty())
      .unwrap_or(defaults.host);
    let port = stored.port.filter(|value| *value > 0).unwrap_or(defaults.port);

    Ok(Self {
      host,
      port,
      source_mode: normalize_string_enum(
        stored.source_mode,
        &["auto", "real", "simulator"],
        &defaults.source_mode,
      ),
      playback_source: normalize_string_enum(
        stored.playback_source,
        &["companion", "windowsMediaSession"],
        &defaults.playback_source,
      ),
    })
  }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UiSettings {
  pub playback_controls_visibility: String,
  pub progress_bar_visibility: String,
  pub track_details_visibility: String,
  pub like_dislike_visibility: String,
  pub connection_badge_visibility: String,
  pub mute_button_visibility: String,
  pub widget_block_order: Vec<String>,
  pub collapsed_settings_sections: Vec<String>,
  pub use_artwork_as_playback_control: bool,
  pub hide_settings_button: bool,
  pub hide_close_button: bool,
  pub window_surface_opacity: f64,
  pub artwork_background_opacity: f64,
  pub artwork_gradient_opacity: f64,
  pub widget_size_mode: String,
  pub custom_widget_scale_percentage: f64,
  pub theme_mode: String,
  pub locale: String,
}

impl Default for UiSettings {
  fn default() -> Self {
    Self {
      playback_controls_visibility: "hoverReserved".to_string(),
      progress_bar_visibility: "always".to_string(),
      track_details_visibility: "always".to_string(),
      like_dislike_visibility: "hidden".to_string(),
      connection_badge_visibility: "always".to_string(),
      mute_button_visibility: "hidden".to_string(),
      widget_block_order: widget_block_ids()
        .iter()
        .map(|value| (*value).to_string())
        .collect(),
      collapsed_settings_sections: Vec::new(),
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
#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct StoredUiSettings {
  playback_controls_visibility: Option<String>,
  progress_bar_visibility: Option<String>,
  track_details_visibility: Option<String>,
  like_dislike_visibility: Option<String>,
  connection_badge_visibility: Option<serde_json::Value>,
  #[serde(rename = "hideConnectionBadge")]
  hide_connection_badge: Option<bool>,
  mute_button_visibility: Option<String>,
  widget_block_order: Option<Vec<serde_json::Value>>,
  collapsed_settings_sections: Option<Vec<serde_json::Value>>,
  hide_playback_controls: Option<bool>,
  show_playback_controls_on_hover: Option<bool>,
  hide_progress_bar: Option<bool>,
  hide_track_details: Option<bool>,
  use_artwork_as_playback_control: Option<bool>,
  hide_settings_button: Option<bool>,
  hide_close_button: Option<bool>,
  window_surface_opacity: Option<f64>,
  artwork_background_opacity: Option<f64>,
  artwork_gradient_opacity: Option<f64>,
  widget_size_mode: Option<String>,
  custom_widget_scale_percentage: Option<f64>,
  theme_mode: Option<String>,
  locale: Option<String>,
}
impl<'de> Deserialize<'de> for UiSettings {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: Deserializer<'de>,
  {
    let stored = StoredUiSettings::deserialize(deserializer)?;
    let defaults = Self::default();
    let legacy_playback_visibility = if stored.hide_playback_controls.unwrap_or(false) {
      "hidden"
    } else if stored.show_playback_controls_on_hover.unwrap_or(true) {
      "hoverReserved"
    } else {
      "always"
    };
    let legacy_progress_visibility = if stored.hide_progress_bar.unwrap_or(false) {
      "hidden"
    } else {
      "always"
    };
    let legacy_track_visibility = if stored.hide_track_details.unwrap_or(false) {
      "hidden"
    } else {
      "always"
    };

    Ok(Self {
      playback_controls_visibility: normalize_widget_block_visibility(
        stored.playback_controls_visibility,
        legacy_playback_visibility,
      ),
      progress_bar_visibility: normalize_widget_block_visibility(
        stored.progress_bar_visibility,
        legacy_progress_visibility,
      ),
      track_details_visibility: normalize_widget_block_visibility(
        stored.track_details_visibility,
        legacy_track_visibility,
      ),
      like_dislike_visibility: normalize_widget_block_visibility(
        stored.like_dislike_visibility,
        &defaults.like_dislike_visibility,
      ),
      connection_badge_visibility: normalize_header_visibility_value(
        stored.connection_badge_visibility,
        stored.hide_connection_badge,
        &defaults.connection_badge_visibility,
      ),
      mute_button_visibility: normalize_header_visibility_string(
        stored.mute_button_visibility,
        &defaults.mute_button_visibility,
      ),
      widget_block_order: normalize_widget_block_order(stored.widget_block_order),
      collapsed_settings_sections: normalize_settings_section_ids(
        stored.collapsed_settings_sections,
      ),
      use_artwork_as_playback_control: stored
        .use_artwork_as_playback_control
        .unwrap_or(defaults.use_artwork_as_playback_control),
      hide_settings_button: stored
        .hide_settings_button
        .unwrap_or(defaults.hide_settings_button),
      hide_close_button: stored
        .hide_close_button
        .unwrap_or(defaults.hide_close_button),
      window_surface_opacity: normalize_percentage(
        stored.window_surface_opacity,
        defaults.window_surface_opacity,
      ),
      artwork_background_opacity: normalize_percentage(
        stored.artwork_background_opacity,
        defaults.artwork_background_opacity,
      ),
      artwork_gradient_opacity: normalize_percentage(
        stored.artwork_gradient_opacity,
        defaults.artwork_gradient_opacity,
      ),
      widget_size_mode: normalize_widget_size_mode(
        stored.widget_size_mode,
        &defaults.widget_size_mode,
      ),
      custom_widget_scale_percentage: normalize_custom_widget_scale_percentage(
        stored.custom_widget_scale_percentage,
        defaults.custom_widget_scale_percentage,
      ),
      theme_mode: normalize_string_enum(
        stored.theme_mode,
        &["dark", "light", "system"],
        &defaults.theme_mode,
      ),
      locale: normalize_string_enum(stored.locale, &["en", "ru"], &defaults.locale),
    })
  }
}
fn widget_block_ids() -> &'static [&'static str] {
  &[
    "header",
    "artwork",
    "trackDetails",
    "likeDislike",
    "playbackControls",
    "progress",
  ]
}

fn settings_section_ids() -> &'static [&'static str] {
  &[
    "source",
    "api",
    "ui",
    "layout",
    "size",
    "appearance",
    "window",
    "dev",
    "about",
  ]
}

fn normalize_string_enum(value: Option<String>, allowed: &[&str], fallback: &str) -> String {
  value
    .filter(|candidate| allowed.contains(&candidate.as_str()))
    .unwrap_or_else(|| fallback.to_string())
}

fn normalize_widget_block_visibility(value: Option<String>, fallback: &str) -> String {
  normalize_string_enum(
    value,
    &["always", "hoverReserved", "hoverDynamic", "hidden"],
    fallback,
  )
}

fn normalize_header_visibility_string(value: Option<String>, fallback: &str) -> String {
  normalize_string_enum(value, &["always", "hover", "hidden"], fallback)
}

fn normalize_header_visibility_value(
  value: Option<serde_json::Value>,
  legacy_hidden: Option<bool>,
  fallback: &str,
) -> String {
  match value {
    Some(serde_json::Value::String(candidate)) => {
      normalize_header_visibility_string(Some(candidate), fallback)
    }
    Some(serde_json::Value::Bool(hidden)) => {
      if hidden {
        "hover".to_string()
      } else {
        "always".to_string()
      }
    }
    _ if legacy_hidden.unwrap_or(false) => "hover".to_string(),
    _ => fallback.to_string(),
  }
}

fn normalize_id_list(
  value: Option<Vec<serde_json::Value>>,
  allowed: &[&str],
  append_missing: bool,
) -> Vec<String> {
  let mut normalized = Vec::new();
  for candidate in value.unwrap_or_default() {
    let Some(candidate) = candidate.as_str() else {
      continue;
    };
    if allowed.contains(&candidate) && !normalized.iter().any(|item| item == candidate) {
      normalized.push(candidate.to_string());
    }
  }
  if append_missing {
    for candidate in allowed {
      if !normalized.iter().any(|item| item == candidate) {
        normalized.push((*candidate).to_string());
      }
    }
  }
  normalized
}

fn normalize_widget_block_order(value: Option<Vec<serde_json::Value>>) -> Vec<String> {
  normalize_id_list(value, widget_block_ids(), true)
}

fn normalize_settings_section_ids(value: Option<Vec<serde_json::Value>>) -> Vec<String> {
  normalize_id_list(value, settings_section_ids(), false)
}

fn normalize_percentage(value: Option<f64>, fallback: f64) -> f64 {
  value
    .filter(|candidate| candidate.is_finite())
    .map(|candidate| candidate.clamp(0.0, 100.0).round())
    .unwrap_or(fallback)
}

fn normalize_widget_size_mode(value: Option<String>, fallback: &str) -> String {
  normalize_string_enum(value, &["compact", "default", "large", "custom"], fallback)
}

fn normalize_custom_widget_scale_percentage(value: Option<f64>, fallback: f64) -> f64 {
  value
    .filter(|candidate| candidate.is_finite())
    .map(|candidate| candidate.clamp(75.0, 150.0))
    .unwrap_or(fallback)
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
  #[serde(skip_serializing_if = "Option::is_none")]
  pub diagnostic: Option<CommandDiagnostic>,
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
  Mute,
  Unmute,
  ToggleLike,
  ToggleDislike,
  SeekTo { seconds: f64 },
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum CompanionEvent {
  State {
    state: serde_json::Value,
  },
  Status {
    status: String,
    detail: Option<String>,
  },
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
  #[serde(skip_serializing_if = "Option::is_none")]
  pub diagnostic: Option<CommandDiagnostic>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandDiagnostic {
  pub stage: String,
  pub category: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub hresult: Option<String>,
}

impl CommandDiagnostic {
  pub fn new(stage: impl Into<String>, category: impl Into<String>) -> Self {
    Self {
      stage: stage.into(),
      category: category.into(),
      hresult: None,
    }
  }

  pub fn with_hresult(mut self, hresult: impl Into<String>) -> Self {
    self.hresult = Some(hresult.into());
    self
  }
}

impl CommandError {
  pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
    Self {
      code: code.into(),
      message: message.into(),
      diagnostic: None,
    }
  }

  pub fn with_diagnostic(mut self, diagnostic: CommandDiagnostic) -> Self {
    self.diagnostic = Some(diagnostic);
    self
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
  use super::{AppSettings, CommandDiagnostic, CommandError, DiscoveryInfo};
  use serde_json::json;

  #[test]
  fn preserves_v3_display_preferences_through_native_settings() {
    let settings: AppSettings = serde_json::from_value(json!({
      "ui": {
        "playbackControlsVisibility": "always",
        "connectionBadgeVisibility": "hidden",
        "trackDetailsVisibility": "hidden",
        "likeDislikeVisibility": "hoverDynamic",
        "muteButtonVisibility": "hover",
        "useArtworkAsPlaybackControl": true,
        "themeMode": "light",
        "locale": "ru"
      }
    }))
    .expect("settings should deserialize");

    let serialized = serde_json::to_value(settings).expect("settings should serialize");
    assert_eq!(serialized["ui"]["playbackControlsVisibility"], "always");
    assert_eq!(serialized["ui"]["connectionBadgeVisibility"], "hidden");
    assert_eq!(serialized["ui"]["trackDetailsVisibility"], "hidden");
    assert_eq!(serialized["ui"]["likeDislikeVisibility"], "hoverDynamic");
    assert_eq!(serialized["ui"]["muteButtonVisibility"], "hover");
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

  #[test]
  fn migrates_legacy_widget_visibility_to_v3_modes() {
    let settings: AppSettings = serde_json::from_value(json!({
      "ui": {
        "hidePlaybackControls": false,
        "showPlaybackControlsOnHover": true,
        "hideProgressBar": true,
        "hideTrackDetails": false
      }
    }))
    .expect("legacy display settings should deserialize");

    let serialized = serde_json::to_value(settings).expect("settings should serialize");
    assert_eq!(
      serialized["ui"]["playbackControlsVisibility"],
      "hoverReserved"
    );
    assert_eq!(serialized["ui"]["progressBarVisibility"], "hidden");
    assert_eq!(serialized["ui"]["trackDetailsVisibility"], "always");
    assert_eq!(serialized["ui"]["likeDislikeVisibility"], "hidden");
    assert_eq!(serialized["ui"]["muteButtonVisibility"], "hidden");
    assert!(serialized["ui"].get("hidePlaybackControls").is_none());
    assert!(serialized["ui"]
      .get("showPlaybackControlsOnHover")
      .is_none());
    assert!(serialized["ui"].get("hideProgressBar").is_none());
    assert!(serialized["ui"].get("hideTrackDetails").is_none());
  }

  #[test]
  fn normalizes_v3_widget_order_and_collapsed_settings_sections() {
    let settings: AppSettings = serde_json::from_value(json!({
      "ui": {
        "playbackControlsVisibility": "hoverDynamic",
        "progressBarVisibility": "invalid",
        "trackDetailsVisibility": "hoverReserved",
        "likeDislikeVisibility": "always",
        "muteButtonVisibility": "hover",
        "widgetBlockOrder": ["progress", "header", "progress", "unknown"],
        "collapsedSettingsSections": ["ui", "api", "ui", "unknown"]
      }
    }))
    .expect("v3 settings should deserialize");

    let serialized = serde_json::to_value(settings).expect("settings should serialize");
    assert_eq!(
      serialized["ui"]["playbackControlsVisibility"],
      "hoverDynamic"
    );
    assert_eq!(serialized["ui"]["progressBarVisibility"], "always");
    assert_eq!(serialized["ui"]["trackDetailsVisibility"], "hoverReserved");
    assert_eq!(serialized["ui"]["likeDislikeVisibility"], "always");
    assert_eq!(serialized["ui"]["muteButtonVisibility"], "hover");
    assert_eq!(
      serialized["ui"]["widgetBlockOrder"],
      json!([
        "progress",
        "header",
        "artwork",
        "trackDetails",
        "likeDislike",
        "playbackControls"
      ])
    );
    assert_eq!(
      serialized["ui"]["collapsedSettingsSections"],
      json!(["ui", "api"])
    );
  }

  #[test]
  fn defaults_and_preserves_the_user_facing_playback_source() {
    let legacy: AppSettings = serde_json::from_value(json!({
      "api": { "sourceMode": "real" }
    }))
    .expect("legacy settings should deserialize");
    let legacy_json = serde_json::to_value(legacy).expect("legacy settings should serialize");
    assert_eq!(legacy_json["api"]["playbackSource"], "companion");

    let windows_media: AppSettings = serde_json::from_value(json!({
      "api": {
        "sourceMode": "real",
        "playbackSource": "windowsMediaSession"
      }
    }))
    .expect("WMS settings should deserialize");
    let windows_media_json =
      serde_json::to_value(windows_media).expect("WMS settings should serialize");
    assert_eq!(
      windows_media_json["api"]["playbackSource"],
      "windowsMediaSession"
    );
  }

  #[test]
  fn serializes_safe_command_diagnostics_separately_from_public_copy() {
    let error = CommandError::new(
      "api_unavailable",
      "Windows Media Session is unavailable.",
    )
    .with_diagnostic(
      CommandDiagnostic::new("request_manager.await", "access_denied")
        .with_hresult("0x80070005"),
    );

    let serialized = serde_json::to_value(error).expect("error should serialize");
    assert_eq!(serialized["message"], "Windows Media Session is unavailable.");
    assert_eq!(serialized["diagnostic"]["stage"], "request_manager.await");
    assert_eq!(serialized["diagnostic"]["hresult"], "0x80070005");
    assert_eq!(serialized["diagnostic"]["category"], "access_denied");
    assert!(serialized.to_string().find("track").is_none());
    assert!(serialized.to_string().find("artist").is_none());
  }

  #[test]
  fn serializes_safe_discovery_diagnostics_for_recovery_ui() {
    let discovery = DiscoveryInfo {
      available: false,
      api_versions: Vec::new(),
      supports_realtime: false,
      supports_seek: false,
      using_browser_bridge: false,
      detail: Some("Windows Media Session is unavailable.".to_string()),
      diagnostic: Some(
        CommandDiagnostic::new("request_manager.await", "access_denied")
          .with_hresult("0x80070005"),
      ),
    };

    let serialized = serde_json::to_value(discovery).expect("discovery should serialize");
    assert_eq!(serialized["diagnostic"]["stage"], "request_manager.await");
    assert_eq!(serialized["diagnostic"]["hresult"], "0x80070005");
    assert_eq!(serialized["diagnostic"]["category"], "access_denied");
  }
}
