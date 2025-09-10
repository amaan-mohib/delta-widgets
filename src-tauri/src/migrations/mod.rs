mod _20250910172425_fix_label_key;

use crate::migration::Migration;

pub fn all_migrations() -> Vec<Box<dyn Migration>> {
    vec![
        Box::new(_20250910172425_fix_label_key::FixLabelKey),
    ]
}
