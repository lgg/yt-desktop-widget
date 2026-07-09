mod companion;
mod models;
mod settings;
mod startup;

use std::sync::{
  atomic::{AtomicBool, Ordering},
  Mutex,
};
use std::time::Duration;

use companion::CompanionManager;
use models::{
  AppSettings, CommandError, CompanionAuthEvent, CompanionConnectResponse, DiscoveryInfo, PlaybackCommand,
  WindowPosition,
};
use settings::SettingsStore;
use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{
  window::Color, AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, Position, Size,
  WebviewWindow, Window, WindowEvent,
};
use tauri_plugin_opener::OpenerExt;

const REPOSITORY_URL: &str = "https://github.com/lgg/yt-desktop-widget";
const COMPANION_EVENT: &str = "companion://event";
const COMPANION_AUTH_CHANGED_EVENT: &str = "companion://auth-changed";
const SETTINGS_CHANGED_EVENT: &str = "app-settings://changed";
const WINDOW_VISIBILITY_EVENT: &str = "app-window://visibility";
const WINDOW_LABELS: [&str; 2] = ["main", "settings"];
const WINDOW_POSITION_FLUSH_DELAY: Duration = Duration::from_millis(320);
const WINDOW_FOCUS_LOSS_DELAY: Duration = Duration::from_millis(80);
const MAIN_WINDOW_WIDTH: f64 = 336.0;
const MAIN_WINDOW_MIN_HEIGHT: f64 = 360.0;
const MAIN_WINDOW_MAX_HEIGHT: f64 = 780.0;
#[cfg(debug_assertions)]
const MCP_BRIDGE_BASE_PORT: u16 = 39223;

pub struct AppState {
  settings: SettingsStore,
  companion: tokio::sync::Mutex<CompanionManager>,
  quitting: AtomicBool,
  app_has_focused_window: AtomicBool,
  window_position_flush_task: Mutex<Option<tauri::async_runtime::JoinHandle<()>>>,
  window_focus_loss_task: Mutex<Option<tauri::async_runtime::JoinHandle<()>>>,
}

impl AppState {
  fn new(settings: SettingsStore) -> Self {
    Self {
      settings,
      companion: tokio::sync::Mutex::new(CompanionManager::default()),
      quitting: AtomicBool::new(false),
      app_has_focused_window: AtomicBool::new(false),
      window_position_flush_task: Mutex::new(None),
      window_focus_loss_task: Mutex::new(None),
    }
  }
}

#[tauri::command]
fn load_settings(state: tauri::State<'_, AppState>) -> Result<AppSettings, CommandError> {
  Ok(state.settings.load())
}

#[tauri::command]
fn save_settings(
  app: AppHandle,
  state: tauri::State<'_, AppState>,
  settings: AppSettings,
) -> Result<AppSettings, CommandError> {
  cancel_window_position_flush(&state);
  let merged_settings = merge_window_positions(state.settings.load(), settings);
  state.settings.save(&merged_settings)?;
  apply_window_preferences(&app, &merged_settings)?;
  startup::set_launch_on_startup(&app, merged_settings.window.launch_on_startup)?;
  let _ = app.emit(SETTINGS_CHANGED_EVENT, &merged_settings);
  Ok(merged_settings)
}

#[tauri::command]
fn show_window(app: AppHandle, label: String) -> Result<(), CommandError> {
  show_window_internal(&app, &label)
}

#[tauri::command]
fn hide_window(app: AppHandle, label: String) -> Result<(), CommandError> {
  hide_window_internal(&app, &label)
}

#[tauri::command]
fn set_main_window_height(app: AppHandle, height: f64) -> Result<(), CommandError> {
  let window = app_window(&app, "main")?;
  let clamped_height = height.clamp(MAIN_WINDOW_MIN_HEIGHT, MAIN_WINDOW_MAX_HEIGHT).round();
  window.set_size(Size::Logical(LogicalSize::new(MAIN_WINDOW_WIDTH, clamped_height)))?;
  Ok(())
}

#[tauri::command]
fn close_widget(app: AppHandle, action: String) -> Result<(), CommandError> {
  match action.as_str() {
    "hideToTray" => hide_widget_windows_internal(&app),
    "exit" => quit_application(&app),
    _ => Err(CommandError::unknown(format!("Unsupported close action: {action}"))),
  }
}

#[tauri::command]
fn hide_widget_stack(app: AppHandle) -> Result<(), CommandError> {
  hide_widget_windows_internal(&app)
}

#[tauri::command]
fn exit_app(app: AppHandle) -> Result<(), CommandError> {
  quit_application(&app)
}

