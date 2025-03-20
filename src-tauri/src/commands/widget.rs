use std::{
    collections::HashMap,
    fs::{self, File},
    io::Read,
};

use serde_json::Value;
use tauri::{LogicalSize, Manager};

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

#[tauri::command]
pub async fn create_widget_window(app: tauri::AppHandle, path: String, is_preview: Option<bool>) {
    let init_script: &str = &format!(
        "window.__INITIAL_WIDGET_STATE__ = {{ manifestPath: {} }};",
        path
    );

    let mut dimensions = LogicalSize {
        height: 400.0,
        width: 600.0,
    };

    let mut title = "Widget".to_string();

    let clean_path = serde_json::from_str::<String>(&path).unwrap();
    if let Ok(json) = fs::read_to_string(clean_path.as_str())
        .and_then(|contents| Ok(serde_json::from_str::<serde_json::Value>(&contents)))
        .expect("Cannot read manifest")
    {
        if let Some(label) = json.get("label") {
            title = label.as_str().unwrap_or("Widget").to_string();
        }
        if let Some(json_dimensions) = json.get("dimensions") {
            let width = json_dimensions
                .get("width")
                .and_then(Value::as_f64)
                .unwrap_or(dimensions.width);
            let height = json_dimensions
                .get("height")
                .and_then(Value::as_f64)
                .unwrap_or(dimensions.height);
            dimensions = LogicalSize { width, height };
        }
    }

    let new_window = tauri::WebviewWindowBuilder::new(
        &app,
        "widget",
        tauri::WebviewUrl::App("widget-index.html".into()),
    )
    .title("Widget")
    .visible(false)
    .transparent(true)
    .resizable(false)
    .decorations(false)
    .shadow(false)
    .initialization_script(init_script)
    .build()
    .unwrap();

    new_window.set_size(dimensions).unwrap();
    new_window.set_title(&title).unwrap();
    new_window.show().unwrap();

    if !is_preview.unwrap_or(false) {
        new_window.set_always_on_bottom(true).unwrap();
        new_window.clone().on_window_event(move |event| {
            match event {
                // hack to keep widget unminimized
                tauri::WindowEvent::Resized(_) => {
                    if new_window.is_minimized().unwrap() {
                        new_window.unminimize().unwrap();
                    }
                }
                _ => {}
            };
        });
    }
}
