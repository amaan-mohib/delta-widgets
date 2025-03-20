use std::sync::OnceLock;

use tauri::{AppHandle, Emitter};

#[path = "commands/media.rs"]
mod media;
#[path = "commands/widget.rs"]
mod widget;

static GLOBAL_APP_HANDLE: OnceLock<AppHandle> = OnceLock::new();

pub fn emit_global_event(event: &str) {
    if let Some(app_handle) = GLOBAL_APP_HANDLE.get() {
        app_handle.emit(event, ()).unwrap();
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
async fn greet(name: &str) -> Result<String, ()> {
    Ok(format!("Hello, {}! You've been greeted from Rust!", name))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            media::get_media,
            media::media_action,
            widget::create_creator_window,
            widget::create_widget_window,
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
