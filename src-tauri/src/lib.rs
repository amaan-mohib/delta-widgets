mod commands;

use commands::{media, system, widget};
use std::sync::OnceLock;
use tauri::{AppHandle, Emitter};

static GLOBAL_APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

pub fn emit_global_event(event: &str) {
    if let Some(app_handle) = GLOBAL_APP_HANDLE.get() {
        app_handle.emit(event, ()).unwrap();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_system_info::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_prevent_default::debug())
        .invoke_handler(tauri::generate_handler![
            media::get_media,
            media::media_action,
            widget::create_creator_window,
            widget::create_widget_window,
            widget::close_widget_window,
            widget::copy_custom_assets,
            widget::publish_widget,
            widget::toggle_widget_visibility,
            widget::toggle_always_on_top,
            system::get_system_info,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| match event {
            tauri::RunEvent::Ready => {
                GLOBAL_APP_HANDLE
                    .set(app_handle.clone())
                    .expect("Failed to set global app handle");
            }
            _ => {}
        });
}
