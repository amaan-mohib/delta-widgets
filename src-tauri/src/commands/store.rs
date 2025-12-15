use serde_json::Value;
use std::fs;
use tauri::AppHandle;
use tauri::Manager;

pub fn get_or_create_store(app_handle: &AppHandle) -> Result<serde_json::Value, serde_json::Error> {
    let store_path = app_handle
        .path()
        .resolve("store.json", tauri::path::BaseDirectory::AppData)
        .unwrap();

    if !store_path.exists() {
        fs::write(&store_path, "{}").expect("Failed to create store file");
    }
    fs::read_to_string(&store_path)
        .and_then(|contents| Ok(serde_json::from_str::<serde_json::Value>(&contents)))
        .expect("Cannot read store file")
}

pub fn write_to_store(
    app_handle: &AppHandle,
    key: &str,
    value: serde_json::Value,
) -> Result<(), std::io::Error> {
    let store_path = app_handle
        .path()
        .resolve("store.json", tauri::path::BaseDirectory::AppData)
        .unwrap();

    let mut store = get_or_create_store(app_handle)?;
    store[key] = value;

    fs::write(store_path, serde_json::to_string(&store).unwrap())?;
    Ok(())
}

#[tauri::command]
pub async fn write_to_store_cmd(app: AppHandle, key: String, value: Value) -> Result<(), String> {
    let value = serde_json::to_value(value).map_err(|e| e.to_string())?;
    write_to_store(&app, &key, value).map_err(|e| e.to_string())?;
    Ok(())
}
