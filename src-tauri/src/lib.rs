mod commands;
mod plugins;

use commands::{media, system, widget};
use include_dir::{include_dir, Dir, DirEntry};
use plugins::localhost;
use reqwest::Client;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::{env, fs, sync::OnceLock};
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

static TEMPLATES: Dir = include_dir!("$CARGO_MANIFEST_DIR/widget_templates");

fn ensure_paths(app: &AppHandle) {
    let app_data = app.path().app_data_dir().unwrap();
    let app_cache = app.path().app_cache_dir().unwrap();

    fs::create_dir_all(&app_data).expect("Failed to create AppData dir");
    fs::create_dir_all(&app_cache).expect("Failed to create AppCache dir");
}

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

pub fn get_or_create_store(app_handle: &AppHandle) -> Result<serde_json::Value, serde_json::Error> {
    let store_path = app_handle
        .path()
        .resolve("store.json", tauri::path::BaseDirectory::AppData)
        .unwrap();

    if !store_path.exists() {
        fs::write(&store_path, "{}").expect("Failed to create store file");
    }
    fs::read_to_string(&store_path)
        .and_then(|contents| Ok(serde_json::from_str::<serde_json::Value>(&contents)))
        .expect("Cannot read store file")
}

pub fn write_to_store(
    app_handle: &AppHandle,
    key: &str,
    value: serde_json::Value,
) -> Result<(), std::io::Error> {
    let store_path = app_handle
        .path()
        .resolve("store.json", tauri::path::BaseDirectory::AppData)
        .unwrap();

    let mut store = get_or_create_store(app_handle)?;
    store[key] = value;

    fs::write(store_path, serde_json::to_string(&store).unwrap())?;
    Ok(())
}

fn copy_embedded_dir(dir: &Dir, target: &std::path::Path) -> std::io::Result<()> {
    fs::create_dir_all(target)?;

    for entry in dir.entries() {
        match entry {
            DirEntry::Dir(subdir) => {
                copy_embedded_dir(subdir, &target.join(subdir.path().file_name().unwrap()))?;
            }
            DirEntry::File(file) => {
                let dest_path = target.join(file.path().file_name().unwrap());
                if let Some(parent) = dest_path.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::write(&dest_path, file.contents())?;
            }
        }
    }

    Ok(())
}

#[tauri::command]
async fn write_to_store_cmd(
    app: tauri::AppHandle,
    key: String,
    value: Value,
) -> Result<(), String> {
    let value = serde_json::to_value(value).map_err(|e| e.to_string())?;
    write_to_store(&app, &key, value).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn track_analytics_event(
    app: tauri::AppHandle,
    event: &str,
    distinct_id: &str,
    extra_properties: Option<HashMap<String, Value>>,
) -> Result<(), String> {
    let client = Client::new();
    let token = option_env!("MIXPANEL_TOKEN").unwrap_or("");

    let mut properties = serde_json::Map::new();
    properties.insert("distinct_id".to_string(), json!(distinct_id));
    properties.insert("token".to_string(), json!(token));
    properties.insert(
        "version".to_string(),
        json!(app.package_info().version.to_string()),
    );
    properties.insert("os".to_string(), json!("windows"));

    if let Some(extra) = extra_properties {
        for (k, v) in extra {
            properties.insert(k, v);
        }
    }

    let event_data = json!([{
        "event": event,
        "properties": properties,
    }]);

    let res = client
        .post("https://api.mixpanel.com/track?ip=0")
        .header("accept", "text/plain")
        .header("content-type", "application/json")
        .json(&event_data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        Ok(())
    } else {
        Err(format!("Mixpanel error: {}", res.status()))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let port = portpicker::pick_unused_port().expect("failed to find unused port");

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
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
            write_to_store_cmd,
            track_analytics_event,
        ])
        .setup(|app| {
            if !cfg!(debug_assertions) {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
            } else {
                println!("Updater disabled in dev mode");
            }
            let app_handle = app.handle().clone();
            ensure_paths(&app_handle);

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
            let autostart_enabled = autostart_manager.is_enabled().unwrap_or(false);
            let store = get_or_create_store(app.handle()).unwrap();

            let store_autostart = store.get("autostart").and_then(Value::as_bool);
            match store_autostart {
                Some(autostart) => {
                    if autostart && !autostart_enabled {
                        autostart_manager.enable().unwrap();
                    } else if !autostart && autostart_enabled {
                        autostart_manager.disable().unwrap();
                    }
                }
                None => {
                    // Default to enabled if not set
                    let _ = write_to_store(app.handle(), "autostart", serde_json::json!(true));
                    if !autostart_enabled {
                        autostart_manager.enable().unwrap();
                    }
                }
            }

            let widgets_dir = app
                .path()
                .resolve("widgets", tauri::path::BaseDirectory::AppData)
                .unwrap()
                .to_path_buf();

            tauri::async_runtime::spawn(async move {
                let mut paths: Vec<String> = vec![];
                widgets_dir
                    .exists()
                    .then(|| {
                        println!("Widgets directory exists: {:?}", widgets_dir.display());
                    })
                    .unwrap_or_else(|| {
                        println!(
                            "Widgets directory does not exist, creating: {:?}",
                            widgets_dir.display()
                        );
                        fs::create_dir_all(&widgets_dir)
                            .expect("Failed to create widgets directory");
                    });

                if let Some(path_str) = widgets_dir.to_str() {
                    let mut entries = std::fs::read_dir(path_str)
                        .unwrap()
                        .filter_map(|e| e.ok())
                        .peekable();
                    if entries.peek().is_none() {
                        copy_embedded_dir(&TEMPLATES, &widgets_dir)
                            .expect("Failed to copy widgets directory");
                    }
                    for entry in entries {
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
                    }
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
                println!("Tauri application is ready");
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
