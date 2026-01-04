use reqwest::Client;
use serde_json::{json, Value};
use std::collections::HashMap;

#[tauri::command]
pub async fn track_analytics_event(
    app: tauri::AppHandle,
    event: &str,
    distinct_id: &str,
    extra_properties: Option<HashMap<String, Value>>,
) -> Result<(), String> {
    let client = Client::new();
    let token = option_env!("MIXPANEL_TOKEN").unwrap_or("");

    let mut properties = serde_json::Map::new();
    properties.insert("distinct_id".to_string(), json!(distinct_id));
    properties.insert("token".to_string(), json!(token));
    properties.insert(
        "version".to_string(),
        json!(app.package_info().version.to_string()),
    );
    properties.insert("os".to_string(), json!("windows"));

    if let Some(extra) = extra_properties {
        for (k, v) in extra {
            properties.insert(k, v);
        }
    }

    let event_data = json!([{
        "event": event,
        "properties": properties,
    }]);

    let res = client
        .post("https://api.mixpanel.com/track?ip=0")
        .header("accept", "text/plain")
        .header("content-type", "application/json")
        .json(&event_data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        Ok(())
    } else {
        Err(format!("Mixpanel error: {}", res.status()))
    }
}
