use include_dir::{Dir, DirEntry};
use std::fs;
use tauri::Manager;

pub fn ensure_paths(app: &tauri::App) {
    let app_data = app.path().app_data_dir().unwrap();
    let app_cache = app.path().app_cache_dir().unwrap();

    fs::create_dir_all(&app_data).expect("Failed to create AppData dir");
    fs::create_dir_all(&app_cache).expect("Failed to create AppCache dir");
}

pub fn copy_embedded_dir(dir: &Dir, target: &std::path::Path) -> std::io::Result<()> {
    fs::create_dir_all(target)?;

    for entry in dir.entries() {
        match entry {
            DirEntry::Dir(subdir) => {
                copy_embedded_dir(subdir, &target.join(subdir.path().file_name().unwrap()))?;
            }
            DirEntry::File(file) => {
                let dest_path = target.join(file.path().file_name().unwrap());
                if let Some(parent) = dest_path.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::write(&dest_path, file.contents())?;
            }
        }
    }

    Ok(())
}
