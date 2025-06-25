mod commands;
mod plugins;

use commands::{media, system, widget};
use plugins::localhost;
use serde_json::Value;
use std::{fs, sync::OnceLock};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use tauri::{AppHandle, Emitter};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

use crate::commands::widget::create_widget_window;

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
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
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
        .setup(|app| {
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;
            let tray = TrayIconBuilder::new()
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)?;

            tray.on_menu_event(|app, event| match event.id.as_ref() {
                "show" => {
                    let window = app.get_webview_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                "quit" => {
                    println!("quit menu item was clicked");
                    app.exit(0);
                }
                _ => {
                    println!("menu item {:?} not handled", event.id);
                }
            });

            #[cfg(target_os = "windows")]
            let is_autostart = std::env::args().any(|arg| arg == "--autostart");

            #[cfg(target_os = "macos")]
            let is_autostart = std::env::var("TAURI_AUTOSTART").is_ok();

            #[cfg(target_os = "linux")]
            let is_autostart = std::env::args().any(|arg| arg == "--autostart");

            let main_window = app.get_webview_window("main").unwrap();
            if is_autostart {
                main_window.hide().unwrap(); // keep window hidden
            } else {
                main_window.show().unwrap(); // show normally
            }
            let autostart_manager = app.autolaunch();
            // let store = app.store("store.json")?;
            // let store_autostart = store.get("autostart").and_then(|v| Value::as_bool(&v));
            // match store_autostart {
            //     Some(autostart) => {
            //         if autostart {
            //             autostart_manager.enable().unwrap();
            //         } else {
            //             autostart_manager.disable().unwrap();
            //         }
            //     }
            //     None => {
            //         // Default to enabled if not set
            //         store.set("autostart", serde_json::json!(true));
            //         autostart_manager.enable().unwrap();
            //     }
            // }

            let app_handle = app.handle().clone();
            let widgets_dir = app
                .path()
                .resolve("widgets", tauri::path::BaseDirectory::AppData)
                .unwrap()
                .to_path_buf();

            // write copy logic for default widgets once made

            tauri::async_runtime::spawn(async move {
                let mut paths: Vec<String> = vec![];
                if let Some(path_str) = widgets_dir.to_str() {
                    let entries = std::fs::read_dir(path_str).unwrap();
                    entries.filter_map(|e| e.ok()).for_each(|entry| {
                        let entry_path = entry.path();
                        let manifest_path = entry_path.join("manifest.json");
                        if manifest_path.exists() {
                            if let Ok(json) = fs::read_to_string(&manifest_path)
                                .and_then(|contents| {
                                    Ok(serde_json::from_str::<serde_json::Value>(&contents))
                                })
                                .expect("Cannot read manifest")
                            {
                                let visible = json
                                    .get("visible")
                                    .and_then(Value::as_bool)
                                    .unwrap_or_else(|| false);

                                if visible {
                                    paths.push(manifest_path.to_str().unwrap().to_string());
                                }
                            }
                        }
                    });
                }
                for path in paths {
                    create_widget_window(
                        app_handle.clone(),
                        serde_json::json!(path).to_string(),
                        Some(false),
                    )
                    .await;
                }
            });

            // store.close_resource();

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // hide the main window instead of closing it
                if window.label() == "main" {
                    window.hide().unwrap();
                    api.prevent_close();
                }
            }
            _ => {}
        })
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
