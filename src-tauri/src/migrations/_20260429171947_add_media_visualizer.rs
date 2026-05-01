use crate::migration::Migration;
use serde_json::Value;

pub struct AddMediaVisualizer;

impl Migration for AddMediaVisualizer {
    fn name(&self) -> &'static str {
        "20260429171947_add_media_visualizer"
    }

    fn up(&self, _: &mut Value) {}

    fn down(&self, _: &mut Value) {}

    fn seed_new_widget(&self) -> Option<&str> {
        Some("media-viz")
    }
}
