use serde::Serialize;
use serde_json::{json, Value};
use std::fs;
use tauri::{Emitter, Manager, PhysicalPosition, PhysicalSize};

#[cfg(target_os = "windows")]
use window_vibrancy::apply_mica;

use crate::{
    commands::utils::{
        attach_window_events, compare_if_no_thumb, copy_dir_all, ensure_window_position_bounds,
        get_existing_keys, get_wallpaper_preview,
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
pub async fn toggle_pinned(app: tauri::AppHandle, value: bool, path: String) -> Result<(), String> {
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
    let widget_type = config
        .get("widgetType")
        .and_then(Value::as_str)
        .unwrap()
        .to_string();
    let label = format!("widget-{}", key);
    if widget_type == "url" {
        if let Some(window) = app.get_webview_window(&label) {
            let _ = match window.set_decorations(!value) {
                Ok(_) => Ok(()),
                Err(err) => Err(format!("Error setting decorations: {}", err)),
            };
        };
    }

    if let Value::Object(ref mut map) = config {
        map.insert(String::from("pinned"), json!(value));
    }
    // Write the updated JSON back to the file
    if let Ok(json_string) = serde_json::to_string_pretty(&config) {
        let _ = fs::write(&clean_path, json_string);
    }
    let _ = app.emit_to(format!("widget-{}", key), "update-manifest", 1);
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

#[tauri::command]
pub async fn open_devtools(app: tauri::AppHandle, label: String) {
    if let Some(window) = app.get_webview_window(&label) {
        #[cfg(debug_assertions)]
        window.open_devtools();
    }
}

#[tauri::command]
pub async fn create_url_thumbnail(
    app: tauri::AppHandle,
    url: String,
    file_name: String,
) -> Result<i32, String> {
    if let Ok(thumb_dir) = app
        .path()
        .resolve("thumbs", tauri::path::BaseDirectory::AppCache)
    {
        if !thumb_dir.exists() {
            if let Err(err) = fs::create_dir_all(&thumb_dir) {
                eprintln!("Error creating thumbs directory: {}", err);
                return Err(format!("Error creating thumbs directory: {}", err));
            }
        }
        let resp = reqwest::get(format!(
            "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url={}&size=48",
            url
        )).await;
        let bytes = match resp {
            Ok(r) => r.bytes().await.map_err(|e| e.to_string()),
            Err(e) => Err(e.to_string()),
        };
        match bytes {
            Ok(b) => {
                let thumb_path = thumb_dir.join(&file_name);
                if compare_if_no_thumb(&b) {
                    return match fs::write(&thumb_path, []) {
                        Ok(_) => Ok(0),
                        Err(e) => Err(e.to_string()),
                    };
                } else {
                    return match fs::write(&thumb_path, b) {
                        Ok(_) => Ok(1),
                        Err(e) => Err(e.to_string()),
                    };
                }
            }
            Err(err) => {
                eprintln!("Error fetching thumbnail: {}", err);
                return Err(format!("Error fetching thumbnail: {}", err));
            }
        }
    }
    Ok(-1)
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WidgetWithMeta {
    pub manifest: serde_json::Value,
    pub path: String,
    pub modified_at: u64,
    pub is_draft: bool,
}

#[tauri::command]
pub async fn get_all_widgets(app: tauri::AppHandle) -> Result<Vec<WidgetWithMeta>, String> {
    let mut result = Vec::new();

    for sub_dir in vec!["saves", "widgets"] {
        let saves = sub_dir == "saves";
        match app
            .path()
            .resolve(sub_dir, tauri::path::BaseDirectory::AppData)
        {
            Ok(path) => {
                if !path.exists() {
                    if let Err(err) = fs::create_dir_all(&path) {
                        eprintln!("Error creating widgets directory: {}", err);
                        return Err(err.to_string());
                    }
                }
                let entries = fs::read_dir(path).unwrap();
                for entry in entries {
                    let entry = match entry {
                        Ok(e) => e,
                        Err(_) => continue,
                    };

                    let path = entry.path();
                    if !path.is_dir() {
                        continue;
                    }

                    let manifest_path = path.join("manifest.json");

                    if !manifest_path.exists() {
                        continue;
                    }

                    let content = match fs::read_to_string(&manifest_path) {
                        Ok(c) => c,
                        Err(_) => continue,
                    };
                    let mut manifest_json: serde_json::Value = match serde_json::from_str(&content)
                    {
                        Ok(m) => m,
                        Err(_) => continue,
                    };
                    if let Some(obj) = manifest_json.as_object_mut() {
                        obj.remove("elements");
                        obj.remove("dimensions");
                        obj.remove("position");
                        obj.remove("customFields");
                        obj.remove("customAssets");
                        obj.remove("theme");
                    }

                    let metadata = match fs::metadata(&manifest_path) {
                        Ok(m) => m,
                        Err(_) => continue,
                    };

                    let modified_at = metadata
                        .modified()
                        .ok()
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_millis() as u64)
                        .unwrap_or(0);

                    result.push(WidgetWithMeta {
                        manifest: manifest_json,
                        path: if saves {
                            manifest_path.to_string_lossy().to_string()
                        } else {
                            path.to_string_lossy().to_string()
                        },
                        modified_at,
                        is_draft: saves,
                    });
                }
            }
            _ => {}
        };
    }
    Ok(result)
}
