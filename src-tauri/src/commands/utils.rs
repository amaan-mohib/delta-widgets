use base64::{prelude::BASE64_STANDARD, Engine};
use image::GenericImageView;
use serde_json::{json, Value};
use std::os::windows::ffi::OsStrExt;
use std::{
    collections::HashMap,
    fs::{self},
    io::{self},
    path::{Path, PathBuf},
    sync::Mutex,
    time::{Duration, SystemTime},
};
use tauri::{Manager, PhysicalPosition, PhysicalSize};
use tauri_plugin_system_info::SysInfoState;
use tokio::time::{sleep, Instant};
use windows::{
    core::{Error, PCWSTR},
    ApplicationModel::AppDisplayInfo,
    Foundation::Size,
    Storage::Streams::{Buffer, DataReader, InputStreamOptions},
    Win32::Storage::FileSystem::{GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW},
};
use windows_icons::get_icon_by_path;

static NO_THUMB_BYTES: &'static [u8] = include_bytes!("no-thumb.png");

#[derive(serde::Deserialize)]
struct ManifestKey {
    key: Option<String>,
}
pub fn get_existing_keys(
    app: &tauri::AppHandle,
    current_folder: String,
) -> HashMap<String, Option<()>> {
    let mut existing_keys: HashMap<String, Option<()>> = HashMap::new();

    for sub_dir in vec!["saves", "widgets"] {
        let Ok(base_path) = app
            .path()
            .resolve(sub_dir, tauri::path::BaseDirectory::AppData)
        else {
            continue;
        };
        let Ok(entries) = fs::read_dir(&base_path) else {
            continue;
        };
        for entry in entries.flatten() {
            let entry_path = entry.path();

            if entry_path.to_string_lossy() == current_folder {
                continue;
            }
            let manifest_path = entry_path.join("manifest.json");
            if !manifest_path.exists() {
                continue;
            }

            let Ok(contents) = fs::read_to_string(&manifest_path) else {
                continue;
            };

            let Ok(manifest) = serde_json::from_str::<ManifestKey>(&contents) else {
                continue;
            };
            if let Some(key) = manifest.key {
                existing_keys.insert(key, None);
            }
        }
    }

    existing_keys
}

pub fn ensure_window_position_bounds(
    webview: &tauri::WebviewWindow,
    position: PhysicalPosition<i32>,
    size: PhysicalSize<u32>,
) -> PhysicalPosition<i32> {
    let monitors = webview.available_monitors().unwrap();

    let win_x = position.x;
    let win_y = position.y;
    let win_right = win_x + size.width as i32;
    let win_bottom = win_y + size.height as i32;

    let mut in_bounds = false;

    for monitor in &monitors {
        let monitor_size = monitor.size();
        let monitor_position = monitor.position();

        if win_x >= monitor_position.x
            && win_y >= monitor_position.y
            && win_right <= monitor_position.x + monitor_size.width as i32
            && win_bottom <= monitor_position.y + monitor_size.height as i32
        {
            in_bounds = true;
            break;
        }
    }

    if in_bounds {
        return position;
    }

    if let Some(primary) = webview.primary_monitor().unwrap_or_default() {
        let mon_pos = primary.position();

        let new_x = mon_pos.x + 30 as i32;
        let new_y = mon_pos.y + 30 as i32;

        PhysicalPosition { x: new_x, y: new_y }
    } else {
        PhysicalPosition { x: 30, y: 30 }
    }
}

pub fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> io::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}

fn save_window_state(window: &tauri::WebviewWindow, config_path: String) {
    if let (Ok(position), Ok(size), Ok(scale_factor)) = (
        window.inner_position(),
        window.inner_size(),
        window.scale_factor(),
    ) {
        // Try to read the existing config file
        let config_content = match fs::read_to_string(&config_path) {
            Ok(content) => content,
            Err(_) => String::from("{}"),
        };

        // Parse the existing JSON
        let mut config: Value = match serde_json::from_str(&config_content) {
            Ok(json) => json,
            Err(_) => json!({}),
        };
        let widget_type = config
            .get("widgetType")
            .and_then(Value::as_str)
            .unwrap_or("json")
            .to_string();

        // Update only the window position and size fields
        if let Value::Object(ref mut map) = config {
            map.insert(
                String::from("position"),
                json!({
                    "x": position.x,
                    "y": position.y
                }),
            );
            let is_json = widget_type == "json";
            let logical_size = size.to_logical::<u32>(scale_factor);

            map.insert(
                String::from("dimensions"),
                json!({
                    "width": if is_json { logical_size.width } else { size.width },
                    "height": if is_json { logical_size.height } else { size.height }
                }),
            );
        }

        // Write the updated JSON back to the file
        if let Ok(json_string) = serde_json::to_string_pretty(&config) {
            let _ = fs::write(&config_path, json_string);
        }
    }
}

