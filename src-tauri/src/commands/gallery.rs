use futures::{stream, StreamExt, TryStreamExt};
use http::header::{CONTENT_LENGTH, CONTENT_TYPE};
use serde_json::json;
use std::{
    collections::HashMap,
    fs::{self, File},
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{Emitter, Manager};
use walkdir::{DirEntry, WalkDir};
use zip::{write::SimpleFileOptions, ZipWriter};

#[derive(serde::Deserialize, Debug, Clone)]
pub struct UploadJobs {
    url: String,
    name: String,
    path: Option<String>,
}
#[derive(serde::Deserialize, Debug, Clone)]
pub struct UploadValues {
    key: String,
    label: String,
    version: String,
    description: Option<String>,
}

fn should_skip(entry: &DirEntry) -> bool {
    if !entry.file_type().is_dir() {
        return false;
    }

    matches!(
        entry.file_name().to_str(),
        Some(
            "node_modules"
                | ".git"
                | ".next"
                | "dist"
                | "build"
                | "target"
                | ".turbo"
                | ".cache"
                | ".parcel-cache"
                | ".svelte-kit"
                | "coverage"
                | ".idea"
                | ".vscode"
        )
    )
}

async fn upload_string(url: &str, body: String, content_type: Option<&str>) -> anyhow::Result<()> {
    let mut client = reqwest::Client::new().put(url);
    if let Some(content_type) = content_type {
        client = client.header(CONTENT_TYPE, content_type);
    }
    client.body(body).send().await?.error_for_status()?;

    Ok(())
}
async fn upload_file(url: &str, path: &Path, content_type: Option<&str>) -> anyhow::Result<()> {
    let file = tokio::fs::File::open(path).await?;
    let file_size = file.metadata().await?.len();

    let body = reqwest::Body::wrap_stream(tokio_util::io::ReaderStream::new(file));

    let mut client = reqwest::Client::new()
        .put(url)
        .header(CONTENT_LENGTH, file_size);
    if let Some(content_type) = content_type {
        client = client.header(CONTENT_TYPE, content_type);
    }
    client.body(body).send().await?.error_for_status()?;

    Ok(())
}

pub async fn upload_html_asset(
    app: &tauri::AppHandle,
    key: &str,
    manifest: &serde_json::Value,
    job: &UploadJobs,
) -> Result<(), String> {
    let local_dir_path = manifest
        .get("file")
        .and_then(serde_json::Value::as_str)
        .ok_or("Local directory does not exist")?;
    if local_dir_path.is_empty() {
        return Err("Local directory does not exist".to_string());
    }

    let local_dir = std::path::Path::new(local_dir_path);
    if !local_dir.exists() {
        return Err("Local directory does not exist".to_string());
    }
    let zip_asset_dir = app.path().app_cache_dir().unwrap().join("zips");
    fs::create_dir_all(&zip_asset_dir).map_err(|_| "Failed to create zip directory")?;

    let zip_path = zip_asset_dir.join(format!(
        "{}-{}.zip",
        key,
        SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    ));

    let file = File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);

    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    for entry in WalkDir::new(local_dir)
        .into_iter()
        .filter_entry(|e| !should_skip(e))
        .filter_map(Result::ok)
    {
        let path = entry.path();

        let rel_path = path.strip_prefix(local_dir).map_err(|e| e.to_string())?;
        let rel_path_str = rel_path
            .to_str()
            .map(str::to_owned)
            .ok_or_else(|| format!("{:?} is a Non UTF-8 Path", rel_path.display()))?;

        if path.is_file() {
            zip.start_file(rel_path_str, options)
                .map_err(|e| e.to_string())?;

            let mut f = File::open(path).map_err(|e| e.to_string())?;
            std::io::copy(&mut f, &mut zip).map_err(|e| e.to_string())?;
        } else if !rel_path.as_os_str().is_empty() {
            zip.add_directory(rel_path_str, options)
                .map_err(|e| e.to_string())?;
        }
    }

    zip.finish().map_err(|e| e.to_string())?;

    upload_file(&job.url, &zip_path, Some("application/zip"))
        .await
        .map_err(|e| e.to_string())?;

    fs::remove_file(&zip_path).map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn upload_json_asset(
    app: &tauri::AppHandle,
    key: &str,
    manifest: &serde_json::Value,
    job: &UploadJobs,
) -> Result<(), String> {
    let custom_assets = Vec::new();
    let custom_assets = manifest
        .get("customAssets")
        .and_then(serde_json::Value::as_array)
        .unwrap_or(&custom_assets);
    if custom_assets.is_empty() {
        return Ok(());
    }
    let zip_asset_dir = app.path().app_cache_dir().unwrap().join("zips");
    fs::create_dir_all(&zip_asset_dir).map_err(|_| "Failed to create zip directory")?;

    let zip_path = zip_asset_dir.join(format!(
        "{}-{}.zip",
        key,
        SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    ));

    let file = File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut zip = ZipWriter::new(file);

    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    for asset in custom_assets {
        if asset.get("kind").and_then(serde_json::Value::as_str) != Some("file") {
            continue;
        }

        let Some(path) = asset.get("path").and_then(serde_json::Value::as_str) else {
            continue;
        };
        let Some(key) = asset.get("key").and_then(serde_json::Value::as_str) else {
            continue;
        };

        zip.start_file(key, options).map_err(|e| e.to_string())?;

        let mut f = File::open(path).map_err(|e| e.to_string())?;
        std::io::copy(&mut f, &mut zip).map_err(|e| e.to_string())?;
    }

    zip.finish().map_err(|e| e.to_string())?;

    upload_file(&job.url, &zip_path, Some("application/zip"))
        .await
        .map_err(|e| e.to_string())?;

    fs::remove_file(&zip_path).map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn upload_asset(
    app: &tauri::AppHandle,
    key: &str,
    manifest: &serde_json::Value,
    job: &UploadJobs,
) -> Result<(), String> {
    let widget_type = manifest
        .get("widgetType")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default();
    if widget_type == "html" {
        return upload_html_asset(app, key, manifest, job).await;
    }
    if widget_type == "json" {
        return upload_json_asset(app, key, manifest, job).await;
    }
    Ok(())
}

pub async fn upload_manifest(
    upload_values: &UploadValues,
    manifest: &serde_json::Value,
    job: &UploadJobs,
) -> Result<(), String> {
    let mut manifest = manifest.clone();
    if let serde_json::Value::Object(ref mut map) = manifest {
        map["key"] = json!(&upload_values.key);
        map["label"] = json!(&upload_values.label);
        map.insert("visible".to_string(), json!(false));
        map.insert("pinned".to_string(), json!(false));
        map.insert("alwaysOnTop".to_string(), json!(false));
        map.insert("version".to_string(), json!(&upload_values.version));
        map.insert("position".to_string(), json!({"x": 30, "y": 30}));
        map.insert(
            "description".to_string(),
            json!(upload_values.description.clone().unwrap_or_default()),
        );

        if map.get("file").is_some() {
            map["file"] = json!("./assets");
        }
        if let Some(custom_assets) = map
            .get_mut("customAssets")
            .and_then(serde_json::Value::as_array_mut)
        {
            for asset in custom_assets {
                let Some(asset) = asset.as_object_mut() else {
                    continue;
                };
                if asset.get("kind").and_then(serde_json::Value::as_str) != Some("file") {
                    continue;
                }
                let Some(key) = asset.get("key").and_then(serde_json::Value::as_str) else {
                    continue;
                };

                asset.insert("path".to_string(), json!(format!("./{}", key)));
            }
        }
    }
    if let Ok(json_string) = serde_json::to_string_pretty(&manifest) {
        return upload_string(&job.url, json_string, Some("application/json"))
            .await
            .map_err(|e| e.to_string());
    }
    Ok(())
}

#[tauri::command]
pub async fn upload_widget(
    app: tauri::AppHandle,
    upload_jobs: Vec<UploadJobs>,
    manifest_path: String,
    upload_values: UploadValues,
) -> Result<(), String> {
    let manifest_content =
        fs::read_to_string(manifest_path.as_str()).map_err(|_| "Cannot read manifest")?;
    let manifest: serde_json::Value =
        serde_json::from_str(&manifest_content).map_err(|_| "Malformed json")?;

    let key = manifest
        .get("key")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default();

    let manifest = std::sync::Arc::new(manifest.clone());

    stream::iter(upload_jobs)
        .map(|job| {
            let app = app.clone();
            let key = key.to_string();
            let manifest = manifest.clone();
            let upload_values = upload_values.clone();
            async move {
                if job.name == "manifest.json" {
                    upload_manifest(&upload_values, &manifest, &job).await
                } else if job.name == "assets.zip" {
                    upload_asset(&app, &key, &manifest, &job).await
                } else {
                    let path = job.path.unwrap_or_default();
                    if path.is_empty() {
                        return Err("Empty path found".to_string());
                    }
                    upload_file(&job.url, std::path::Path::new(&path), None)
                        .await
                        .map_err(|e| e.to_string())
                }
            }
        })
        .buffer_unordered(4)
        .try_collect::<Vec<_>>()
        .await?;

    Ok(())
}

#[tauri::command]
pub async fn validate_widget_asset(asset_path: String) -> Result<(), String> {
    let local_dir = std::path::Path::new(&asset_path);
    if !local_dir.exists() {
        return Err("Local directory does not exist".to_string());
    }

    const MAX_FILES: usize = 500;

    let mut file_count = 0;
    for entry in WalkDir::new(local_dir)
        .into_iter()
        .filter_entry(|e| !should_skip(e))
        .filter_map(Result::ok)
    {
        if entry.file_type().is_file() {
            file_count += 1;
        }
    }

    if file_count > MAX_FILES {
        return Err("Too many files".to_string());
    }
    Ok(())
}

async fn download_file(url: &str, dest: &Path) -> anyhow::Result<()> {
    use tokio::io::AsyncWriteExt;

    let client = reqwest::Client::new();

    let response = client.get(url).send().await?.error_for_status()?;
    let mut stream = response.bytes_stream();

    let mut file = tokio::fs::File::create(dest).await?;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        file.write_all(&chunk).await?;
    }

    Ok(())
}
fn extract_zip(file_path: &Path, output_dir: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(file_path)?;
    let mut archive = zip::ZipArchive::new(file)?;
    archive.extract(output_dir)?;

    Ok(())
}

#[derive(serde::Deserialize)]
pub struct Files {
    manifest: String,
    assets: Option<String>,
    thumb: Option<String>,
}

#[tauri::command]
pub async fn download_widget(
    app: tauri::AppHandle,
    key: String,
    files: Files,
) -> Result<(), String> {
    if files.manifest.is_empty() {
        return Err("No Manifest URL found".to_string());
    }
    let dir_key = key.replace("/", "-");

    let widgets_dir = app
        .path()
        .resolve("widgets", tauri::path::BaseDirectory::AppData)
        .map_err(|_| "Failed to get widget path".to_string())?;
    let install_dir = widgets_dir.join(&dir_key);
    let temp_install_dir = widgets_dir.join(format!("{}.installing", dir_key));

    fs::create_dir_all(&temp_install_dir).map_err(|_| "Failed to create temp path".to_string())?;

    let temp_manifest_path = &temp_install_dir.join("manifest.json");
    download_file(&files.manifest, temp_manifest_path)
        .await
        .map_err(|_| "Failed to download manifest")?;

    let temp_manifest =
        fs::read_to_string(temp_manifest_path).map_err(|_| "Cannot read manifest")?;
    let mut temp_manifest: HashMap<String, serde_json::Value> =
        serde_json::from_str(&temp_manifest).map_err(|_| "Malformed json")?;

    if let Some(url) = files.assets {
        let dest = &temp_install_dir.join("assets.zip");
        download_file(&url, dest)
            .await
            .map_err(|_| "Failed to download assets")?;

        extract_zip(dest, &temp_install_dir.join("assets")).map_err(|e| e.to_string())?;
        let _ = fs::remove_file(dest);

        let widget_type = temp_manifest
            .get("widgetType")
            .and_then(serde_json::Value::as_str)
            .unwrap_or_default();
        let assets_dir = &install_dir.join("assets");
        if widget_type == "html" {
            temp_manifest.insert(
                "file".to_string(),
                json!(assets_dir.to_str().unwrap_or_default()),
            );
        } else if widget_type == "json" {
            if let Some(custom_assets) = temp_manifest
                .get_mut("customAssets")
                .and_then(serde_json::Value::as_array_mut)
            {
                for asset in custom_assets {
                    let Some(asset) = asset.as_object_mut() else {
                        continue;
                    };
                    if asset.get("kind").and_then(serde_json::Value::as_str) != Some("file") {
                        continue;
                    }
                    let Some(key) = asset.get("key").and_then(serde_json::Value::as_str) else {
                        continue;
                    };

                    asset.insert(
                        "path".to_string(),
                        json!(assets_dir.join(key).to_string_lossy().to_string()),
                    );
                }
            }
        }
    }

    if let Some(url) = files.thumb {
        let dest = &temp_install_dir.join("thumb.png");
        download_file(&url, dest)
            .await
            .map_err(|_| "Failed to download thumb")?;
    }

    // preserve existing values
    let manifest_path = &install_dir.join("manifest.json");
    if manifest_path.exists() {
        let manifest = fs::read_to_string(manifest_path).map_err(|_| "Cannot read manifest")?;
        let manifest: HashMap<String, serde_json::Value> =
            serde_json::from_str(&manifest).map_err(|_| "Malformed json")?;

        for key in ["visible", "pinned", "alwaysOnTop", "position"] {
            if let Some(value) = manifest.get(key) {
                temp_manifest.insert(key.to_string(), value.clone());
            }
        }
    }

    temp_manifest.insert(
        "installedAt".to_string(),
        json!(SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_millis()),
    );
    temp_manifest.insert("isGalleryWidget".to_string(), json!(true));

    // write updated manifest to temp dir
    let json_string = serde_json::to_string_pretty(&temp_manifest).map_err(|e| e.to_string())?;
    fs::write(temp_manifest_path, &json_string).map_err(|e| e.to_string())?;

    // swap existing and temp dir
    let backup_dir = widgets_dir.join(format!("{}.backup", dir_key));
    if install_dir.exists() {
        let _ = fs::rename(&install_dir, &backup_dir);
    }
    let _ = fs::rename(&temp_install_dir, &install_dir);

    if backup_dir.exists() {
        let _ = fs::remove_dir_all(&backup_dir);
    }

    let _ = app.emit_to("main", "creator-close", 1);
    let _ = app.emit_to(format!("widget-{}", key), "update-manifest", 1);

    if let Some(window) = app.get_webview_window("main") {
        window.show().unwrap();
        window.set_focus().unwrap();
    }

    Ok(())
}
