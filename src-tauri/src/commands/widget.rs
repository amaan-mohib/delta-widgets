use std::{
    collections::HashMap,
    fs::{self, File},
    io::Read,
};

use serde::Serialize;
use serde_json::Value;
use tauri::{Emitter, LogicalSize, Manager, PhysicalPosition, PhysicalSize};

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
    label: Option<String>,
    dimensions: Option<PhysicalSize<f64>>,
    position: Option<PhysicalPosition<f64>>,
    url: Option<String>,
    file: Option<String>,
    visible: Option<bool>,
    #[serde(default = "default_widget_type")]
    widget_type: WidgetType,
}

fn default_widget_type() -> WidgetType {
    WidgetType::Json
}

#[derive(Clone, Serialize)]
struct PositionPayload<'a> {
    path: &'a str,
    position: &'a PhysicalPosition<i32>,
}

#[derive(Clone, Serialize)]
struct SizePayload<'a> {
    path: &'a str,
    size: &'a PhysicalSize<u32>,
}

#[tauri::command]
pub async fn create_widget_window(app: tauri::AppHandle, path: String, is_preview: Option<bool>) {
    let clean_path = serde_json::from_str::<String>(&path).unwrap();
    let manifest_content = fs::read_to_string(clean_path.as_str()).expect("Cannot read manifest");
    let manifest: WidgetManifest =
        serde_json::from_str(&manifest_content).expect("invalid manifest");

    let title = manifest.label.unwrap_or_else(|| "Widget".to_string());
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
    let label = match manifest.widget_type {
        WidgetType::Json => "widget".into(),
        _ => title.to_lowercase().replace(' ', ""),
    };

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
        new_window.set_always_on_bottom(true).unwrap();
        attach_window_events(new_window.clone(), app, clean_path);
    }
}

fn attach_window_events(
    new_window: tauri::WebviewWindow,
    app: tauri::AppHandle,
    clean_path: String,
) {
    new_window.clone().on_window_event(move |event| {
        match event {
            tauri::WindowEvent::Moved(position) => {
                let _ = app.emit(
                    "position-moved",
                    PositionPayload {
                        path: &clean_path,
                        position,
                    },
                );
            }
            tauri::WindowEvent::Resized(size) => {
                let _ = app.emit(
                    "resized",
                    SizePayload {
                        path: &clean_path,
                        size,
                    },
                );
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
