use serde_json::{json, Value};
use std::fs;
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize, State};

use crate::{
    commands::{
        audio::{stop_capture as stop_audio_capture, AudioState},
        media::{stop_media_listener, MediaState},
        services::copy_custom_assets_dir,
        utils::{
            attach_window_events, ensure_window_position_bounds, get_existing_keys,
            get_wallpaper_preview,
        },
    },
    get_custom_server_port,
};

#[tauri::command]
pub async fn create_creator_window(
    app: tauri::AppHandle,
    webview: tauri::WebviewWindow,
    manifest_path: String,
) {
    let cached_wallpaper = match get_wallpaper_preview(&app) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Error caching wallpaper: {e}");
            "".to_string()
        }
    };

    let current_monitor = webview.current_monitor().unwrap();
    let position = match current_monitor {
        Some(monitor) => {
            let x = monitor.clone();
            x.position().clone()
        }
        None => tauri::PhysicalPosition::new(0, 0),
    };

    let existing_keys = get_existing_keys(&app, manifest_path.clone());

    let init_obj = json!({
        "manifestPath": manifest_path,
        "wallpaper": cached_wallpaper,
        "existingKeys": existing_keys
    });
    let init_script: &str = &format!(
        "window.__INITIAL_STATE__ = {};",
        serde_json::to_string(&init_obj).unwrap()
    );

    let new_window = tauri::WebviewWindowBuilder::new(
        &app,
        "creator",
        tauri::WebviewUrl::App("creator-index.html".into()),
    )
    .title("Widget Creator")
    .min_inner_size(1280.0, 720.0)
    .visible(false)
    .initialization_script(init_script)
    .build()
    .unwrap();

    new_window.set_position(position).unwrap();
    new_window.maximize().unwrap();

    webview.hide().unwrap();
    new_window.show().unwrap();

    new_window.on_window_event(move |event| {
        match event {
            tauri::WindowEvent::CloseRequested { .. } => {
                let _ = app.emit_to("main", "creator-close", 1);
                webview.show().unwrap();
            }
            _ => {}
        };
    });
}

#[derive(serde::Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum WidgetType {
    Json,
    Url,
    Html,
}
#[derive(serde::Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
struct WidgetManifest {
    key: Option<String>,
    label: Option<String>,
    dimensions: Option<PhysicalSize<f64>>,
    position: Option<PhysicalPosition<Option<f64>>>,
    url: Option<String>,
    file: Option<String>,
    visible: Option<bool>,
    always_on_top: Option<bool>,
    pinned: Option<bool>,
    #[serde(default = "default_widget_type")]
    widget_type: WidgetType,
}

fn default_widget_type() -> WidgetType {
    WidgetType::Json
}

async fn clear_window_listeners_on_close(
    label: &String,
    audio_state: State<'_, std::sync::Mutex<AudioState>>,
    media_state: State<'_, tokio::sync::Mutex<MediaState>>,
) -> Result<(), String> {
    {
        let mut state = audio_state.lock().map_err(|e| e.to_string())?;
        if state.listening_windows.len() == 1 && state.listening_windows.contains(label) {
            drop(state);
            stop_audio_capture(label, &audio_state);
        } else {
            state.listening_windows.remove(label);
        };
    }
    {
        let mut state = media_state.lock().await;
        if state.listening_windows.len() == 1 && state.listening_windows.contains(label) {
            drop(state);
            let _ = stop_media_listener(label, &media_state).await;
        } else {
            state.listening_windows.remove(label);
        };
    }
    Ok(())
}

