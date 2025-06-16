use std::{
    collections::HashMap,
    fs::{self, File},
    io::Read,
    sync::Mutex,
    time::Duration,
};

use serde_json::{json, Value};
use tauri::{Emitter, LogicalSize, Manager, PhysicalPosition, PhysicalSize};
use tokio::time::{sleep, Instant};

#[tauri::command]
pub async fn create_creator_window(
    app: tauri::AppHandle,
    webview: tauri::WebviewWindow,
    manifest: String,
    current_folder: String,
) {
    let mut buffer = Vec::new();
    let wallpaper_path = wallpaper::get().unwrap();
    let mut file = File::open(wallpaper_path).unwrap();
    file.read_to_end(&mut buffer).unwrap();

    let current_monitor = webview.current_monitor().unwrap();
    let position = match current_monitor {
        Some(monitor) => {
            let x = monitor.clone();
            x.position().clone()
        }
        None => tauri::PhysicalPosition::new(0, 0),
    };

    let mut existing_keys: HashMap<String, Option<()>> = HashMap::new();

    for sub_dir in vec!["saves", "widgets"] {
        match app
            .path()
            .resolve(sub_dir, tauri::path::BaseDirectory::AppData)
            .unwrap()
            .to_str()
        {
            Some(path) => {
                let entries = fs::read_dir(path).unwrap();
                entries.filter_map(|e| e.ok()).for_each(|entry| {
                    let entry_path = entry.path();
                    if entry_path.to_str().or_else(|| None) != Some(current_folder.as_str()) {
                        let manifest_path = entry_path.join("manifest.json");
                        if manifest_path.exists() {
                            if let Ok(json) = fs::read_to_string(&manifest_path)
                                .and_then(|contents| {
                                    Ok(serde_json::from_str::<serde_json::Value>(&contents))
                                })
                                .expect("Cannot read manifest")
                            {
                                if let Some(key) = json.get("key").and_then(Value::as_str) {
                                    existing_keys.insert(key.to_string(), None);
                                }
                            }
                        };
                    }
                });
            }
            None => {}
        };
    }

    let init_script: &str = &format!(
        "window.__INITIAL_STATE__ = {{ manifest: {}, wallpaper: {:?}, existingKeys: {} }};",
        manifest,
        buffer,
        serde_json::to_string(&existing_keys).unwrap()
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
    position: Option<PhysicalPosition<f64>>,
    url: Option<String>,
    file: Option<String>,
    visible: Option<bool>,
    always_on_top: Option<bool>,
    #[serde(default = "default_widget_type")]
    widget_type: WidgetType,
}

fn default_widget_type() -> WidgetType {
    WidgetType::Json
}

#[tauri::command]
pub async fn create_widget_window(app: tauri::AppHandle, path: String, is_preview: Option<bool>) {
    let clean_path = serde_json::from_str::<String>(&path).unwrap();
    let manifest_content = fs::read_to_string(clean_path.as_str()).expect("Cannot read manifest");
    let manifest: WidgetManifest =
        serde_json::from_str(&manifest_content).expect("invalid manifest");

    let title = manifest.label.unwrap_or_else(|| "Widget".to_string());
    let manifest_key = manifest.key.unwrap_or_else(|| "widget".to_string());
    let position = manifest
        .position
        .map(|p| PhysicalPosition {
            x: p.x as i32,
            y: p.y as i32,
        })
        .unwrap_or(PhysicalPosition { x: 30, y: 30 });

    let url = match manifest.widget_type {
        WidgetType::Url => manifest.url.unwrap_or_else(|| "".to_string()),
        WidgetType::Html => manifest.file.unwrap_or_else(|| "index.html".to_string()),
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
        tauri::WebviewWindowBuilder::new(&app, label, tauri::WebviewUrl::App(url.into()));
    window_builder = window_builder.title(&title).visible(false);

    match manifest.widget_type {
        WidgetType::Json => {
            let init_script: &str = &format!(
                "window.__INITIAL_WIDGET_STATE__ = {{ manifestPath: {} }};",
                path
            );
            window_builder = window_builder
                .transparent(true)
                .resizable(false)
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

    new_window.set_position(position).unwrap();

    if manifest.widget_type == WidgetType::Json || manifest.widget_type == WidgetType::Html {
        let dimensions = manifest
            .dimensions
            .map(|d| LogicalSize {
                height: d.height as u32,
                width: d.width as u32,
            })
            .unwrap_or(LogicalSize {
                width: 600,
                height: 400,
            });
        new_window.set_size(dimensions).unwrap();
    } else if manifest.widget_type == WidgetType::Url {
        let dimensions = manifest
            .dimensions
            .map(|d| PhysicalSize {
                height: d.height as u32,
                width: d.width as u32,
            })
            .unwrap_or(PhysicalSize {
                width: 520,
                height: 840,
            });
        new_window.set_size(dimensions).unwrap();
    }
    new_window.show().unwrap();
    if !is_preview.unwrap_or(false) {
        new_window.set_skip_taskbar(true).unwrap();
        let always_on_top = manifest.always_on_top.unwrap_or(false);
        if always_on_top {
            new_window.set_always_on_top(always_on_top).unwrap();
        } else {
            new_window.set_always_on_bottom(true).unwrap();
        }
        attach_window_events(new_window.clone(), clean_path);
    } else {
        new_window.on_window_event(move |event| {
            match event {
                tauri::WindowEvent::CloseRequested { .. } | tauri::WindowEvent::Destroyed => {
                    let _ = app.emit_to("creator", "widget-close", clean_path.clone());
                }
                _ => {}
            };
        });
    }
}

fn save_window_state(window: &tauri::WebviewWindow, config_path: String) {
    if let (Ok(position), Ok(size)) = (window.inner_position(), window.inner_size()) {
        // Try to read the existing config file
        let config_content = match fs::read_to_string(&config_path) {
            Ok(content) => content,
            Err(_) => String::from("{}"),
        };

        // Parse the existing JSON
        let mut config: Value = match serde_json::from_str(&config_content) {
            Ok(json) => json,
            Err(_) => json!({}),
        };

        // Update only the window position and size fields
        if let Value::Object(ref mut map) = config {
            map.insert(
                String::from("position"),
                json!({
                    "x": position.x,
                    "y": position.y
                }),
            );

            map.insert(
                String::from("size"),
                json!({
                    "width": size.width,
                    "height": size.height
                }),
            );
        }

        // Write the updated JSON back to the file
        if let Ok(json_string) = serde_json::to_string_pretty(&config) {
            let _ = fs::write(&config_path, json_string);
        }
    }
}

fn attach_window_events(new_window: tauri::WebviewWindow, clean_path: String) {
    let debounce_state = std::sync::Arc::new(Mutex::new(None::<Instant>));
    new_window.clone().on_window_event(move |event| {
        match event {
            tauri::WindowEvent::Moved(_) | tauri::WindowEvent::Resized(_) => {
                let window_clone = new_window.clone();
                let path = clean_path.clone();
                let debounce = debounce_state.clone();
                *debounce.lock().unwrap() = Some(Instant::now());
                tauri::async_runtime::spawn(async move {
                    // Wait for debounce period
                    sleep(Duration::from_millis(500)).await;

                    // Check if we should still save
                    let should_save = {
                        let mut state = debounce.lock().unwrap();
                        if let Some(last_update) = *state {
                            if last_update.elapsed() >= Duration::from_millis(500) {
                                // Reset the state
                                *state = None;
                                true
                            } else {
                                false
                            }
                        } else {
                            false
                        }
                    };

                    if should_save {
                        save_window_state(&window_clone, path);
                    }
                });
                // hack to keep widget unminimized
                if new_window.is_minimized().unwrap() {
                    new_window.unminimize().unwrap();
                }
            }
            _ => {}
        };
    });
}

#[tauri::command]
pub async fn close_widget_window(app: tauri::AppHandle, label: String) {
    let window = app.get_webview_window(&label).expect("window should exist");
    window.close().unwrap();
}

#[tauri::command]
pub async fn copy_custom_assets(app: tauri::AppHandle, key: String, path: String) {
    let asset_path = app
        .path()
        .resolve("assets", tauri::path::BaseDirectory::AppCache)
        .unwrap();
    if !asset_path.exists() {
        if let Err(err) = fs::create_dir_all(&asset_path) {
            eprintln!("Error creating asset directory: {}", err);
            return;
        }
    }
    let destination = asset_path.join(&key);

    let _ = match fs::copy(path.as_str(), destination) {
        Ok(_) => {
            // println!("File copied successfully!");
            Ok(())
        }
        Err(err) => {
            eprintln!("Error copying file: {}", err);
            Err(format!("Error copying file: {}", err))
        }
    };
}

#[tauri::command]
pub async fn publish_widget(app: tauri::AppHandle, path: String) -> Result<u128, String> {
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
    // Copy the widget to the published directory
    if let Ok(json_string) = serde_json::to_string_pretty(&config) {
        println!("{:?}", key);
        let manifest_path = widgets_path.join(&key);
        if !manifest_path.exists() {
            fs::create_dir_all(&manifest_path).unwrap();
        }
        let _ = fs::write(&manifest_path.join("manifest.json"), json_string);
    }
    Ok(published_time)
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
pub async fn toggle_always_on_top(
    app: tauri::AppHandle,
    value: bool,
    path: String,
) -> Result<(), String> {
    let clean_path = serde_json::from_str::<String>(&path).unwrap();
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
    let label = format!("widget-{}", key);
    if let Some(window) = app.get_webview_window(&label) {
        let _ = match window.set_always_on_bottom(!value) {
            Ok(_) => Ok(()),
            Err(err) => Err(format!("Error setting always on top: {}", err)),
        };
        let _ = match window.set_always_on_top(value) {
            Ok(_) => Ok(()),
            Err(err) => Err(format!("Error setting always on top: {}", err)),
        };
    };

    if let Value::Object(ref mut map) = config {
        map.insert(String::from("alwaysOnTop"), json!(value));
    }
    // Write the updated JSON back to the file
    if let Ok(json_string) = serde_json::to_string_pretty(&config) {
        let _ = fs::write(&clean_path, json_string);
    }
    Ok(())
}
