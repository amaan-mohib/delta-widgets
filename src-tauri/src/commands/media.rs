// use std::{fs::File, io::Write};

use serde::{ser::Serializer, Serialize};
use std::{
    collections::{HashMap, HashSet},
    sync::{Mutex, MutexGuard, OnceLock},
    time::Duration,
};
use tokio::task::{self, JoinError};
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

use crate::emit_global_event;

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

async fn get_app_name_from_id(app_id: String) -> Result<MediaPlayerInfo, Error> {
    let hstring_app_id = HSTRING::from(app_id.clone());
    let info_iterator = AppDiagnosticInfo::RequestInfoForAppUserModelId(&hstring_app_id)?
        .await?
        .into_iter();

    let app_info = info_iterator.Current()?.AppInfo().unwrap().DisplayInfo()?;
    let buffer = Buffer::Create(5_000_000)?;
    let _icon = app_info
        .GetLogo(Size {
            Height: 50.0,
            Width: 50.0,
        })
        .unwrap()
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
) -> Result<MediaTimelineProperties, std::io::Error> {
    fn get_duration(ns: i64) -> u128 {
        Duration::from_nanos(ns.try_into().unwrap()).as_millis()
    }
    Ok(MediaTimelineProperties {
        start_time: get_duration(timeline_properties.StartTime()?.Duration * 100),
        end_time: get_duration(timeline_properties.EndTime()?.Duration * 100),
        position: get_duration(timeline_properties.Position()?.Duration * 100),
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
struct SessionManagerStore {
    session_manager: MediaSessionManager,
    event_tokens: HashMap<String, i64>,
}

fn get_session_store() -> MutexGuard<'static, HashMap<String, SessionStore>> {
    static MAP: OnceLock<Mutex<HashMap<String, SessionStore>>> = OnceLock::new();
    MAP.get_or_init(|| Mutex::new(HashMap::new()))
        .lock()
        .expect("Let's hope the lock isn't poisoned")
}
async fn get_session_manager() -> MutexGuard<'static, SessionManagerStore> {
    static MAP: tokio::sync::OnceCell<Mutex<SessionManagerStore>> =
        tokio::sync::OnceCell::const_new();
    MAP.get_or_init(|| async {
        let session_manager = MediaSessionManager::RequestAsync().unwrap().await.unwrap();
        Mutex::new(SessionManagerStore {
            session_manager,
            event_tokens: HashMap::new(),
        })
    })
    .await
    .lock()
    .expect("Let's hope the lock isn't poisoned")
}

fn attach_session_listeners(player_id: String, session: MediaSession) {
    let mut session_store = get_session_store();
    if session_store.contains_key(&player_id) {
        return;
    }
    let metadata_token = session
        .MediaPropertiesChanged(&TypedEventHandler::<
            MediaSession,
            MediaPropertiesChangedEventArgs,
        >::new(move |_, _| {
            emit_global_event("media_updated");
            println!("Metadata changed");
            Ok(())
        }))
        .unwrap();
    let playback_token = session
        .PlaybackInfoChanged(&TypedEventHandler::<
            MediaSession,
            PlaybackInfoChangedEventArgs,
        >::new(move |_, _| {
            emit_global_event("media_updated");
            println!("Playback changed");
            Ok(())
        }))
        .unwrap();
    let timeline_token = session
        .TimelinePropertiesChanged(&TypedEventHandler::<
            MediaSession,
            TimelinePropertiesChangedEventArgs,
        >::new(move |_, _| {
            emit_global_event("media_updated");
            println!("Timeline changed");
            Ok(())
        }))
        .unwrap();
    session_store.insert(
        player_id.clone(),
        SessionStore {
            session: session.clone(),
            event_tokens: EventStore {
                playback_token,
                metadata_token,
                timeline_token,
            },
        },
    );
    println!("attached listeners for {}", player_id);
}
fn detach_session_listeners(player_id: String) {
    println!("detaching listeners for {}", player_id);
    let mut binding = get_session_store();
    let store = binding.get(&player_id);
    match store {
        Some(store) => {
            println!("got session");
            let event_tokens = &store.event_tokens;
            let session = &store.session;
            session
                .RemoveMediaPropertiesChanged(event_tokens.metadata_token)
                .unwrap();
            session
                .RemovePlaybackInfoChanged(event_tokens.playback_token)
                .unwrap();
            session
                .RemoveTimelinePropertiesChanged(event_tokens.timeline_token)
                .unwrap();
        }
        None => {
            println!("none found")
        }
    }
    binding.remove(&player_id);
    println!("detached listeners for {}", player_id);
}

async fn attach_session_manager_listeners() -> Result<MediaSessionManager, ()> {
    let session_manager = &get_session_manager().await.session_manager;
    let session_token = session_manager
        .SessionsChanged(&TypedEventHandler::<
            MediaSessionManager,
            SessionsChangedEventArgs,
        >::new(move |_, _| {
            emit_global_event("media_updated");
            println!("sessions changed");
            Ok(())
        }))
        .unwrap();
    let current_session_token = session_manager
        .CurrentSessionChanged(&TypedEventHandler::<
            MediaSessionManager,
            CurrentSessionChangedEventArgs,
        >::new(move |_, _| {
            emit_global_event("media_updated");
            println!("current session changed");
            Ok(())
        }))
        .unwrap();
    task::spawn(async move {
        let session_token_key = "session_token".to_string();
        let current_session_token_key = "current_session_token".to_string();
        let old_tokens = get_session_manager().await.event_tokens.clone();
        match old_tokens.get(&session_token_key) {
            Some(key) => {
                get_session_manager()
                    .await
                    .session_manager
                    .RemoveSessionsChanged(*key)
                    .unwrap();
            }
            None => {}
        }
        match old_tokens.get(&current_session_token_key) {
            Some(key) => {
                get_session_manager()
                    .await
                    .session_manager
                    .RemoveCurrentSessionChanged(*key)
                    .unwrap();
            }
            None => {}
        }
        get_session_manager().await.event_tokens.clear();
        get_session_manager()
            .await
            .event_tokens
            .insert(session_token_key, session_token);
        get_session_manager()
            .await
            .event_tokens
            .insert(current_session_token_key, current_session_token);
    });
    Ok(session_manager.clone())
}

#[tauri::command]
pub async fn get_media() -> CommandResult<Vec<MediaInfo>> {
    let session_manager = attach_session_manager_listeners().await.unwrap();
    let sessions = session_manager.GetSessions().unwrap();
    let current_session = session_manager.GetCurrentSession().unwrap();
    let session_iterator = sessions.into_iter().collect::<Vec<MediaSession>>();
    let mut players: Vec<MediaInfo> = vec![];
    let mut tasks = vec![];
    let mut player_ids: HashSet<String> = HashSet::new();

    for session in session_iterator {
        let player_id = match session.SourceAppUserModelId() {
            Ok(id) => id.to_string(),
            Err(_) => "Unkown".to_string(),
        };
        let is_current_session = current_session.SourceAppUserModelId()?.to_string() == player_id;
        attach_session_listeners(player_id.clone(), session.clone());

        let task: task::JoinHandle<Result<MediaInfo, Error>> = task::spawn(async move {
            let info = session.TryGetMediaPropertiesAsync()?.await?;
            let playback_info = session.GetPlaybackInfo()?;
            let timeline_properties_data = session.GetTimelineProperties()?;
            let timeline_properties = get_timeline_properties(&timeline_properties_data);

            let title = info.Title()?;
            let artist = info.Artist()?;
            println!("{}", title);
            println!("{}", artist);
            let thumbnail = info.Thumbnail();
            let playback_controls = playback_info.Controls();

            let mut res = MediaInfo {
                title: title.to_string(),
                artist: artist.to_string(),
                thumbnail: [].to_vec(),
                playback_info: None,
                player: None,
                player_id: player_id.clone().to_string(),
                timeline_properties: None,
                is_current_session,
            };
            match thumbnail {
                Ok(new_thumbnail) => {
                    let buffer = Buffer::Create(5_000_000)?;
                    let _thumbnail_buffer = new_thumbnail
                        .OpenReadAsync()?
                        .get()?
                        .ReadAsync(&buffer, buffer.Capacity()?, InputStreamOptions::ReadAhead)?
                        .get()?;

                    let reader = DataReader::FromBuffer(&buffer)?;
                    let mut bytes = vec![0; buffer.Length()? as usize];
                    reader.ReadBytes(&mut bytes)?;

                    // Write to file
                    // let mut file = File::create("media_thumb.jpg")?;
                    // file.write_all(&bytes)?;

                    res.thumbnail = bytes;
                }
                Err(_) => {}
            }

            match playback_controls {
                Ok(controls) => {
                    res.playback_info = Some(MediaPlaybackInfo {
                        controls: MediaPlaybackControls {
                            play_enabled: controls.IsPlayEnabled()?,
                            pause_enabled: controls.IsPauseEnabled()?,
                            stop_enabled: controls.IsStopEnabled()?,
                            next_enabled: controls.IsNextEnabled()?,
                            prev_enabled: controls.IsPreviousEnabled()?,
                            toggle_enabled: controls.IsPlayPauseToggleEnabled()?,
                            shuffle_enabled: controls.IsShuffleEnabled()?,
                            repeat_enabled: controls.IsRepeatEnabled()?,
                        },
                        status: get_playback_status(&playback_info.PlaybackStatus()?),
                        is_shuffle: match playback_info.IsShuffleActive() {
                            Ok(value) => value.Value()?,
                            Err(_) => false,
                        },
                    })
                }
                Err(_) => {}
            }

            match timeline_properties {
                Ok(properties) => {
                    res.timeline_properties = Some(properties);
                }
                Err(_) => {}
            }

            Ok(res)
        });
        tasks.push(task);
    }
    for task in tasks {
        let mut res = task.await?.unwrap();
        let player_id = res.player_id.clone();
        player_ids.insert(player_id.clone());
        let player_info = tokio::task::spawn(async move {
            let player = get_app_name_from_id(player_id.clone()).await;
            player
        })
        .await
        .unwrap();
        res.player = Some(match player_info {
            Ok(p) => p,
            Err(e) => {
                println!("{}", e);
                MediaPlayerInfo {
                    name: "".to_string(),
                    icon: [].to_vec(),
                }
            }
        });
        players.push(res);
    }
    players.sort_by_key(|k| !k.is_current_session);

    let mut players_to_detach: Vec<String> = vec![];
    for player_id in get_session_store().keys() {
        if !player_ids.contains(player_id) {
            players_to_detach.push(player_id.clone());
        }
    }
    for player_id in players_to_detach {
        println!("player id removing {}", player_id);
        detach_session_listeners(player_id.clone());
    }

    Ok(players)
}

#[tauri::command]
pub async fn media_action(
    player_id: String,
    action: String,
    position: Option<u64>,
) -> CommandResult<()> {
    let session_store = get_session_store();
    let store = session_store.get(&player_id);
    match store {
        Some(store) => {
            let session = store.session.clone();
            tokio::spawn(async move {
                if action == "play".to_string() {
                    match session.TryPlayAsync().unwrap().await {
                        Ok(_) => {
                            println!("played for {}", player_id.clone());
                        }
                        Err(err) => {
                            println!("{:?}", err);
                        }
                    };
                }
                if action == "pause".to_string() {
                    match session.TryPauseAsync().unwrap().await {
                        Ok(_) => {
                            println!("pause for {}", player_id.clone());
                        }
                        Err(err) => {
                            println!("{:?}", err);
                        }
                    };
                }
                if action == "next".to_string() {
                    match session.TrySkipNextAsync().unwrap().await {
                        Ok(_) => {
                            println!("next for {}", player_id.clone());
                        }
                        Err(err) => {
                            println!("{:?}", err);
                        }
                    };
                }
                if action == "prev".to_string() {
                    match session.TrySkipPreviousAsync().unwrap().await {
                        Ok(_) => {
                            println!("previous for {}", player_id.clone());
                        }
                        Err(err) => {
                            println!("{:?}", err);
                        }
                    };
                }
                if action == "position".to_string() {
                    match position {
                        Some(value) => {
                            let time = Duration::from_millis(value).as_nanos();
                            match session
                                .TryChangePlaybackPositionAsync((time / 100) as i64)
                                .unwrap()
                                .await
                            {
                                Ok(_) => {
                                    println!("position updated for {}", player_id.clone());
                                }
                                Err(err) => {
                                    println!("{:?}", err);
                                }
                            };
                        }
                        None => {}
                    }
                }
                Ok::<(), std::io::Error>(())
            });
            Ok(())
        }
        None => {
            println!("No media player found");
            Ok(())
        }
    }
}
