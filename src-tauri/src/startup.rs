use crate::models::CommandError;

const RUN_KEY_PATH: &str = r#"Software\Microsoft\Windows\CurrentVersion\Run"#;
const RUN_VALUE_NAME: &str = "YTMDesktopWidget";

#[cfg(target_os = "windows")]
pub fn set_launch_on_startup(_app: &tauri::AppHandle, enabled: bool) -> Result<(), CommandError> {
  use winreg::enums::{HKEY_CURRENT_USER, KEY_READ, KEY_WRITE};
  use winreg::RegKey;

  let hkcu = RegKey::predef(HKEY_CURRENT_USER);
  let (run_key, _) = hkcu
    .create_subkey(RUN_KEY_PATH)
    .map_err(|error| CommandError::unknown(error.to_string()))?;

  if enabled {
    let executable = std::env::current_exe().map_err(|error| CommandError::unknown(error.to_string()))?;
    let value = format!(r#""{}""#, executable.display());
    run_key
      .set_value(RUN_VALUE_NAME, &value)
      .map_err(|error| CommandError::unknown(error.to_string()))?;
  } else if hkcu.open_subkey_with_flags(RUN_KEY_PATH, KEY_READ | KEY_WRITE).is_ok() {
    let _ = run_key.delete_value(RUN_VALUE_NAME);
  }

  Ok(())
}

#[cfg(not(target_os = "windows"))]
pub fn set_launch_on_startup(_app: &tauri::AppHandle, _enabled: bool) -> Result<(), CommandError> {
  Ok(())
}