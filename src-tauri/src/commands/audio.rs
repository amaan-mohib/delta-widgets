use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use std::collections::HashSet;
use std::fmt;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};

const CHUNK_SIZE: usize = 256;
const DEVICE_CHECK_INTERVAL: Duration = Duration::from_secs(1); // Check every 1 second

/// Holds the audio stream and related state
pub struct AudioState {
    stream: Option<cpal::Stream>,
    last_device_id: String,
    is_running: bool,
    pub listening_windows: HashSet<String>,
}

impl fmt::Debug for AudioState {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> Result<(), fmt::Error> {
        #[allow(unused)]
        #[derive(Debug)]
        struct AudioState<'a> {
            last_device_id: &'a String,
            is_running: &'a bool,
            listening_windows: &'a HashSet<String>,
        }

        let Self {
            last_device_id,
            is_running,
            listening_windows,
            stream: _,
        } = self;

        fmt::Debug::fmt(
            &AudioState {
                last_device_id,
                is_running,
                listening_windows,
            },
            f,
        )
    }
}

impl AudioState {
    pub fn new() -> Self {
        Self {
            stream: None,
            last_device_id: String::new(),
            is_running: false,
            listening_windows: HashSet::new(),
        }
    }
}

/// Start audio capture and monitor for device changes
pub fn start_capture(
    app: AppHandle,
    window: &tauri::WebviewWindow,
    audio_state: &State<Mutex<AudioState>>,
) {
    let mut state = audio_state.lock().unwrap();
    state.listening_windows.insert(window.label().to_string());

    if state.is_running {
        println!("Audio capture already running");
        return;
    }

    state.is_running = true;
    drop(state); // Release lock before spawning thread

    let app_clone = app.clone();

    // Start initial capture immediately
    let host = cpal::default_host();
    if let Some(device) = host.default_output_device() {
        let device_name = device.id().map(|id| id.to_string()).unwrap_or_default();

        {
            let mut state = audio_state.lock().unwrap();
            state.last_device_id = device_name;
        }

        if let Err(e) = build_and_start_stream(app.clone(), &device) {
            eprintln!("Failed to start capture: {}", e);
            let mut state = audio_state.lock().unwrap();
            state.is_running = false;
            return;
        }
    }

    // Spawn device monitoring in background thread
    tauri::async_runtime::spawn(async move {
        loop {
            let audio_state_clone = app_clone.state::<Mutex<AudioState>>();
            {
                let state = audio_state_clone.lock().unwrap();
                if !state.is_running {
                    break;
                }
            }

            let host = cpal::default_host();

            if let Some(device) = host.default_output_device() {
                let device_name = device.id().map(|id| id.to_string()).unwrap_or_default();

                let should_restart = {
                    let mut state = audio_state_clone.lock().unwrap();
                    if state.last_device_id != device_name {
                        println!(
                            "Device changed from '{}' to '{}'",
                            state.last_device_id, device_name
                        );
                        state.last_device_id = device_name.clone();
                        true
                    } else {
                        false
                    }
                };

                if should_restart {
                    // Stop the current stream
                    {
                        let mut state = audio_state_clone.lock().unwrap();
                        state.stream = None;
                    }

                    // Build new stream with the new device
                    if let Err(e) = build_and_start_stream(app.clone(), &device) {
                        eprintln!("Failed to rebuild stream: {}", e);
                    }
                }
            }

            tokio::time::sleep(DEVICE_CHECK_INTERVAL).await;
        }

        println!("Audio capture stopped");
    });
}

fn build_and_start_stream(app: AppHandle, device: &cpal::Device) -> Result<(), String> {
    let config = device
        .default_output_config()
        .map_err(|e| format!("Failed to get output config: {}", e))?;

    println!(
        "Using output device: {}",
        device
            .description()
            .map(|id| id.to_string())
            .unwrap_or_default()
    );
    println!("Default output config: {:?}", config);

    let sample_format = config.sample_format();
    let config: cpal::StreamConfig = config.into();

    let stream = match sample_format {
        cpal::SampleFormat::F32 => {
            build_stream::<f32>(app.clone(), device, &config, "Failed to build F32 stream")?
        }
        cpal::SampleFormat::I16 => {
            build_stream::<i16>(app.clone(), device, &config, "Failed to build I16 stream")?
        }
        cpal::SampleFormat::U16 => {
            build_stream::<u16>(app.clone(), device, &config, "Failed to build U16 stream")?
        }
        _ => return Err(format!("Unsupported sample format: {:?}", sample_format)),
    };

    stream
        .play()
        .map_err(|e| format!("Failed to start stream: {}", e))?;

    // Store the stream in state
    {
        let audio_state = app.state::<Mutex<AudioState>>();
        let mut state = audio_state.lock().unwrap();
        state.stream = Some(stream);
    }

    println!("Audio capture started successfully");
    Ok(())
}

