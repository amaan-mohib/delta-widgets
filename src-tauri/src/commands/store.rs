use serde_json::Value;
use std::fs;
use tauri::AppHandle;
use tauri::Manager;

pub fn get_or_create_store(app_handle: &AppHandle) -> anyhow::Result<serde_json::Value> {
    let store_path = app_handle
        .path()
        .resolve("store.json", tauri::path::BaseDirectory::AppData)?;

    if !store_path.exists() {
        fs::write(&store_path, "{}")?;
    }
    let contents = fs::read_to_string(&store_path)?;
    Ok(serde_json::from_str::<serde_json::Value>(&contents)?)
}

#[derive(serde::Deserialize)]
pub struct KVPair {
    pub key: String,
    pub value: Value,
}

pub fn write_to_store(app_handle: &AppHandle, pairs: Vec<KVPair>) -> anyhow::Result<()> {
    let store_path = app_handle
        .path()
        .resolve("store.json", tauri::path::BaseDirectory::AppData)?;

    let mut store = get_or_create_store(app_handle)?;
    for pair in pairs {
        store[pair.key] = pair.value;
    }

    let contents = serde_json::to_string(&store)?;
    fs::write(store_path, contents)?;
    Ok(())
}

#[tauri::command]
pub async fn write_to_store_cmd(app: AppHandle, pairs: Vec<KVPair>) -> Result<(), String> {
    write_to_store(&app, pairs).map_err(|e| e.to_string())?;
    Ok(())
}
