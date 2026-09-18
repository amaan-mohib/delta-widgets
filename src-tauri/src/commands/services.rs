use image::{DynamicImage, RgbaImage};
use serde::Serialize;
use serde_json::{json, Value};
use std::{fs, path::Path, time::Duration};
use tauri::{Emitter, Manager, Url};
use win_screenshot::prelude::*;

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
    pub manifest_path: String,
    pub thumb_path: String,
    pub modified_at: u64,
    pub created_at: u64,
    pub is_draft: bool,
}

fn timestamp_millis(time: std::time::SystemTime) -> u64 {
    time.duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |duration| duration.as_millis() as u64)
}

#[tauri::command]
pub async fn get_all_widgets(
    app: tauri::AppHandle,
    dir: Option<&str>,
) -> Result<Vec<WidgetWithMeta>, String> {
    let mut result = Vec::new();

    let mut dir_list: Vec<&str> = vec!["saves", "widgets"];

    if let Some(d) = dir {
        if d != "saves" && d != "widgets" {
            return Err("Invalid directory".to_string());
        }
        dir_list = vec![d];
    };

    for sub_dir in dir_list {
        let saves = sub_dir == "saves";
        let path = app
            .path()
            .resolve(sub_dir, tauri::path::BaseDirectory::AppData)
            .map_err(|_| "Failed to get widget path".to_string())?;
        if !path.exists() {
            fs::create_dir_all(&path).map_err(|e| e.to_string())?;
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
            let ext = path.extension().unwrap_or_default();
            if ext == "backup" || ext == "installing" {
                continue;
            }

            let manifest_path = path.join("manifest.json");
            let thumb_path = path.join("thumb.png");

            if !manifest_path.exists() {
                continue;
            }

            let content = match fs::read_to_string(&manifest_path) {
                Ok(c) => c,
                Err(_) => continue,
            };
            let mut manifest_json: serde_json::Value = match serde_json::from_str(&content) {
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

            let modified_at = metadata.modified().map(timestamp_millis).unwrap_or(0);
            let created_at = metadata.created().map(timestamp_millis).unwrap_or(0);

            result.push(WidgetWithMeta {
                manifest: manifest_json,
                path: if saves {
                    manifest_path.to_string_lossy().to_string()
                } else {
                    path.to_string_lossy().to_string()
                },
                manifest_path: manifest_path.to_string_lossy().to_string(),
                thumb_path: thumb_path.to_string_lossy().to_string(),
                modified_at,
                created_at,
                is_draft: saves,
            });
        }
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
        app.emit_to(label, "update-manifest", 1)
            .map_err(|e| e.to_string())?;
        return Ok(json_string);
    }

    Ok("".to_string())
}

#[tauri::command]
pub async fn create_gallery_window(
    app: tauri::AppHandle,
    url: Option<String>,
) -> Result<(), String> {
    let base_url = option_env!("VITE_GALLERY_LINK").unwrap_or("http://localhost:3000");

    let mut url = url.unwrap_or(base_url.to_string());
    if !url.starts_with(base_url) {
        url = format!("{}{}", base_url, url);
    }

    if let Some(mut existing_window) = app.get_webview_window("gallery") {
        if url != base_url {
            let _ = existing_window.navigate(Url::parse(&url).map_err(|e| e.to_string())?);
        }
        existing_window.set_focus().unwrap();
        existing_window.show().unwrap();
        return Ok(());
    };

    let new_window =
        tauri::WebviewWindowBuilder::new(&app, "gallery", tauri::WebviewUrl::App(url.into()))
            .title("Gallery")
            .inner_size(1024.0, 640.0)
            .min_inner_size(500.0, 400.0)
            .transparent(true)
            .build()
            .unwrap();
    new_window.show().unwrap();
    new_window.set_focus().unwrap();

    Ok(())
}

#[tauri::command]
pub async fn capture_widget_screenshot(
    app: tauri::AppHandle,
    label: String,
    manifest_path: String,
    refresh: Option<bool>,
    custom_name: Option<String>,
) -> Result<String, String> {
    let img_path = Path::new(&manifest_path)
        .join("..")
        .join(custom_name.unwrap_or("thumb.png".to_string()));
    let refresh = refresh.unwrap_or(false);
    if !refresh && img_path.try_exists().unwrap_or(false) {
        return Ok(img_path.to_string_lossy().to_string());
    }

    let existing_window = app
        .get_webview_window(&label)
        .ok_or(format!("No window found with label: {}", label))?;
    let id = existing_window.hwnd().map_err(|e| e.to_string())?;

    std::thread::sleep(Duration::from_secs(2));
    let buf = capture_window(id.0 as isize).map_err(|e| e.to_string())?;
    let img = DynamicImage::ImageRgba8(
        RgbaImage::from_raw(buf.width, buf.height, buf.pixels)
            .ok_or("Failed to create image".to_string())?,
    );
    img.to_rgba8().save(&img_path).map_err(|e| e.to_string())?;

    Ok(img_path.to_string_lossy().to_string())
}