pub fn attach_window_events(new_window: tauri::WebviewWindow, clean_path: String) {
    let debounce_state = std::sync::Arc::new(Mutex::new(None::<Instant>));
    new_window.clone().on_window_event(move |event| {
        match event {
            tauri::WindowEvent::Moved(_) | tauri::WindowEvent::Resized(_) => {
                let window_clone = new_window.clone();
                let path = clean_path.clone();
                let debounce = debounce_state.clone();
                *debounce.lock().unwrap() = Some(Instant::now());
                tauri::async_runtime::spawn(async move {
                    // Wait for debounce period
                    sleep(Duration::from_millis(500)).await;

                    // Check if we should still save
                    let should_save = {
                        let mut state = debounce.lock().unwrap();
                        if let Some(last_update) = *state {
                            if last_update.elapsed() >= Duration::from_millis(500) {
                                // Reset the state
                                *state = None;
                                true
                            } else {
                                false
                            }
                        } else {
                            false
                        }
                    };

                    if should_save {
                        save_window_state(&window_clone, path);
                    }
                });
                // hack to keep widget unminimized
                if new_window.is_minimized().unwrap() {
                    new_window.unminimize().unwrap();
                }
            }
            _ => {}
        };
    });
}

pub fn compare_if_no_thumb(bytes: &[u8]) -> bool {
    let url_img = image::load_from_memory(&bytes).unwrap();
    let (w, h) = url_img.dimensions();
    if w != 16 && h != 16 {
        return false;
    }
    let no_img = image::load_from_memory(NO_THUMB_BYTES).unwrap();
    let mut diff = 0.0;

    for y in 0..16 {
        for x in 0..16 {
            let p1 = url_img.get_pixel(x, y);
            let p2 = no_img.get_pixel(x, y);

            diff += (p1[0] as f64 - p2[0] as f64).abs();
        }
    }
    diff = diff / (w * h) as f64;
    diff < 5.0
}

fn generate_webp_preview(src: &str, dst: &Path) -> Result<(), String> {
    use image::ImageReader;

    let file = std::fs::File::open(src).map_err(|e| e.to_string())?;
    let reader = ImageReader::new(std::io::BufReader::new(file))
        .with_guessed_format()
        .map_err(|e| e.to_string())?;

    let img = reader.decode().map_err(|e| e.to_string())?;

    let (w, h) = img.dimensions();

    let max_width = 2560;

    let resized = if w > max_width {
        let ratio = h as f32 / w as f32;
        let new_h = (max_width as f32 * ratio) as u32;

        img.resize(max_width, new_h, image::imageops::FilterType::Triangle)
    } else {
        img
    };

    let rgba = resized.to_rgba8();
    let encoder = webp::Encoder::from_rgba(&rgba, rgba.width(), rgba.height());
    let webp = encoder.encode(70.0);

    fs::write(dst, &*webp).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn get_wallpaper_preview(app: &tauri::AppHandle) -> Result<String, String> {
    let wallpaper_path = wallpaper::get().map_err(|e| e.to_string())?;
    let cache_dir = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    let cached_file = cache_dir.join("wallpaper.webp");
    let should_regenerate = match fs::metadata(&cached_file) {
        Ok(meta) => {
            if let Ok(modified) = meta.modified() {
                SystemTime::now()
                    .duration_since(modified)
                    .unwrap_or(Duration::from_secs(0))
                    > Duration::from_secs(60 * 60 * 24)
            } else {
                true
            }
        }
        Err(_) => true,
    };
    if should_regenerate {
        generate_webp_preview(&wallpaper_path, &cached_file)?;
    }

    Ok(cached_file.to_string_lossy().to_string())
}

pub fn get_encoded_app_id(app_id: &String) -> String {
    BASE64_STANDARD.encode(app_id.as_bytes())
}

pub fn get_player_icon_path(app: &tauri::AppHandle, encoded_app_id: &String) -> PathBuf {
    let cache_dir = app.path().app_cache_dir().unwrap().join("media-thumbs");
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir).unwrap();
    }
    cache_dir.join(format!("{}.png", encoded_app_id))
}

