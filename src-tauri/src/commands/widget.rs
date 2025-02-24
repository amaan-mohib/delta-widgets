// use tauri::Runtime;

use std::{fs::File, io::Read};

#[tauri::command]
pub async fn create_creator_window(app: tauri::AppHandle, manifest: String) {
    let mut buffer = Vec::new();
    let wallpaper_path = wallpaper::get().unwrap();
    let mut file = File::open(wallpaper_path).unwrap();
    file.read_to_end(&mut buffer).unwrap();

    let init_script: &str = &format!(
        "window.__INITIAL_STATE__ = {{ manifest: {}, wallpaper: {:?} }};",
        manifest, buffer
    );
    tauri::WebviewWindowBuilder::new(
        &app,
        "creator",
        tauri::WebviewUrl::App("creator-index.html".into()),
    )
    .title("Widget Creator")
    .min_inner_size(1280.0, 720.0)
    .initialization_script(init_script)
    .maximized(true)
    .build()
    .unwrap();
}
