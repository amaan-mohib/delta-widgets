use serde::{ser::Serializer, Serialize};
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
    time::Duration,
};
use tauri::{AppHandle, Emitter, State};
use tokio::{
    sync::Mutex,
    task::{JoinError, JoinSet},
    time,
};
use windows::{
    core::{Error, HSTRING},
    Foundation::{Size, TypedEventHandler},
    Media::Control::{
        CurrentSessionChangedEventArgs, GlobalSystemMediaTransportControlsSession as MediaSession,
        GlobalSystemMediaTransportControlsSessionManager as MediaSessionManager,
        GlobalSystemMediaTransportControlsSessionPlaybackStatus as SessionPlaybackStatus,
        GlobalSystemMediaTransportControlsSessionTimelineProperties as SessionTimelineProperties,
        MediaPropertiesChangedEventArgs, PlaybackInfoChangedEventArgs, SessionsChangedEventArgs,
        TimelinePropertiesChangedEventArgs,
    },
    Storage::Streams::{Buffer, DataReader, InputStreamOptions},
    System::AppDiagnosticInfo,
};

#[derive(serde::Serialize, Debug)]
pub struct MediaTimelineProperties {
    start_time: u128,
    end_time: u128,
    position: u128,
}
#[derive(serde::Serialize, Debug)]
pub struct MediaPlaybackControls {
    play_enabled: bool,
    pause_enabled: bool,
    stop_enabled: bool,
    next_enabled: bool,
    prev_enabled: bool,
    toggle_enabled: bool,
    shuffle_enabled: bool,
    repeat_enabled: bool,
}
#[derive(serde::Serialize, Debug)]
pub struct MediaPlayerInfo {
    name: String,
    icon: Vec<u8>,
}
#[derive(serde::Serialize, Debug)]
pub struct MediaPlaybackInfo {
    controls: MediaPlaybackControls,
    status: String,
    is_shuffle: bool,
}
#[derive(serde::Serialize, Debug)]
pub struct MediaInfo {
    title: String,
    artist: String,
    thumbnail: Vec<u8>,
    playback_info: Option<MediaPlaybackInfo>,
    player: Option<MediaPlayerInfo>,
    player_id: String,
    timeline_properties: Option<MediaTimelineProperties>,
    is_current_session: bool,
}

// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
pub enum CommandError {
    #[error(transparent)]
    WinError(#[from] Error),

    #[error(transparent)]
    Tokio(#[from] JoinError),

    #[error(transparent)]
    Io(#[from] std::io::Error),
}

// we must manually implement serde::Serialize
impl Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type CommandResult<T, E = CommandError> = anyhow::Result<T, E>;

const DEBOUNCE_MS: u64 = 300;

#[derive(Clone)]
struct DebouncedEmitter {
    cooling_down: Arc<std::sync::Mutex<bool>>,
}

impl DebouncedEmitter {
    fn new() -> Self {
        Self {
            cooling_down: Arc::new(std::sync::Mutex::new(false)),
        }
    }

    fn emit(&self, app: AppHandle, event: &'static str) {
        let mut guard = self.cooling_down.lock().expect("debounce mutex poisoned");
        if *guard {
            return;
        }

        *guard = true;

        let _ = app.emit(event, ());

        let cooling_down = Arc::clone(&self.cooling_down);

        tauri::async_runtime::spawn(async move {
            time::sleep(Duration::from_millis(DEBOUNCE_MS)).await;

            if let Ok(mut guard) = cooling_down.lock() {
                *guard = false;
            }
        });
    }
}

fn get_playback_status(&status: &SessionPlaybackStatus) -> String {
    match status {
        SessionPlaybackStatus::Playing => "playing".to_string(),
        SessionPlaybackStatus::Paused => "paused".to_string(),
        SessionPlaybackStatus::Stopped => "stopped".to_string(),
        SessionPlaybackStatus::Changing => "changing".to_string(),
        SessionPlaybackStatus::Opened => "opened".to_string(),
        _ => "unknown".to_string(),
    }
}

fn get_app_name_from_id(app_id: String) -> Result<MediaPlayerInfo, Error> {
    let hstring_app_id = HSTRING::from(app_id);
    let info_iterator = AppDiagnosticInfo::RequestInfoForAppUserModelId(&hstring_app_id)?
        .get()?
        .into_iter();

    let app_info = info_iterator.Current()?.AppInfo()?.DisplayInfo()?;
    let buffer = Buffer::Create(5_000_000)?;
    let _icon = app_info
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

    Ok(MediaPlayerInfo {
        name: app_info.DisplayName()?.to_string_lossy(),
        icon: bytes,
    })
}

fn get_timeline_properties(
    timeline_properties: &SessionTimelineProperties,
) -> Result<MediaTimelineProperties, Error> {
    fn get_duration(hns: i64) -> u128 {
        Duration::from_nanos((hns * 100).try_into().unwrap()).as_millis()
    }
    Ok(MediaTimelineProperties {
        start_time: get_duration(timeline_properties.StartTime()?.Duration),
        end_time: get_duration(timeline_properties.EndTime()?.Duration),
        position: get_duration(timeline_properties.Position()?.Duration),
    })
}

struct EventStore {
    playback_token: i64,
    metadata_token: i64,
    timeline_token: i64,
}
struct SessionStore {
    session: MediaSession,
    event_tokens: EventStore,
}

struct ListenerState {
    manager: MediaSessionManager,
    sessions_changed_token: i64,
    current_session_changed_token: i64,
    sessions: Arc<std::sync::Mutex<HashMap<String, SessionStore>>>,
}

impl ListenerState {
    fn detach_all(self) {
        let _ = self
            .manager
            .RemoveSessionsChanged(self.sessions_changed_token);
        let _ = self
            .manager
            .RemoveCurrentSessionChanged(self.current_session_changed_token);

        let mut sessions = self.sessions.lock().unwrap();
        for (id, entry) in sessions.drain() {
            let _ = entry
                .session
                .RemoveMediaPropertiesChanged(entry.event_tokens.metadata_token);
            let _ = entry
                .session
                .RemovePlaybackInfoChanged(entry.event_tokens.playback_token);
            let _ = entry
                .session
                .RemoveTimelinePropertiesChanged(entry.event_tokens.timeline_token);
            println!("detached listeners for {}", id);
        }
    }
}

pub struct MediaState {
    listener: Option<ListenerState>,
    session_manager: Option<MediaSessionManager>,
    is_listening: bool,
}

impl MediaState {
    pub fn new() -> Self {
        Self {
            listener: None,
            session_manager: None,
            is_listening: false,
        }
    }
}

fn get_or_init_manager(state: &mut MediaState) -> Result<MediaSessionManager, Error> {
    if let Some(m) = state.session_manager.as_ref() {
        return Ok(m.clone());
    }
    let m = MediaSessionManager::RequestAsync()?.get()?;
    state.session_manager = Some(m.clone());
    Ok(m)
}

fn attach_session_listeners(
    sessions: &mut HashMap<String, SessionStore>,
    player_id: &str,
    session: MediaSession,
    app: AppHandle,
    emitter: &DebouncedEmitter,
) -> Result<(), Error> {
    if sessions.contains_key(player_id) {
        return Ok(());
    }

    let e = emitter.clone();
    let a = app.clone();
    let metadata_token = session.MediaPropertiesChanged(&TypedEventHandler::<
        MediaSession,
        MediaPropertiesChangedEventArgs,
    >::new(move |_, _| {
        println!("metadata changed");
        e.emit(a.clone(), "media_updated");
        Ok(())
    }))?;

    let e = emitter.clone();
    let a = app.clone();
    let playback_token = session.PlaybackInfoChanged(&TypedEventHandler::<
        MediaSession,
        PlaybackInfoChangedEventArgs,
    >::new(move |_, _| {
        println!("playback changed");
        e.emit(a.clone(), "media_updated");
        Ok(())
    }))?;

    let e = emitter.clone();
    let a = app.clone();
    let timeline_token = session.TimelinePropertiesChanged(&TypedEventHandler::<
        MediaSession,
        TimelinePropertiesChangedEventArgs,
    >::new(move |_, _| {
        e.emit(a.clone(), "media_updated");
        Ok(())
    }))?;

    sessions.insert(
        player_id.to_string(),
        SessionStore {
            session,
            event_tokens: EventStore {
                metadata_token,
                playback_token,
                timeline_token,
            },
        },
    );

    println!("attached listeners for {}", player_id);
    Ok(())
}

fn sync_session_listeners(
    manager: &MediaSessionManager,
    app: AppHandle,
    emitter: &DebouncedEmitter,
    sessions: &mut HashMap<String, SessionStore>,
) {
    let Ok(raw_sessions) = manager.GetSessions() else {
        return;
    };

    let active_ids: HashSet<String> = raw_sessions
        .into_iter()
        .filter_map(|session| {
            let player_id = session
                .SourceAppUserModelId()
                .map(|h| h.to_string())
                .unwrap_or_else(|_| "Unknown".to_string());
            attach_session_listeners(sessions, &player_id, session, app.clone(), emitter).ok()?;
            Some(player_id)
        })
        .collect();

    let stale: Vec<String> = sessions
        .keys()
        .filter(|id| !active_ids.contains(*id))
        .cloned()
        .collect();

    for id in stale {
        if let Some(entry) = sessions.remove(&id) {
            let _ = entry
                .session
                .RemoveMediaPropertiesChanged(entry.event_tokens.metadata_token);
            let _ = entry
                .session
                .RemovePlaybackInfoChanged(entry.event_tokens.playback_token);
            let _ = entry
                .session
                .RemoveTimelinePropertiesChanged(entry.event_tokens.timeline_token);
            println!("detached stale listeners for {}", id);
        }
    }
}

fn build_listener_state(
    manager: MediaSessionManager,
    app: AppHandle,
    emitter: DebouncedEmitter,
) -> Result<ListenerState, Error> {
    let sessions = Arc::new(std::sync::Mutex::new(HashMap::new()));

    let e = emitter.clone();
    let a = app.clone();
    let app_for_sync = app.clone();
    let sessions_for_closure = Arc::clone(&sessions);
    let emitter_for_sync = emitter.clone();

    let sessions_changed_token = manager.SessionsChanged(&TypedEventHandler::<
        MediaSessionManager,
        SessionsChangedEventArgs,
    >::new(move |mgr, _| {
        println!("sessions changed");
        e.emit(a.clone(), "media_updated");
        if let Some(mgr) = mgr {
            let mut map = sessions_for_closure.lock().unwrap();
            sync_session_listeners(mgr, app_for_sync.clone(), &emitter_for_sync, &mut map);
        }
        Ok(())
    }))?;

    let e = emitter.clone();
    let a = app.clone();
    let current_session_changed_token =
        manager.CurrentSessionChanged(&TypedEventHandler::<
            MediaSessionManager,
            CurrentSessionChangedEventArgs,
        >::new(move |_, _| {
            println!("current session changed");
            e.emit(a.clone(), "media_updated");
            Ok(())
        }))?;

    // Attach listeners for already-active sessions.
    {
        let mut map = sessions.lock().unwrap();
        for session in manager.GetSessions()?.into_iter() {
            let player_id = session
                .SourceAppUserModelId()
                .map(|h| h.to_string())
                .unwrap_or_else(|_| "Unknown".to_string());
            let _ = attach_session_listeners(&mut map, &player_id, session, app.clone(), &emitter);
        }
    }

    Ok(ListenerState {
        manager,
        sessions_changed_token,
        current_session_changed_token,
        sessions,
    })
}

fn build_media_info(
    session: &MediaSession,
    player_id: String,
    is_current_session: bool,
) -> Result<MediaInfo, Error> {
    let props = session.TryGetMediaPropertiesAsync()?.get()?;
    let playback_info = session.GetPlaybackInfo()?;
    let timeline_data = session.GetTimelineProperties()?;

    let title = props.Title()?.to_string();
    let artist = props.Artist()?.to_string();
    let thumbnail = props.Thumbnail();
    // println!("{} - {}", title, artist);

    let playback = playback_info
        .Controls()
        .ok()
        .map(|controls| MediaPlaybackInfo {
            controls: MediaPlaybackControls {
                play_enabled: controls.IsPlayEnabled().unwrap_or(false),
                pause_enabled: controls.IsPauseEnabled().unwrap_or(false),
                stop_enabled: controls.IsStopEnabled().unwrap_or(false),
                next_enabled: controls.IsNextEnabled().unwrap_or(false),
                prev_enabled: controls.IsPreviousEnabled().unwrap_or(false),
                toggle_enabled: controls.IsPlayPauseToggleEnabled().unwrap_or(false),
                shuffle_enabled: controls.IsShuffleEnabled().unwrap_or(false),
                repeat_enabled: controls.IsRepeatEnabled().unwrap_or(false),
            },
            status: playback_info
                .PlaybackStatus()
                .map(|s| get_playback_status(&s))
                .unwrap_or_else(|_| "unknown".to_string()),
            is_shuffle: playback_info
                .IsShuffleActive()
                .ok()
                .and_then(|v| v.Value().ok())
                .unwrap_or(false),
        });

    let thumbnail_bytes: Vec<u8> = match thumbnail {
        Ok(t) => {
            let buffer = Buffer::Create(5_000_000)?;
            let _thumbnail_buffer = t
                .OpenReadAsync()?
                .get()?
                .ReadAsync(&buffer, buffer.Capacity()?, InputStreamOptions::ReadAhead)?
                .get()?;

            let reader = DataReader::FromBuffer(&buffer)?;
            let mut bytes = vec![0; buffer.Length()? as usize];
            reader.ReadBytes(&mut bytes)?;

            bytes
        }
        Err(_) => {
            vec![]
        }
    };
    let player = Some(match get_app_name_from_id(player_id.clone()) {
        Ok(p) => p,
        Err(_e) => {
            // println!("player info error for {}: {}", player_id, e);
            MediaPlayerInfo {
                name: String::new(),
                icon: vec![],
            }
        }
    });

    Ok(MediaInfo {
        title,
        artist,
        thumbnail: thumbnail_bytes,
        playback_info: playback,
        player,
        player_id,
        timeline_properties: get_timeline_properties(&timeline_data).ok(),
        is_current_session,
    })
}

#[tauri::command]
pub async fn start_media_listener(
    app: AppHandle,
    media_state: State<'_, Mutex<MediaState>>,
) -> CommandResult<()> {
    let mut state = media_state.lock().await;

    if state.is_listening {
        println!("media listener already running");
        return Ok(());
    }

    let manager = get_or_init_manager(&mut state)?;
    let emitter = DebouncedEmitter::new();
    let listener = build_listener_state(manager, app.clone(), emitter)?;

    state.listener = Some(listener);
    state.is_listening = true;

    drop(state);
    println!("media listener started");

    Ok(())
}

#[tauri::command]
pub async fn stop_media_listener(media_state: State<'_, Mutex<MediaState>>) -> CommandResult<()> {
    let mut state = media_state.lock().await;

    if !state.is_listening {
        println!("media listener was not running");
        return Ok(());
    }

    if let Some(listener) = state.listener.take() {
        listener.detach_all();
    }

    state.session_manager = None;
    state.is_listening = false;

    drop(state);
    println!("media listener stopped");

    Ok(())
}

fn get_current_player_id(manager: &MediaSessionManager) -> String {
    manager
        .GetCurrentSession()
        .and_then(|s| s.SourceAppUserModelId())
        .map(|h| h.to_string())
        .unwrap_or_default()
}

#[tauri::command]
pub async fn get_media(media_state: State<'_, Mutex<MediaState>>) -> CommandResult<Vec<MediaInfo>> {
    let mut state = media_state.lock().await;
    let sessions: Vec<(MediaSession, String, bool)> = if let Some(listener) = &state.listener {
        let current_id = get_current_player_id(&listener.manager);
        listener
            .sessions
            .lock()
            .unwrap()
            .iter()
            .map(|(id, store)| (store.session.clone(), id.clone(), id == &current_id))
            .collect()
    } else {
        let manager = get_or_init_manager(&mut state)?;
        let raw_sessions: Vec<MediaSession> = manager.GetSessions()?.into_iter().collect();
        let current_id = get_current_player_id(&manager);
        raw_sessions
            .iter()
            .map(|session| {
                let player_id = session
                    .SourceAppUserModelId()
                    .map(|h| h.to_string())
                    .unwrap_or_else(|_| "Unknown".to_string());
                (session.clone(), player_id.clone(), player_id == current_id)
            })
            .collect()
    };
    drop(state);

    let mut join_set = JoinSet::new();
    for (session, player_id, is_current) in sessions {
        join_set.spawn_blocking(move || build_media_info(&session, player_id, is_current));
    }

    let mut players: Vec<MediaInfo> = Vec::with_capacity(join_set.len());
    while let Some(result) = join_set.join_next().await {
        if let Ok(Ok(info)) = result {
            players.push(info);
        }
    }

    players.sort_by_key(|p| !p.is_current_session);

    Ok(players)
}

#[tauri::command]
pub async fn media_action(
    media_state: State<'_, Mutex<MediaState>>,
    player_id: String,
    action: String,
    position: Option<u64>,
) -> CommandResult<()> {
    // Fast path: grab cached session from listener map.
    let session: Option<MediaSession> = {
        let state = media_state.lock().await;
        state.listener.as_ref().and_then(|l| {
            l.sessions
                .lock()
                .unwrap()
                .get(&player_id)
                .map(|e| e.session.clone())
        })
    };

    // Fallback: live lookup if listener isn't running.
    let session = match session {
        Some(s) => s,
        None => {
            let mut state = media_state.lock().await;
            let manager = get_or_init_manager(&mut state)?;
            manager
                .GetSessions()?
                .into_iter()
                .find(|s| {
                    s.SourceAppUserModelId()
                        .map(|h| h.to_string())
                        .unwrap_or_default()
                        == player_id
                })
                .ok_or_else(|| {
                    CommandError::Io(std::io::Error::new(
                        std::io::ErrorKind::NotFound,
                        format!("no session found for player_id: {}", player_id),
                    ))
                })?
        }
    };

    tokio::task::spawn_blocking(move || -> Result<(), Error> {
        match action.as_str() {
            "play" => {
                session.TryPlayAsync()?.get()?;
                println!("played for {}", player_id);
            }
            "pause" => {
                session.TryPauseAsync()?.get()?;
                println!("paused for {}", player_id);
            }
            "toggle" => {
                session.TryTogglePlayPauseAsync()?.get()?;
                println!("toggled for {}", player_id);
            }
            "next" => {
                session.TrySkipNextAsync()?.get()?;
                println!("next for {}", player_id);
            }
            "prev" => {
                session.TrySkipPreviousAsync()?.get()?;
                println!("previous for {}", player_id);
            }
            "position" => {
                if let Some(ms) = position {
                    let hns = (Duration::from_millis(ms).as_nanos() / 100) as i64;
                    session.TryChangePlaybackPositionAsync(hns)?.get()?;
                    println!("position updated for {}", player_id);
                }
            }
            other => println!("unknown action: {}", other),
        }
        Ok(())
    })
    .await??;

    Ok(())
}