#[tauri::command]
fn open_repository(app: AppHandle) -> Result<(), CommandError> {
  app
    .opener()
    .open_url(REPOSITORY_URL, None::<&str>)
    .map_err(|error| CommandError::unknown(error.to_string()))?;
  Ok(())
}

#[tauri::command]
fn companion_has_auth(state: tauri::State<'_, AppState>) -> Result<bool, CommandError> {
  let settings = state.settings.load();
  Ok(companion::load_token(&settings.api)?.is_some())
}

#[tauri::command]
async fn companion_discover(
  state: tauri::State<'_, AppState>,
) -> Result<DiscoveryInfo, CommandError> {
  let settings = state.settings.load();
  let manager = state.companion.lock().await;
  Ok(manager.discover(&settings.api).await)
}

#[tauri::command]
async fn companion_connect(
  app: AppHandle,
  state: tauri::State<'_, AppState>,
  preserve_auth_on_failure: Option<bool>,
) -> Result<CompanionConnectResponse, CommandError> {
  let _ = preserve_auth_on_failure;
  let settings = state.settings.load();
  let token = companion::load_token(&settings.api)?.ok_or_else(CommandError::auth_required)?;
  let mut manager = state.companion.lock().await;
  let initial_state = match manager
    .connect(&app, &settings.api, &token, COMPANION_EVENT)
    .await
  {
    Ok(initial_state) => initial_state,
    Err(companion::CompanionError::AuthRequired) => {
      return Err(CommandError::auth_required());
    }
    Err(error) => return Err(error.into()),
  };
  Ok(CompanionConnectResponse { initial_state })
}

#[tauri::command]
async fn companion_disconnect(state: tauri::State<'_, AppState>) -> Result<(), CommandError> {
  let mut manager = state.companion.lock().await;
  manager.disconnect().await?;
  Ok(())
}

#[tauri::command]
async fn companion_request_auth_code(
  state: tauri::State<'_, AppState>,
) -> Result<companion::AuthCodeResponse, CommandError> {
  let settings = state.settings.load();
  Ok(companion::request_auth_code(&settings.api).await?)
}

#[tauri::command]
async fn companion_complete_auth(
  app: AppHandle,
  state: tauri::State<'_, AppState>,
  code: String,
) -> Result<(), CommandError> {
  let settings = state.settings.load();
  let token = companion::complete_auth(&settings.api, &code).await?;
  companion::validate_token(&settings.api, &token).await?;
  companion::store_token(&settings.api, &token)?;
  let _ = app.emit(
    COMPANION_AUTH_CHANGED_EVENT,
    CompanionAuthEvent { authorized: true },
  );
  Ok(())
}

#[tauri::command]
async fn companion_clear_auth(
  app: AppHandle,
  state: tauri::State<'_, AppState>,
) -> Result<(), CommandError> {
  let settings = state.settings.load();
  companion::clear_token(&settings.api)?;
  let mut manager = state.companion.lock().await;
  manager.disconnect().await?;
  let _ = app.emit(
    COMPANION_AUTH_CHANGED_EVENT,
    CompanionAuthEvent { authorized: false },
  );
  Ok(())
}

#[tauri::command]
async fn companion_send_command(
  state: tauri::State<'_, AppState>,
  command: PlaybackCommand,
) -> Result<(), CommandError> {
  let settings = state.settings.load();
  let token = companion::load_token(&settings.api)?.ok_or_else(CommandError::auth_required)?;
  let manager = state.companion.lock().await;
  match manager.send_command(&settings.api, &token, &command).await {
    Ok(()) => Ok(()),
    Err(companion::CompanionError::AuthRequired) => Err(CommandError::auth_required()),
    Err(error) => Err(error.into()),
  }
}

fn app_window(app: &AppHandle, label: &str) -> Result<WebviewWindow, CommandError> {
  app
    .get_webview_window(label)
    .ok_or_else(|| CommandError::unknown(format!("Window is not available: {label}")))
}

fn merge_window_positions(mut current: AppSettings, mut next: AppSettings) -> AppSettings {
  next.window.main_position = current.window.main_position.take().or(next.window.main_position);
  next.window.settings_position = current
    .window
    .settings_position
    .take()
    .or(next.window.settings_position);
  next
}

fn stored_position(settings: &AppSettings, label: &str) -> Option<WindowPosition> {
  match label {
    "main" => settings.window.main_position,
    "settings" => settings.window.settings_position,
    _ => None,
  }
}

fn apply_window_visuals(window: &WebviewWindow) {
  let _ = window.set_shadow(false);
  let _ = window.set_decorations(false);
  let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
}

