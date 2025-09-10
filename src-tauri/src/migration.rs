use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager};

pub enum Direction {
    Up,
    Down,
}

pub trait Migration {
    fn name(&self) -> &'static str;
    fn up(&self, json: &mut Value);
    fn down(&self, json: &mut Value);

    fn apply_to_file(&self, path: &Path, direction: Direction) -> Result<()> {
        let mut file_content = std::fs::read_to_string(path)?;
        let mut json: Value = serde_json::from_str(&file_content)?;

        match direction {
            Direction::Up => self.up(&mut json),
            Direction::Down => self.down(&mut json),
        }

        file_content = serde_json::to_string_pretty(&json)?;
        std::fs::write(path, file_content)?;

        Ok(())
    }
}

#[derive(Serialize, Deserialize, Default)]
struct MigrationState {
    applied: Vec<String>,
}

pub fn run_migrations(
    app: &AppHandle,
    migrations: Vec<Box<dyn Migration>>,
    direction: Direction,
) -> anyhow::Result<()> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");
    let state_path = app_data_dir.join(".migrations.json");

    let mut state: MigrationState = if state_path.exists() {
        serde_json::from_str(&fs::read_to_string(&state_path)?)?
    } else {
        MigrationState::default()
    };

    let widgets_root = app_data_dir.join("widgets");
    let widget_dirs = fs::read_dir(&widgets_root)?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_dir())
        .collect::<Vec<_>>();

    match direction {
        Direction::Up => {
            let total = migrations.len();
            for migration in migrations {
                let name = migration.name().to_string();
                if !state.applied.contains(&name) {
                    println!("⬆️ Running migration: {}", name);
                    for widget in &widget_dirs {
                        let manifest_path = widget.path().join("manifest.json");
                        migration.apply_to_file(&manifest_path, Direction::Up)?;
                    }
                    state.applied.push(name);
                } else {
                    println!("✅ Skipped already applied migration: {}", name);
                }
            }
            println!("🎉 Applied {} migrations", total);
        }
        Direction::Down => {
            if let Some(last) = state.applied.pop() {
                println!("⬇️ Rolling back migration: {}", &last);
                if let Some(migration) = migrations.into_iter().find(|m| m.name() == last) {
                    for widget in &widget_dirs {
                        let manifest_path = widget.path().join("manifest.json");
                        migration.apply_to_file(&manifest_path, Direction::Down)?;
                    }
                }
                println!("🎉 Rolled back last migration");
            } else {
                println!("ℹ️ No migrations to rollback");
            }
        }
    }

    fs::write(state_path, serde_json::to_string_pretty(&state)?)?;
    Ok(())
}
