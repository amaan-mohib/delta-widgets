mod _20250910172425_fix_label_key;
mod _20260104192742_update_media;
mod _20260104194741_update_weather;
mod _20260104194931_update_battery;

use crate::migration::Migration;

pub fn all_migrations() -> Vec<Box<dyn Migration>> {
    vec![
        Box::new(_20250910172425_fix_label_key::FixLabelKey),
        Box::new(_20260104192742_update_media::UpdateMedia),
        Box::new(_20260104194741_update_weather::UpdateWeather),
        Box::new(_20260104194931_update_battery::UpdateBattery),
    ]
}
