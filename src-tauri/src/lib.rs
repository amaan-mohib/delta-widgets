mod commands;
mod plugins;

use commands::{media, system, widget};
use plugins::localhost;
use std::sync::OnceLock;
use tauri::{AppHandle, Emitter};

static GLOBAL_APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();
static CUSTOM_SERVER_PORT: OnceLock<u16> = OnceLock::new();

pub fn emit_global_event(event: &str) {
    if let Some(app_handle) = GLOBAL_APP_HANDLE.get() {
        app_handle.emit(event, ()).unwrap();
    }
}
pub fn get_custom_server_port() -> u16 {
    match CUSTOM_SERVER_PORT.get() {
        Some(port) => *port,
        None => panic!("Custom server port is not set"),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let port = portpicker::pick_unused_port().expect("failed to find unused port");

    tauri::Builder::default()
        .plugin(tauri_plugin_system_info::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_prevent_default::debug())
        .plugin(localhost::Builder::new(port).build())
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
            widget::copy_custom_assets_dir,
            system::get_system_info,
        ])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |app_handle, event| match event {
            tauri::RunEvent::Ready => {
                GLOBAL_APP_HANDLE
                    .set(app_handle.clone())
                    .expect("Failed to set global app handle");
                CUSTOM_SERVER_PORT
                    .set(port)
                    .expect("Failed to set global port");
            }
            _ => {}
        });
}
