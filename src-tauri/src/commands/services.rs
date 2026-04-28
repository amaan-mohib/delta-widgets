use serde::Serialize;
use serde_json::{json, Value};
use std::fs;
use tauri::{Emitter, Manager};

#[cfg(target_os = "windows")]
use window_vibrancy::apply_mica;

use crate::commands::utils::{compare_if_no_thumb, copy_dir_all};

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

#[tauri::command]
pub async fn update_manifest_value(
    app: tauri::AppHandle,
    field: String,
    value: Value,
    path: String,
) -> Result<String, String> {
    let clean_path = serde_json::from_str::<String>(&path).unwrap();
    let config_content = fs::read_to_string(&clean_path).unwrap();

    let mut config: Value = serde_json::from_str(&config_content).map_err(|e| e.to_string())?;

    let key = config
        .get("key")
        .and_then(Value::as_str)
        .unwrap()
        .to_string();
    let label = format!("widget-{}", key);

    if field == "alwaysOnTop" {
        if let (Some(value), Some(window)) = (value.as_bool(), app.get_webview_window(&label)) {
            if let Err(err) = window.set_always_on_bottom(!value) {
                eprintln!("Error setting always on top: {}", err);
            }
            if let Err(err) = window.set_always_on_top(value) {
                eprintln!("Error setting always on top: {}", err);
            }
        }
    }

    if field == "pinned" {
        let widget_type = config
            .get("widgetType")
            .and_then(Value::as_str)
            .unwrap()
            .to_string();
        if widget_type == "url" {
            if let (Some(value), Some(window)) = (value.as_bool(), app.get_webview_window(&label)) {
                if let Err(err) = window.set_decorations(!value) {
                    eprintln!("Error setting decorations: {}", err);
                };
            };
        }
    }

    if let Value::Object(ref mut map) = config {
        map.insert(field, json!(value));
    }

    // Write the updated JSON back to the file
    if let Ok(json_string) = serde_json::to_string_pretty(&config) {
        fs::write(&clean_path, &json_string).map_err(|e| e.to_string())?;
        app.emit_to(format!("widget-{}", key), "update-manifest", 1)
            .map_err(|e| e.to_string())?;
        return Ok(json_string);
    }

    Ok("".to_string())
}
