use include_dir::{include_dir, Dir};
use serde_json::Value;
use std::fs;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use tauri_plugin_autostart::ManagerExt;

use crate::commands::store::{self, KVPair};
use crate::migrations::all_migrations;
use crate::{commands::widget::create_widget_window, setup::utils::ensure_paths};
use crate::{
    migration::{run_migrations, Direction},
    setup::utils::copy_embedded_dir,
};

pub static TEMPLATES: Dir = include_dir!("$CARGO_MANIFEST_DIR/widget_templates");

fn init_updater(app: &tauri::App) -> anyhow::Result<()> {
    if !cfg!(debug_assertions) {
        app.handle()
            .plugin(tauri_plugin_updater::Builder::new().build())?;
        let app_handle = app.handle().clone();
        tauri::async_runtime::spawn(async move {
            use tauri_plugin_notification::NotificationExt;
            use tauri_plugin_updater::UpdaterExt;

            if let Ok(updater) = app_handle.updater() {
                if let Ok(Some(update)) = updater.check().await {
                    app_handle
                        .notification()
                        .builder()
                        .title("An update is available!")
                        .body(format!(
                            "A new version (v{}) of the app is available to download.",
                            update.version
                        ))
                        .show()
                        .ok();
                }
            }
        });
    } else {
        println!("Updater disabled in dev mode");
    }
    Ok(())
}

fn init_tray(app: &tauri::App) -> anyhow::Result<()> {
    let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_i, &quit_i])?;
    let tray = TrayIconBuilder::new()
        .menu(&menu)
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Delta Widgets")
        .title("Delta Widgets")
        .build(app)?;

    tray.on_menu_event(|app, event| match event.id.as_ref() {
        "show" => {
            let window = app.get_webview_window("main").unwrap();
            window.show().unwrap();
            window.set_focus().unwrap();
        }
        "quit" => {
            println!("quit menu item was clicked");
            app.exit(0);
        }
        _ => {
            println!("menu item {:?} not handled", event.id);
        }
    });

    Ok(())
}

fn init_autostart(app: &tauri::App) -> anyhow::Result<()> {
    #[cfg(target_os = "windows")]
    let is_autostart = std::env::args().any(|arg| arg == "--autostart");

    #[cfg(target_os = "macos")]
    let is_autostart = std::env::var("TAURI_AUTOSTART").is_ok();

    #[cfg(target_os = "linux")]
    let is_autostart = std::env::args().any(|arg| arg == "--autostart");

    let Some(main_window) = app.get_webview_window("main") else {
        anyhow::bail!("no main window found");
    };
    if is_autostart {
        main_window.hide()?; // keep window hidden
    } else {
        main_window.show()?; // show normally
    }
    let autostart_manager = app.autolaunch();
    let autostart_enabled = autostart_manager.is_enabled().unwrap_or(false);
    let store = store::get_or_create_store(app.handle())?;

    let store_autostart = store.get("autostart").and_then(Value::as_bool);
    match store_autostart {
        Some(autostart) => {
            if autostart && !autostart_enabled {
                autostart_manager.enable()?;
            } else if !autostart && autostart_enabled {
                autostart_manager.disable()?;
            }
        }
        None => {
            // Default to enabled if not set
            let _ = store::write_to_store(
                app.handle(),
                vec![KVPair {
                    key: "autostart".to_string(),
                    value: serde_json::json!(true),
                }],
            );
            if !autostart_enabled {
                autostart_manager.enable()?;
            }
        }
    }

    Ok(())
}

fn init_widgets(app: &tauri::App) -> anyhow::Result<()> {
    let widgets_dir = app
        .path()
        .resolve("widgets", tauri::path::BaseDirectory::AppData)?
        .to_path_buf();

    let app_handle = app.handle().clone();
    tauri::async_runtime::spawn(async move {
        let mut paths: Vec<String> = vec![];
        widgets_dir
            .exists()
            .then(|| {
                println!("Widgets directory exists: {:?}", widgets_dir.display());
            })
            .unwrap_or_else(|| {
                println!(
                    "Widgets directory does not exist, creating: {:?}",
                    widgets_dir.display()
                );
                fs::create_dir_all(&widgets_dir).expect("Failed to create widgets directory");
            });

        let is_dir_empty = widgets_dir
            .read_dir()
            .map(|mut i| i.next().is_none())
            .unwrap_or(false);
        if is_dir_empty {
            copy_embedded_dir(&TEMPLATES, &widgets_dir).expect("Failed to copy widgets directory");
        }
        if let Err(e) = run_migrations(&app_handle, all_migrations(), Direction::Up) {
            eprintln!("Migration failed: {:?}", e);
        }

        let entries = widgets_dir
            .read_dir()
            .expect("Cannot read widgets directory");
        for entry in entries {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => continue,
            };

            let entry_path = entry.path();
            let manifest_path = entry_path.join("manifest.json");
            if manifest_path.exists() {
                if let Ok(json) = fs::read_to_string(&manifest_path)
                    .and_then(|contents| Ok(serde_json::from_str::<serde_json::Value>(&contents)))
                    .expect("Cannot read manifest")
                {
                    let visible = json
                        .get("visible")
                        .and_then(Value::as_bool)
                        .unwrap_or_else(|| false);

                    if visible {
                        paths.push(manifest_path.to_str().unwrap().to_string());
                    }
                }
            }
        }
        for path in paths {
            create_widget_window(
                app_handle.clone(),
                serde_json::json!(path).to_string(),
                Some(false),
            )
            .await;
        }
    });

    Ok(())
}

pub fn init_app(app: &&mut tauri::App) -> anyhow::Result<()> {
    ensure_paths(&app);
    init_updater(&app)?;
    init_tray(&app)?;
    init_autostart(&app)?;
    init_widgets(&app)?;

    Ok(())
}
