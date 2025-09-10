const fs = require("fs");
const path = require("path");

function toStructCase(name) {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function createMigration(name) {
  if (!name) {
    console.error("❌ Please provide a migration name");
    process.exit(1);
  }

  // timestamp like YYYYMMDDHHMMSS
  const ts = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  // File and mod name get a leading underscore
  const modName = `_${ts}_${name}`;
  const filename = `${modName}.rs`;
  const filepath = path.join(
    __dirname,
    "..",
    "src-tauri",
    "src",
    "migrations",
    filename
  );

  const structName = toStructCase(name);

  const template = `use crate::migration::Migration;
use serde_json::Value;

pub struct ${structName};

impl Migration for ${structName} {
    fn name(&self) -> &'static str {
        "${ts}_${name}"
    }

    fn up(&self, json: &mut Value) {
        // TODO: implement migration
        panic!("Migration not implemented yet");
    }

    fn down(&self, json: &mut Value) {
        // TODO: implement rollback
    }
}
`;

  fs.writeFileSync(filepath, template);
  console.log(`✅ Created migration: migrations/${filename}`);

  // Rebuild mod.rs
  rebuildModRs(path.join(__dirname, "..", "src-tauri", "src", "migrations"));
}

function rebuildModRs(migrationsDir) {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".rs") && f.startsWith("_"))
    .sort(); // lexicographic = chronological

  let mods = "";
  let vecs = "";

  for (const file of files) {
    const modName = file.replace(".rs", "");
    const parts = modName.replace(/^_\d+_/, "").split("_");
    const structName = parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join("");

    mods += `mod ${modName};\n`;
    vecs += `        Box::new(${modName}::${structName}),\n`;
  }

  const modContent = `${mods}
use crate::migration::Migration;

pub fn all_migrations() -> Vec<Box<dyn Migration>> {
    vec![
${vecs}    ]
}
`;

  fs.writeFileSync(path.join(migrationsDir, "mod.rs"), modContent);
  console.log("🔗 Rebuilt migrations/mod.rs in sorted order");
}

createMigration(process.argv[2]);
