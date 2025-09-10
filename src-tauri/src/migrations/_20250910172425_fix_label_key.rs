use crate::migration::Migration;
use serde_json::Value;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct FixLabelKey;

fn sanitize_string(input: &str) -> String {
    let sanitized: String = input
        .to_lowercase()
        .chars()
        .filter_map(|c| {
            if c.is_whitespace() {
                Some('-') // Replace space with hyphen
            } else if c.is_ascii_alphanumeric() || "-_".contains(c) {
                Some(c) // Keep valid characters
            } else {
                None // Skip any other character
            }
        })
        .collect();
    let non_hyphen_chars = sanitized.chars().filter(|&c| c != '-').count();
    if non_hyphen_chars == 0 {
        // fallback: timestamp in milliseconds
        let start = SystemTime::now();
        let since_epoch = start
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards");
        since_epoch.as_millis().to_string()
    } else {
        sanitized
    }
}

fn capitalize_first_letter(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
}

impl Migration for FixLabelKey {
    fn name(&self) -> &'static str {
        "20250910172425_fix_label_key"
    }

    fn up(&self, json: &mut Value) {
        let key = json
            .get("key")
            .and_then(|k| k.as_str())
            .unwrap_or("")
            .to_string();
        let label = json
            .get("label")
            .and_then(|k| k.as_str())
            .unwrap_or("")
            .to_string();
        json["key"] = Value::String(sanitize_string(&key));
        if vec!["battery", "disk", "media", "system", "weather"].contains(&label.as_str()) {
            json["label"] = Value::String(capitalize_first_letter(&label));
        }
        if label == "GPT" {
            json["label"] = Value::String("ChatGPT".to_string());
        }
        if label == "ram" {
            json["label"] = Value::String("RAM".to_string());
        }
        if label == "datetime" {
            json["label"] = Value::String("Date & Time".to_string());
        }
    }

    fn down(&self, _json: &mut Value) {
        // TODO: implement rollback
    }
}
