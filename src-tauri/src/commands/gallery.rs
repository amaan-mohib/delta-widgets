use std::{
    fs::{self, File},
    time::SystemTime,
};
use tauri::Manager;
use walkdir::WalkDir;
use zip::{write::SimpleFileOptions, ZipWriter};

#[tauri::command]
pub async fn upload_html_widget(
    app: tauri::AppHandle,
    manifest_path: String,
) -> anyhow::Result<String, String> {
    let manifest_content =
        fs::read_to_string(manifest_path.as_str()).map_err(|_| "Cannot read manifest")?;
    let manifest: serde_json::Value =
        serde_json::from_str(&manifest_content).map_err(|_| "Malformed json")?;

    let local_dir_path = manifest
        .get("file")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default();
    if local_dir_path.is_empty() {
        return Err("Local directory does not exist".into());
    }

    let local_dir = std::path::Path::new(local_dir_path);
    if !local_dir.exists() {
        return Err("Local directory does not exist".into());
    }

    let key = manifest
        .get("key")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default();

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

    for entry in WalkDir::new(local_dir) {
        let entry = entry.map_err(|e| e.to_string())?;
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

    // let R2Client { client, bucket } = R2Client::new().await;

    // let body = ByteStream::from_path(&zip_path)
    //     .await
    //     .map_err(|e| format!("Failed to read file: {}", e))?;

    // client
    //     .put_object()
    //     .bucket(&bucket)
    //     // === UPDATE TEST AND VERSIONING ===
    //     .key(format!("test/{}/{}/assets.zip", key, "versioning"))
    //     .body(body)
    //     .content_type("application/zip")
    //     .content_disposition("attachment")
    //     .send()
    //     .await
    //     .map_err(|e| format!("S3 upload error: {}", e))?;

    fs::remove_file(&zip_path).map_err(|e| e.to_string())?;

    Ok("All assets uploaded successfully!".into())
}
