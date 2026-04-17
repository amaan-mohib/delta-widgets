use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::Sample;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};

const CHUNK_SIZE: usize = 256;
const DEVICE_CHECK_INTERVAL: Duration = Duration::from_secs(1); // Check every 1 second

/// Holds the audio stream and related state
pub struct AudioState {
    stream: Option<cpal::Stream>,
    last_device_id: String,
    is_running: bool,
}

impl AudioState {
    pub fn new() -> Self {
        Self {
            stream: None,
            last_device_id: String::new(),
            is_running: false,
        }
    }
}

/// Start audio capture and monitor for device changes
pub fn start_capture(app: AppHandle, audio_state: State<Mutex<AudioState>>) {
    let mut state = audio_state.lock().unwrap();

    // Check if already running
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
    std::thread::spawn(move || {
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

            std::thread::sleep(DEVICE_CHECK_INTERVAL);
        }

        println!("Audio capture stopped");
    });
}

/// Build and start the audio stream
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
        cpal::SampleFormat::F32 => build_stream_f32(device, &config, app.clone())?,
        cpal::SampleFormat::I16 => build_stream_i16(device, &config, app.clone())?,
        cpal::SampleFormat::U16 => build_stream_u16(device, &config, app.clone())?,
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
pub fn stop_capture(audio_state: State<Mutex<AudioState>>) {
    let mut state = audio_state.lock().unwrap();
    state.is_running = false;
    state.stream = None;
    println!("Audio capture stopped");
}

/// Restart audio capture (useful when device changes or for manual restart)
pub fn restart_capture(app: AppHandle, audio_state: State<Mutex<AudioState>>) {
    stop_capture(audio_state.clone());
    std::thread::sleep(Duration::from_millis(100)); // Brief delay
    start_capture(app, audio_state);
}

/// Get current device name
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

fn build_stream_f32(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    app: AppHandle,
) -> Result<cpal::Stream, String> {
    let channels = config.channels as usize;

    device
        .build_input_stream(
            config,
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                let samples: Vec<f32> = if channels == 1 {
                    data.to_vec()
                } else {
                    data.chunks(channels)
                        .map(|frame| frame.iter().sum::<f32>() / channels as f32)
                        .collect()
                };

                for chunk in samples.chunks(CHUNK_SIZE) {
                    if let Err(e) = app.emit("audio-samples", chunk) {
                        eprintln!("Failed to emit audio samples: {}", e);
                    }
                }
            },
            |err| eprintln!("Audio stream error: {}", err),
            None,
        )
        .map_err(|e| format!("Failed to build F32 stream: {}", e))
}

fn build_stream_i16(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    app: AppHandle,
) -> Result<cpal::Stream, String> {
    let channels = config.channels as usize;

    device
        .build_input_stream(
            config,
            move |data: &[i16], _: &cpal::InputCallbackInfo| {
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

                for chunk in samples.chunks(CHUNK_SIZE) {
                    if let Err(e) = app.emit("audio-samples", chunk) {
                        eprintln!("Failed to emit audio samples: {}", e);
                    }
                }
            },
            |err| eprintln!("Audio stream error: {}", err),
            None,
        )
        .map_err(|e| format!("Failed to build I16 stream: {}", e))
}

fn build_stream_u16(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    app: AppHandle,
) -> Result<cpal::Stream, String> {
    let channels = config.channels as usize;

    device
        .build_input_stream(
            config,
            move |data: &[u16], _: &cpal::InputCallbackInfo| {
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

                for chunk in samples.chunks(CHUNK_SIZE) {
                    if let Err(e) = app.emit("audio-samples", chunk) {
                        eprintln!("Failed to emit audio samples: {}", e);
                    }
                }
            },
            |err| eprintln!("Audio stream error: {}", err),
            None,
        )
        .map_err(|e| format!("Failed to build U16 stream: {}", e))
}

#[tauri::command]
pub fn start_audio_capture(app: tauri::AppHandle, audio_state: State<Mutex<AudioState>>) {
    start_capture(app, audio_state);
}

/// Tauri command to stop audio capture
#[tauri::command]
pub fn stop_audio_capture(audio_state: State<Mutex<AudioState>>) {
    stop_capture(audio_state);
}

/// Tauri command to restart audio capture
#[tauri::command]
pub fn restart_audio_capture(app: tauri::AppHandle, audio_state: State<Mutex<AudioState>>) {
    restart_capture(app, audio_state);
}

/// Tauri command to get current device
#[tauri::command]
pub fn get_current_device_cmd() -> Result<String, String> {
    get_current_device()
}
