mod commands;
pub mod migration;
pub mod migrations;
mod plugins;
mod setup;

use commands::{analytics, audio, media, migrate, services, store, system, widget};
use log::LevelFilter;
use plugins::localhost;
use setup::init::init_app;
use std::{env, sync::OnceLock};
use tauri::Manager;
use tauri_plugin_log::{Target, TargetKind};

static CUSTOM_SERVER_PORT: OnceLock<u16> = OnceLock::new();
pub fn get_custom_server_port() -> u16 {
    match CUSTOM_SERVER_PORT.get() {
        Some(port) => *port,
        None => panic!("Custom server port is not set"),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let port = portpicker::pick_unused_port().expect("failed to find unused port");

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Webview),
                    Target::new(TargetKind::LogDir {
                        file_name: Some(String::from("logs")),
                    }),
                ])
                .level(LevelFilter::Error)
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(webview_window) = app.get_webview_window("main") {
                let _ = webview_window.show();
                let _ = webview_window.set_focus();
            }
        }))
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .arg("--autostart")
                .app_name("Delta Widgets")
                .build(),
        )
        .plugin(tauri_plugin_system_info::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_prevent_default::debug())
        .plugin(localhost::Builder::new(port).build())
        .manage(std::sync::Mutex::new(audio::AudioState::new()))
        .manage(tokio::sync::Mutex::new(media::MediaState::new()))
        .invoke_handler(tauri::generate_handler![
            media::get_media,
            media::start_media_listener_cmd,
            media::stop_media_listener_cmd,
            media::media_action,
            services::get_all_widgets,
            services::copy_custom_assets,
            services::copy_custom_assets_dir,
            services::apply_blur_theme,
            services::create_url_thumbnail,
            services::update_manifest_value,
            widget::create_creator_window,
            widget::create_widget_window,
            widget::close_widget_window,
            widget::publish_widget,
            widget::toggle_widget_visibility,
            widget::open_devtools,
            system::get_system_info,
            analytics::track_analytics_event,
            store::write_to_store_cmd,
            migrate::migrate,
            audio::start_audio_capture,
            audio::stop_audio_capture,
            audio::restart_audio_capture,
            audio::get_current_device_cmd,
        ])
        .setup(|app| {
            init_app(&app)?;
            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                // hide the main window instead of closing it
                if window.label() == "main" {
                    window.hide().unwrap();
                    api.prevent_close();
                }
            }
            _ => {}
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |_, event| match event {
            tauri::RunEvent::Ready => {
                println!("Tauri application is ready");
                CUSTOM_SERVER_PORT
                    .set(port)
                    .expect("Failed to set global port");
            }
            _ => {}
        });
}