/// Stop audio capture
pub fn stop_capture(label: &String, audio_state: &State<Mutex<AudioState>>) {
    let mut state = audio_state.lock().unwrap();
    state.is_running = false;
    state.stream = None;
    state.listening_windows.remove(label);
    println!("Audio capture stopped");
}

/// Restart audio capture (useful when device changes or for manual restart)
pub fn restart_capture(
    app: AppHandle,
    window: &tauri::WebviewWindow,
    audio_state: State<Mutex<AudioState>>,
) {
    stop_capture(&window.label().to_string(), &audio_state);
    std::thread::sleep(Duration::from_millis(100)); // Brief delay
    start_capture(app, window, &audio_state);
}

pub fn get_current_device() -> Result<String, String> {
    let host = cpal::default_host();
    let device = host
        .default_output_device()
        .ok_or_else(|| "No output device available".to_string())?;

    device
        .id()
        .map(|id| id.to_string())
        .map_err(|e| format!("Failed to get device ID: {}", e))
}

fn downsample(samples: &[f32], target: usize) -> Vec<f32> {
    let len = samples.len();
    if len <= target {
        return samples.to_vec();
    }
    (0..target)
        .map(|i| {
            let start = i * len / target;
            let end = ((i + 1) * len / target).min(len);
            let chunk = &samples[start..end];
            let rms = (chunk.iter().map(|s| s * s).sum::<f32>() / chunk.len() as f32).sqrt();
            // preserve sign using the mean's sign
            let mean: f32 = chunk.iter().sum::<f32>() / chunk.len() as f32;
            if mean >= 0.0 {
                rms
            } else {
                -rms
            }
        })
        .collect()
}

fn emit_samples(app: &AppHandle, samples: &[f32], last_emit: &Arc<Mutex<tokio::time::Instant>>) {
    let interval = std::time::Duration::from_millis(33);

    let should_emit = {
        let mut last = last_emit.lock().unwrap();
        if last.elapsed() >= interval {
            *last = tokio::time::Instant::now();
            true
        } else {
            false
        }
    };

    if !should_emit {
        return;
    }

    if let Err(e) = app.emit("audio-samples", downsample(&samples, CHUNK_SIZE)) {
        eprintln!("Failed to emit audio samples: {}", e);
    }
}

fn build_stream<T>(
    app: AppHandle,
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    error_msg: &str,
) -> Result<cpal::Stream, String>
where
    T: cpal::Sample<Float = f32> + cpal::SizedSample + Send + 'static,
{
    let channels = config.channels as usize;
    let last_emit = Arc::new(Mutex::new(tokio::time::Instant::now()));

    device
        .build_input_stream(
            config,
            move |data: &[T], _: &cpal::InputCallbackInfo| {
                let samples: Vec<f32> = if channels == 1 {
                    data.iter().map(|s| s.to_float_sample()).collect()
                } else {
                    data.chunks(channels)
                        .map(|frame| {
                            let sum: f32 = frame.iter().map(|s| s.to_float_sample()).sum();
                            sum / channels as f32
                        })
                        .collect()
                };

                emit_samples(&app, &samples, &last_emit);
            },
            |err| eprintln!("Audio stream error: {}", err),
            None,
        )
        .map_err(|e| format!("{}: {}", error_msg, e))
}

#[tauri::command]
pub fn start_audio_capture(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    audio_state: State<Mutex<AudioState>>,
) {
    start_capture(app, &window, &audio_state);
}

#[tauri::command]
pub fn stop_audio_capture(window: tauri::WebviewWindow, audio_state: State<Mutex<AudioState>>) {
    stop_capture(&window.label().to_string(), &audio_state);
}

#[tauri::command]
pub fn restart_audio_capture(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    audio_state: State<Mutex<AudioState>>,
) {
    restart_capture(app, &window, audio_state);
}

#[tauri::command]
pub fn get_current_device_cmd() -> Result<String, String> {
    get_current_device()
}
