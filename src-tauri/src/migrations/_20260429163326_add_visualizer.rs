use crate::migration::Migration;
use serde_json::Value;

pub struct AddVisualizer;

impl Migration for AddVisualizer {
    fn name(&self) -> &'static str {
        "20260429163326_add_visualizer"
    }

    fn up(&self, _: &mut Value) {}

    fn down(&self, _: &mut Value) {}

    fn seed_new_widget(&self) -> Option<&str> {
        Some("visualizer")
    }
}