#[tauri::command]
pub async fn create_widget_window(app: tauri::AppHandle, path: String, is_preview: Option<bool>) {
    let clean_path = serde_json::from_str::<String>(&path).unwrap();
    let manifest_content = fs::read_to_string(clean_path.as_str()).expect("Cannot read manifest");
    let manifest: WidgetManifest =
        serde_json::from_str(&manifest_content).expect("invalid manifest");

    let title = manifest.label.unwrap_or_else(|| "Widget".to_string());
    let manifest_key = manifest.key.unwrap_or_else(|| "widget".to_string());

    let physical_size = manifest
        .dimensions
        .map(|d| PhysicalSize {
            height: d.height as u32,
            width: d.width as u32,
        })
        .unwrap_or(PhysicalSize {
            width: if manifest.widget_type == WidgetType::Url {
                520
            } else {
                600
            },
            height: if manifest.widget_type == WidgetType::Url {
                840
            } else {
                400
            },
        });

    let url = match manifest.widget_type {
        WidgetType::Url => manifest.url.unwrap_or_else(|| "".to_string()),
        WidgetType::Html => {
            let html_folder = manifest.file.unwrap_or_else(|| "index.html".to_string());
            let _ = copy_custom_assets_dir(app.clone(), manifest_key.clone(), html_folder.clone())
                .await
                .unwrap_or_default();
            let port = get_custom_server_port();
            format!(
                "http://localhost:{}/{}/index.html",
                port,
                manifest_key.clone(),
            )
        }
        _ => "widget-index.html".into(),
    };
    let label = format!(
        "widget-{}{}",
        if is_preview.unwrap_or(false) {
            "preview-"
        } else {
            ""
        },
        manifest_key
    );

    let mut window_builder =
        tauri::WebviewWindowBuilder::new(&app, label.clone(), tauri::WebviewUrl::App(url.into()));
    window_builder = window_builder.title(&title).visible(false);

    match manifest.widget_type {
        WidgetType::Json => {
            let init_script: &str = &format!(
                "window.__INITIAL_WIDGET_STATE__ = {{ manifestPath: {} }};",
                path
            );
            window_builder = window_builder
                .transparent(true)
                .decorations(false)
                .shadow(false)
                .initialization_script(init_script);
        }
        WidgetType::Url => {
            window_builder = window_builder
                .skip_taskbar(true)
                .shadow(false)
                .maximizable(false)
                .minimizable(false)
                .closable(false)
        }
        WidgetType::Html => {
            window_builder = window_builder
                .transparent(true)
                .decorations(false)
                .shadow(false)
        }
    }

    let new_window = window_builder.build().unwrap();

    let position = manifest
        .position
        .map(|p| {
            ensure_window_position_bounds(
                &new_window,
                PhysicalPosition {
                    x: p.x.unwrap_or(30 as f64) as i32,
                    y: p.y.unwrap_or(30 as f64) as i32,
                },
                physical_size,
            )
        })
        .unwrap_or(PhysicalPosition { x: 30, y: 30 });

    new_window.set_position(position).unwrap();

    if manifest.widget_type == WidgetType::Json {
        new_window
            .set_size(physical_size.to_logical::<u32>(1.0))
            .unwrap();
    } else if manifest.widget_type == WidgetType::Url || manifest.widget_type == WidgetType::Html {
        new_window.set_size(physical_size).unwrap();
    }
    new_window.show().unwrap();
    if !is_preview.unwrap_or(false) {
        new_window.set_skip_taskbar(true).unwrap();
        new_window.set_maximizable(false).unwrap();
        new_window.set_minimizable(false).unwrap();
        new_window.set_closable(false).unwrap();

        let pinned = manifest.pinned.unwrap_or(false);
        new_window.set_resizable(!pinned).unwrap();
        if manifest.widget_type == WidgetType::Url && pinned {
            new_window.set_decorations(false).unwrap();
        }

        let always_on_top = manifest.always_on_top.unwrap_or(false);
        if always_on_top {
            new_window.set_always_on_top(always_on_top).unwrap();
        } else {
            new_window.set_always_on_bottom(true).unwrap();
        }
        attach_window_events(new_window.clone(), clean_path);
    } else {
        let label = label.clone();
        let app = app.clone();
        let fired = std::sync::Arc::new(std::sync::Once::new());

        new_window.on_window_event(move |event| {
            match event {
                tauri::WindowEvent::CloseRequested { .. } | tauri::WindowEvent::Destroyed => {
                    let label = label.clone();
                    let app = app.clone();
                    let clean_path = clean_path.clone();
                    fired.call_once(|| {
                        tauri::async_runtime::spawn(async move {
                            let audio_state = app.state::<std::sync::Mutex<AudioState>>();
                            let media_state = app.state::<tokio::sync::Mutex<MediaState>>();
                            let _ =
                                clear_window_listeners_on_close(&label, audio_state, media_state)
                                    .await;
                            let _ = app.emit_to("creator", "widget-close", clean_path);
                        });
                    });
                }
                _ => {}
            };
        });
    }
}

