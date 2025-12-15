use crate::{
    migration::{run_migrations, Direction},
    migrations::all_migrations,
};

#[tauri::command]
pub fn migrate(app: tauri::AppHandle, direction: String) -> Result<(), String> {
    if !cfg!(debug_assertions) {
        println!("Migrations can only be run in dev mode");
        return Ok(());
    }
    let dir = match direction.as_str() {
        "up" => Direction::Up,
        "down" => Direction::Down,
        _ => return Err("Invalid direction".into()),
    };

    run_migrations(&app, all_migrations(), dir).map_err(|e| e.to_string())
}