fn emit_window_visibility(window: &WebviewWindow, visible: bool) {
  let _ = window.emit(WINDOW_VISIBILITY_EVENT, visible);
}

fn any_app_window_focused(app: &AppHandle) -> bool {
  WINDOW_LABELS.iter().any(|label| {
    app
      .get_webview_window(label)
      .and_then(|window| window.is_focused().ok())
      .unwrap_or(false)
  })
}

fn cancel_window_focus_loss(state: &AppState) {
  let mut pending_task = state
    .window_focus_loss_task
    .lock()
    .expect("window focus loss task poisoned");

  if let Some(task) = pending_task.take() {
    task.abort();
  }
}

fn schedule_window_focus_loss(app: &AppHandle) {
  let state = app.state::<AppState>();
  cancel_window_focus_loss(&state);

  let app_handle = app.clone();
  let task = tauri::async_runtime::spawn(async move {
    tokio::time::sleep(WINDOW_FOCUS_LOSS_DELAY).await;
    let state = app_handle.state::<AppState>();

    if !any_app_window_focused(&app_handle) {
      state.app_has_focused_window.store(false, Ordering::SeqCst);
    }

    let mut pending_task = state
      .window_focus_loss_task
      .lock()
      .expect("window focus loss task poisoned");
    pending_task.take();
  });

  *state
    .window_focus_loss_task
    .lock()
    .expect("window focus loss task poisoned") = Some(task);
}

fn restore_visible_aux_windows(app: &AppHandle) {
  let settings = app.state::<AppState>().settings.load();

  if let Some(window) = app.get_webview_window("settings") {
    if window.is_visible().unwrap_or(false) {
      let _ = window.show();
      let _ = window.unminimize();
      let _ = window.set_always_on_top(true);
      if !settings.window.always_on_top {
        let _ = window.set_always_on_top(false);
      }
      emit_window_visibility(&window, true);
    }
  }
}

fn show_window_internal(app: &AppHandle, label: &str) -> Result<(), CommandError> {
  let window = app_window(app, label)?;
  apply_window_visuals(&window);
  window.show()?;
  window.unminimize()?;
  window.set_focus()?;
  emit_window_visibility(&window, true);

  if label == "main" {
    restore_visible_aux_windows(app);
  }

  Ok(())
}

fn restore_main_window(app: &AppHandle) -> Result<(), CommandError> {
  show_window_internal(app, "main")
}

fn hide_window_internal(app: &AppHandle, label: &str) -> Result<(), CommandError> {
  let window = app_window(app, label)?;
  window.hide()?;
  emit_window_visibility(&window, false);

  if label != "main" {
    let _ = restore_main_window(app);
  }

  Ok(())
}

fn hide_widget_windows_internal(app: &AppHandle) -> Result<(), CommandError> {
  let state = app.state::<AppState>();
  cancel_window_focus_loss(&state);
  state.app_has_focused_window.store(false, Ordering::SeqCst);

  for label in ["settings", "main"] {
    if let Some(window) = app.get_webview_window(label) {
      if window.is_visible()? {
        window.hide()?;
      }
      emit_window_visibility(&window, false);
    }
  }

  Ok(())
}

fn toggle_main_window(app: &AppHandle) -> Result<(), CommandError> {
  let window = app_window(app, "main")?;
  if window.is_visible()? {
    window.hide()?;
    emit_window_visibility(&window, false);
  } else {
    show_window_internal(app, "main")?;
  }

  Ok(())
}

fn apply_window_preferences(app: &AppHandle, settings: &AppSettings) -> Result<(), CommandError> {
  for label in WINDOW_LABELS {
    if let Some(window) = app.get_webview_window(label) {
      apply_window_visuals(&window);
      window.set_always_on_top(settings.window.always_on_top)?;

      if let Some(position) = stored_position(settings, label) {
        window.set_position(Position::Physical(PhysicalPosition::new(position.x, position.y)))?;
      }
    }
  }

  Ok(())
}

fn cancel_window_position_flush(state: &AppState) {
  let mut pending_task = state
    .window_position_flush_task
    .lock()
    .expect("window position flush task poisoned");

  if let Some(task) = pending_task.take() {
    task.abort();
  }
}

fn flush_window_positions(app: &AppHandle) {
  let state = app.state::<AppState>();
  cancel_window_position_flush(&state);
  let _ = state.settings.flush();
}

