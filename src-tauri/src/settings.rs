use std::path::PathBuf;
use std::sync::Mutex;

use crate::models::{AppSettings, CommandError, WindowPosition};

pub struct SettingsStore {
  path: PathBuf,
  cache: Mutex<AppSettings>,
}

impl SettingsStore {
  pub fn new(path: PathBuf) -> Result<Self, CommandError> {
    let initial = if path.exists() {
      let content = std::fs::read_to_string(&path)?;
      serde_json::from_str(&content).unwrap_or_default()
    } else {
      AppSettings::default()
    };

    let store = Self {
      path,
      cache: Mutex::new(initial.clone()),
    };

    store.flush()?;
    Ok(store)
  }

  pub fn load(&self) -> AppSettings {
    self.cache.lock().expect("settings cache poisoned").clone()
  }

  pub fn save(&self, settings: &AppSettings) -> Result<(), CommandError> {
    *self.cache.lock().expect("settings cache poisoned") = settings.clone();
    self.flush()
  }

  pub fn flush(&self) -> Result<(), CommandError> {
    let settings = self.load();
    self.write_to_disk(&settings)
  }

  pub fn update_window_position_cache(&self, label: &str, position: WindowPosition) -> bool {
    let mut cache = self.cache.lock().expect("settings cache poisoned");
    let slot = match label {
      "main" => &mut cache.window.main_position,
      "settings" => &mut cache.window.settings_position,
      _ => return false,
    };

    if slot.as_ref() == Some(&position) {
      return false;
    }

    *slot = Some(position);
    true
  }

  fn write_to_disk(&self, settings: &AppSettings) -> Result<(), CommandError> {
    let parent = self
      .path
      .parent()
      .ok_or_else(|| CommandError::unknown("Settings path has no parent directory."))?;
    std::fs::create_dir_all(parent)?;
    let content = serde_json::to_string_pretty(settings)
      .map_err(|error| CommandError::unknown(error.to_string()))?;
    std::fs::write(&self.path, content)?;
    Ok(())
  }
}
