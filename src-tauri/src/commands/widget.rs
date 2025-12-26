use std::{
    collections::HashMap,
    fs::{self, File},
    io::{self, Read},
    path::Path,
    sync::Mutex,
    time::Duration,
};

use serde_json::{json, Value};
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize};
use tokio::time::{sleep, Instant};
#[cfg(target_os = "windows")]
use window_vibrancy::apply_mica;

use crate::get_custom_server_port;

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
                let _ = app.emit_to("main", "creator-close", 1);
                webview.show().unwrap();
            }
            _ => {}
        };
    });
}

pub fn ensure_window_position_bounds(
    webview: &tauri::WebviewWindow,
    position: PhysicalPosition<i32>,
    size: PhysicalSize<u32>,
) -> PhysicalPosition<i32> {
    let monitors = webview.available_monitors().unwrap();

    let win_x = position.x;
    let win_y = position.y;
    let win_right = win_x + size.width as i32;
    let win_bottom = win_y + size.height as i32;

    let mut in_bounds = false;

    for monitor in &monitors {
        let monitor_size = monitor.size();
        let monitor_position = monitor.position();

        if win_x >= monitor_position.x
            && win_y >= monitor_position.y
            && win_right <= monitor_position.x + monitor_size.width as i32
            && win_bottom <= monitor_position.y + monitor_size.height as i32
        {
            in_bounds = true;
            break;
        }
    }

    if in_bounds {
        return position;
    }

    if let Some(primary) = webview.primary_monitor().unwrap_or_default() {
        let mon_pos = primary.position();

        let new_x = mon_pos.x + 30 as i32;
        let new_y = mon_pos.y + 30 as i32;

        PhysicalPosition { x: new_x, y: new_y }
    } else {
        PhysicalPosition { x: 30, y: 30 }
    }
}

pub fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> io::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
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
                .unwrap();
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
                    x: p.x as i32,
                    y: p.y as i32,
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
    if let (Ok(position), Ok(size), Ok(scale_factor)) = (
        window.inner_position(),
        window.inner_size(),
        window.scale_factor(),
    ) {
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
        let widget_type = config
            .get("widgetType")
            .and_then(Value::as_str)
            .unwrap_or("json")
            .to_string();

        // Update only the window position and size fields
        if let Value::Object(ref mut map) = config {
            map.insert(
                String::from("position"),
                json!({
                    "x": position.x,
                    "y": position.y
                }),
            );
            let is_json = widget_type == "json";
            let logical_size = size.to_logical::<u32>(scale_factor);

            map.insert(
                String::from("dimensions"),
                json!({
                    "width": if is_json { logical_size.width } else { size.width },
                    "height": if is_json { logical_size.height } else { size.height }
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
    if let Some(window) = app.get_webview_window(&label) {
        window.close().unwrap();
    }
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
pub async fn copy_custom_assets_dir(
    app: tauri::AppHandle,
    key: String,
    path: String,
) -> Result<String, String> {
    let asset_path = app
        .path()
        .resolve("files", tauri::path::BaseDirectory::AppCache)
        .unwrap()
        .join(&key);

    if !fs::exists(std::path::Path::new(path.as_str()).join("index.html")).expect("msg") {
        return Err("No index.html found in the specified directory".to_string());
    }
    if let Err(err) = copy_dir_all(path, &asset_path) {
        eprintln!("Error copying directory: {}", err);
        return Err(format!("Error copying directory: {}", err));
    };
    Ok(asset_path
        .clone()
        .join("index.html")
        .to_string_lossy()
        .to_string())
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
            map.insert(
                String::from("dimensions"),
                old_config.get("dimensions").unwrap_or(&json!({})).clone(),
            );
            map.insert(
                String::from("position"),
                old_config.get("position").unwrap_or(&json!({})).clone(),
            );
        }
    }
    // Copy the widget to the published directory
    if let Ok(json_string) = serde_json::to_string_pretty(&config) {
        let _ = fs::write(&manifest_path.join("manifest.json"), json_string);
    }
    let _ = app.emit_to(format!("widget-{}", key), "update-manifest", 1);
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

#[tauri::command]
pub async fn apply_blur_theme(
    app: tauri::AppHandle,
    mode: String,
    label: String,
) -> Result<bool, String> {
    #[cfg(not(target_os = "windows"))]
    return Ok(false);

    let mut theme_applied = true;
    if let Some(window) = app.get_webview_window(&label) {
        let mode_type = match mode.as_str() {
            "dark" => Some(true),
            "light" => Some(false),
            _ => None,
        };
        #[cfg(target_os = "windows")]
        if let Err(e) = apply_mica(&window, mode_type) {
            theme_applied = false;
            eprintln!("Failed to apply mica effect: {}", e);
        }
    } else {
        theme_applied = false;
    };
    Ok(theme_applied)
}