#[tauri::command]
pub async fn close_widget_window(
    app: tauri::AppHandle,
    media_state: State<'_, tokio::sync::Mutex<MediaState>>,
    audio_state: State<'_, std::sync::Mutex<AudioState>>,
    label: String,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        clear_window_listeners_on_close(&label, audio_state, media_state).await?;
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn publish_widget(app: tauri::AppHandle, path: String) -> Result<String, String> {
    let clean_path = serde_json::from_str::<String>(&path).unwrap();
    let widgets_path = app
        .path()
        .resolve("widgets", tauri::path::BaseDirectory::AppData)
        .unwrap();
    if !widgets_path.exists() {
        if let Err(err) = fs::create_dir_all(&widgets_path) {
            eprintln!("Error creating widgets directory: {}", err);
            return Err(err.to_string());
        }
    }
    let config_content = fs::read_to_string(&clean_path).unwrap();

    // Parse the existing JSON
    let mut config: Value = match serde_json::from_str(&config_content) {
        Ok(json) => json,
        Err(_) => json!({}),
    };
    let key = config
        .get("key")
        .and_then(Value::as_str)
        .unwrap()
        .to_string();
    let published_time = std::time::UNIX_EPOCH.elapsed().unwrap().as_millis();

    // Update published status and timestamp
    if let Value::Object(ref mut map) = config {
        map.insert(String::from("published"), json!(true));

        map.insert(String::from("publishedAt"), json!(published_time));
    }

    // Write the updated JSON back to the file
    if let Ok(json_string) = serde_json::to_string_pretty(&config) {
        let _ = fs::write(&clean_path, json_string);
    }
    let manifest_path = widgets_path.join(&key);
    if !manifest_path.exists() {
        fs::create_dir_all(&manifest_path).unwrap();
    } else {
        if let Value::Object(ref mut map) = config {
            let old_config_content =
                fs::read_to_string(&manifest_path.join("manifest.json")).unwrap();
            let old_config: Value = match serde_json::from_str(&old_config_content) {
                Ok(json) => json,
                Err(_) => json!({}),
            };
            map.insert(
                String::from("visible"),
                old_config.get("visible").unwrap_or(&json!(false)).clone(),
            );
            let dimensions = map.get("dimensions");
            if dimensions.is_none() {
                map.insert(
                    String::from("dimensions"),
                    old_config.get("dimensions").unwrap_or(&json!({})).clone(),
                );
            }
            map.insert(
                String::from("position"),
                old_config
                    .get("position")
                    .unwrap_or(&json!({"x": 30, "y": 30}))
                    .clone(),
            );
        }
    }
    // Copy the widget to the published directory
    if let Ok(json_string) = serde_json::to_string_pretty(&config) {
        let _ = fs::write(&manifest_path.join("manifest.json"), json_string);
    }

    manifest_path
        .into_os_string()
        .into_string()
        .map_err(|_| String::from("Error stringifying path"))
}

#[tauri::command]
pub async fn toggle_widget_visibility(_app: tauri::AppHandle, visibility: bool, path: String) {
    let clean_path = serde_json::from_str::<String>(&path).unwrap();
    let config_content = fs::read_to_string(&clean_path).unwrap();

    // Parse the existing JSON
    let mut config: Value = match serde_json::from_str(&config_content) {
        Ok(json) => json,
        Err(_) => json!({}),
    };

    if let Value::Object(ref mut map) = config {
        map.insert(String::from("visible"), json!(visibility));
    }
    // Write the updated JSON back to the file
    if let Ok(json_string) = serde_json::to_string_pretty(&config) {
        let _ = fs::write(&clean_path, json_string);
    }
}

#[tauri::command]
pub async fn open_devtools(app: tauri::AppHandle, label: String) {
    #[allow(unused)]
    if let Some(window) = app.get_webview_window(&label) {
        #[cfg(debug_assertions)]
        window.open_devtools();
    }
}