pub fn get_player_name_path(app: &tauri::AppHandle, encoded_app_id: &String) -> PathBuf {
    let cache_dir = app.path().app_cache_dir().unwrap().join("media-thumbs");
    if !cache_dir.exists() {
        fs::create_dir_all(&cache_dir).unwrap();
    }
    cache_dir.join(format!("{}.txt", encoded_app_id))
}

pub fn read_cached_app_name(app: &tauri::AppHandle, encoded_app_id: &String) -> Option<String> {
    let path = get_player_name_path(app, encoded_app_id);
    fs::read_to_string(path).ok().filter(|s| !s.is_empty())
}

pub fn get_app_icon(
    app: &tauri::AppHandle,
    app_id: &String,
    app_info: &AppDisplayInfo,
) -> Result<String, Error> {
    let buffer = Buffer::Create(5_000_000)?;
    let _ = app_info
        .GetLogo(Size {
            Height: 50.0,
            Width: 50.0,
        })?
        .OpenReadAsync()?
        .get()?
        .ReadAsync(&buffer, buffer.Capacity()?, InputStreamOptions::ReadAhead)?
        .get()?;
    let reader = DataReader::FromBuffer(&buffer)?;
    let mut bytes = vec![0; buffer.Length()? as usize];
    reader.ReadBytes(&mut bytes)?;

    let encoded_app_id = get_encoded_app_id(app_id);
    let icon_path = get_player_icon_path(app, &encoded_app_id);
    fs::write(&icon_path, &bytes)
        .map_err(|e| Error::new(windows::core::HRESULT(1), e.to_string()))?;

    Ok(icon_path.to_string_lossy().to_string())
}

pub fn get_exe_display_name(exe_path: &Path) -> Option<String> {
    let path_wide: Vec<u16> = exe_path
        .as_os_str()
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let size = unsafe { GetFileVersionInfoSizeW(PCWSTR(path_wide.as_ptr()), None) };
    if size == 0 {
        return None;
    }

    let mut buffer = vec![0u8; size as usize];
    unsafe {
        GetFileVersionInfoW(
            PCWSTR(path_wide.as_ptr()),
            Some(0),
            size,
            buffer.as_mut_ptr() as _,
        )
        .ok()?
    };

    // Try FileDescription first, fall back to ProductName
    for key in [
        r"\StringFileInfo\040904B0\FileDescription",
        r"\StringFileInfo\040904B0\ProductName",
    ] {
        let key_wide: Vec<u16> = key.encode_utf16().chain(std::iter::once(0)).collect();
        let mut ptr = std::ptr::null_mut();
        let mut len = 0u32;

        let ok = unsafe {
            VerQueryValueW(
                buffer.as_ptr() as _,
                PCWSTR(key_wide.as_ptr()),
                &mut ptr,
                &mut len,
            )
        };

        if ok.as_bool() && len > 0 {
            let slice =
                unsafe { std::slice::from_raw_parts(ptr as *const u16, (len - 1) as usize) };
            let name = String::from_utf16_lossy(slice);
            if !name.is_empty() {
                return Some(name);
            }
        }
    }

    None
}

pub fn get_win32_icon(app: &tauri::AppHandle, app_id: &String) -> Result<(String, String), String> {
    let state = SysInfoState::default();
    let mut sysinfo = state.sysinfo.lock().unwrap();
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    sysinfo.refresh_processes();

    let processes = sysinfo.sys.processes();

    let mut ps: Option<_> = None;
    let mut app_name = String::new();
    for (_, p) in processes {
        if let Some(exe) = p.exe() {
            let n = exe
                .file_prefix()
                .get_or_insert_default()
                .to_string_lossy()
                .to_lowercase();
            if n.ends_with(&app_id.to_lowercase()) {
                ps = Some(p);
                app_name = get_exe_display_name(exe).unwrap_or_default();
                break;
            }
        }
    }

    let mut icon_path = PathBuf::new();

    if let Some(p) = ps {
        let encoded_app_id = get_encoded_app_id(app_id);
        match get_icon_by_path(p.exe().expect("will be here")) {
            Ok(i) => {
                icon_path = get_player_icon_path(app, &encoded_app_id);
                i.save(&icon_path).map_err(|e| e.to_string())?;
            }
            Err(e) => {
                eprintln!("{e}");
            }
        }

        let name_path = get_player_name_path(app, &encoded_app_id);
        fs::write(&name_path, &app_name).map_err(|e| e.to_string())?;
    }

    Ok((
        icon_path.to_string_lossy().to_string(),
        app_name.to_string(),
    ))
}
