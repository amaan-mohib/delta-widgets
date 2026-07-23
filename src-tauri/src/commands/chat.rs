use crate::{
    commands::utils::{
        query_media_history_util, query_media_search, query_media_stats, query_top_artist,
        query_top_media,
    },
    db::DatabaseState,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::prelude::*;
use tauri::Manager;

#[derive(Debug, FromRow, Serialize)]
pub struct Chat {
    pub id: String,
    pub name: String,
    pub data: serde_json::Value,
    pub created_at: i64, // Unix timestamp
    pub updated_at: i64, // Unix timestamp
}

#[derive(Debug, FromRow, Serialize)]
pub struct Message {
    pub id: String,
    pub chat_id: String,
    pub content: serde_json::Value,
    pub created_at: i64, // Unix timestamp
    pub updated_at: i64, // Unix timestamp
}

#[derive(Debug, Deserialize)]
pub struct ChatInput {
    pub id: String,
    pub name: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Deserialize)]
pub struct MessageInput {
    pub id: String,
    pub chat_id: String,
    pub content: serde_json::Value,
}

#[tauri::command]
pub async fn create_chat(
    state: tauri::State<'_, DatabaseState>,
    input: ChatInput,
) -> Result<(), String> {
    let pool = &state.0;

    let stmt = r#"
        INSERT INTO chats (id, name, data)
        VALUES ($1, $2, $3)
    "#;

    sqlx::query(stmt)
        .bind(&input.id)
        .bind(&input.name)
        .bind(&input.data)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_chat_name(
    state: tauri::State<'_, DatabaseState>,
    name: String,
    chat_id: String,
) -> Result<(), String> {
    let pool = &state.0;

    let stmt = r#"
        UPDATE chats
        SET name = $1
        WHERE id = $2
    "#;

    sqlx::query(stmt)
        .bind(&name)
        .bind(&chat_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_chat_widget_keys(
    state: tauri::State<'_, DatabaseState>,
    chat_id: String,
    key: String,
) -> Result<(), String> {
    let pool = &state.0;

    let stmt = r#"
        SELECT
            id,
            name,
            data,
            created_at,
            updated_at
        FROM chats
        WHERE id = $1
        LIMIT 1
    "#;
    let query = sqlx::query_as::<_, Chat>(stmt);
    let chat = query
        .bind(&chat_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;
    let mut data = chat.data;

    let widget_keys = data
        .as_object_mut()
        .ok_or("data is not an object")?
        .entry("widgetKeys")
        .or_insert(json!([]));

    let keys = widget_keys
        .as_array_mut()
        .ok_or("widgetKeys is not an array")?;

    keys.push(json!(key));

    let stmt = r#"
        UPDATE chats
        SET data = $1
        WHERE id = $2
    "#;

    sqlx::query(stmt)
        .bind(&data)
        .bind(&chat_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_chat_by_id(
    state: tauri::State<'_, DatabaseState>,
    id: String,
) -> Result<Chat, String> {
    let stmt = r#"
        SELECT
            id,
            name,
            data,
            created_at,
            updated_at
        FROM chats
        WHERE id = $1
        LIMIT 1
    "#;

    let query = sqlx::query_as::<_, Chat>(stmt);
    let pool = &state.0;
    let chat = query
        .bind(&id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(chat)
}

#[tauri::command]
pub async fn delete_chat(state: tauri::State<'_, DatabaseState>, id: String) -> Result<(), String> {
    let stmt = r#"
        DELETE
        FROM chats
        WHERE id = ?
    "#;

    let query = sqlx::query(stmt);
    let pool = &state.0;
    query
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_all_chats(state: tauri::State<'_, DatabaseState>) -> Result<Vec<Chat>, String> {
    let stmt = r#"
        SELECT
            id,
            name,
            data,
            created_at,
            updated_at
        FROM chats
        ORDER BY created_at DESC
    "#;

    let query = sqlx::query_as::<_, Chat>(stmt);
    let pool = &state.0;
    let chats = query.fetch_all(pool).await.map_err(|e| e.to_string())?;

    Ok(chats)
}

#[tauri::command]
pub async fn load_chat(
    state: tauri::State<'_, DatabaseState>,
    chat_id: String,
) -> Result<Vec<Message>, String> {
    let stmt = r#"
        SELECT
            id,
            chat_id,
            content,
            created_at,
            updated_at
        FROM messages
        WHERE chat_id = $1
        ORDER BY created_at ASC
    "#;

    let query = sqlx::query_as::<_, Message>(stmt).bind(chat_id);
    let pool = &state.0;
    let messages = query.fetch_all(pool).await.map_err(|e| e.to_string())?;

    Ok(messages)
}

#[tauri::command]
pub async fn upsert_message(
    state: tauri::State<'_, DatabaseState>,
    input: MessageInput,
) -> Result<(), String> {
    let pool = &state.0;

    let stmt = r#"
        INSERT INTO messages (id, chat_id, content)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET
            chat_id = EXCLUDED.chat_id,
            content = EXCLUDED.content,
            updated_at = unixepoch('now')
    "#;

    sqlx::query(stmt)
        .bind(&input.id)
        .bind(&input.chat_id)
        .bind(&input.content)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MediaQueryIntent {
    History,
    TopMedia,
    TopArtists,
    Stats,
    Search,
}
#[derive(Debug, Deserialize)]
pub struct MediaQueryRequest {
    pub intent: MediaQueryIntent,
    pub start_time: Option<String>,
    pub end_time: Option<String>,
    pub search_query: Option<String>,
    pub limit: Option<i64>,
}

#[tauri::command]
pub async fn query_media_history(
    state: tauri::State<'_, DatabaseState>,
    input: MediaQueryRequest,
) -> Result<serde_json::Value, String> {
    let pool = &state.0;

    match input.intent {
        MediaQueryIntent::History => query_media_history_util(pool, input).await,
        MediaQueryIntent::TopMedia => query_top_media(pool, input).await,
        MediaQueryIntent::TopArtists => query_top_artist(pool, input).await,
        MediaQueryIntent::Stats => query_media_stats(pool, input).await,
        MediaQueryIntent::Search => query_media_search(pool, input).await,
    }
}

#[tauri::command]
pub async fn create_assistant_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(existing_window) = app.get_webview_window("assistant") {
        existing_window.set_focus().unwrap();
        return Ok(());
    };
    let new_window = tauri::WebviewWindowBuilder::new(
        &app,
        "assistant",
        tauri::WebviewUrl::App("ai-index.html".into()),
    )
    .title("Assistant")
    .inner_size(400.0, 550.0)
    .min_inner_size(400.0, 550.0)
    .transparent(true)
    .build()
    .unwrap();
    new_window.show().unwrap();
    new_window.set_focus().unwrap();

    Ok(())
}