fn schedule_window_position_flush(app: &AppHandle) {
  let state = app.state::<AppState>();
  cancel_window_position_flush(&state);

  let app_handle = app.clone();
  let task = tauri::async_runtime::spawn(async move {
    tokio::time::sleep(WINDOW_POSITION_FLUSH_DELAY).await;
    let state = app_handle.state::<AppState>();
    let _ = state.settings.flush();

    let mut pending_task = state
      .window_position_flush_task
      .lock()
      .expect("window position flush task poisoned");
    pending_task.take();
  });

  *state
    .window_position_flush_task
    .lock()
    .expect("window position flush task poisoned") = Some(task);
}

fn cache_window_position(app: &AppHandle, label: &str, position: PhysicalPosition<i32>) {
  let state = app.state::<AppState>();
  if state.settings.update_window_position_cache(
    label,
    WindowPosition {
      x: position.x,
      y: position.y,
    },
  ) {
    schedule_window_position_flush(app);
  }
}

fn quit_application(app: &AppHandle) -> Result<(), CommandError> {
  let state = app.state::<AppState>();
  state.quitting.store(true, Ordering::SeqCst);
  cancel_window_focus_loss(&state);
  flush_window_positions(app);
  app.exit(0);
  Ok(())
}

fn setup_tray(app: &AppHandle) -> Result<(), CommandError> {
  let show = MenuItemBuilder::new("Show Widget").id("show").build(app)?;
  let settings = MenuItemBuilder::new("Settings").id("settings").build(app)?;
  let quit = MenuItemBuilder::new("Quit").id("quit").build(app)?;
  let menu = MenuBuilder::new(app).items(&[&show, &settings, &quit]).build()?;

  let mut tray_builder = TrayIconBuilder::with_id("main-tray")
    .menu(&menu)
    .tooltip("YTM Desktop Widget");

  if let Some(icon) = app.default_window_icon().cloned() {
    tray_builder = tray_builder.icon(icon);
  }

  tray_builder
    .on_menu_event(|app, event| match event.id().as_ref() {
      "show" => {
        let _ = show_window_internal(app, "main");
      }
      "settings" => {
        let _ = show_window_internal(app, "settings");
      }
      "quit" => {
        let _ = quit_application(app);
      }
      _ => {}
    })
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        let _ = toggle_main_window(tray.app_handle());
      }
    })
    .build(app)?;

  Ok(())
}

fn handle_window_event(window: &Window, event: &WindowEvent) {
  let label = window.label().to_string();
  let app = window.app_handle();
  let state = app.state::<AppState>();

  match event {
    WindowEvent::CloseRequested { api, .. } if matches!(label.as_str(), "main" | "settings") => {
      if !state.quitting.load(Ordering::SeqCst) {
        api.prevent_close();
        flush_window_positions(&app);
        let _ = hide_window_internal(&app, &label);
      }
    }
    WindowEvent::Focused(true) if matches!(label.as_str(), "main" | "settings") => {
      cancel_window_focus_loss(&state);
      let app_was_inactive = !state.app_has_focused_window.swap(true, Ordering::SeqCst);
      if label == "main" && app_was_inactive {
        restore_visible_aux_windows(&app);
      }
    }
    WindowEvent::Focused(false) if matches!(label.as_str(), "main" | "settings") => {
      schedule_window_focus_loss(&app)
    }
    WindowEvent::Moved(position) if matches!(label.as_str(), "main" | "settings") => {
      cache_window_position(&app, &label, *position)
    }
    _ => {}
  }
}

pub fn run() {
  let builder = tauri::Builder::default().plugin(tauri_plugin_opener::init());

  #[cfg(debug_assertions)]
  let builder = builder.plugin(
    tauri_plugin_mcp_bridge::Builder::new()
      .base_port(MCP_BRIDGE_BASE_PORT)
      .build(),
  );

  builder
    .setup(|app| {
      let config_dir = app.path().app_config_dir()?;
      std::fs::create_dir_all(&config_dir)?;
      let settings_store = SettingsStore::new(config_dir.join("settings.json"))?;
      let state = AppState::new(settings_store);
      let settings = state.settings.load();
      app.manage(state);
      apply_window_preferences(app.handle(), &settings)?;
      startup::set_launch_on_startup(app.handle(), settings.window.launch_on_startup)?;
      setup_tray(app.handle())?;
      Ok(())
    })
    .on_window_event(handle_window_event)
    .invoke_handler(tauri::generate_handler![
      load_settings,
      save_settings,
      show_window,
      hide_window,
      set_main_window_height,
      close_widget,
      hide_widget_stack,
      exit_app,
      open_repository,
      companion_has_auth,
      companion_discover,
      companion_connect,
      companion_disconnect,
      companion_request_auth_code,
      companion_complete_auth,
      companion_clear_auth,
      companion_send_command
    ])
    .run(tauri::generate_context!())
    .expect("error while running YTM Desktop Widget");
}
