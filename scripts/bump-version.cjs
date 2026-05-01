const fs = require("fs");
const path = require("path");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const tauriConfPath = path.join("src-tauri", "tauri.conf.json");
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf-8"));
const tomlPath = path.join("src-tauri", "Cargo.toml");
const toml = fs.readFileSync(tomlPath, "utf-8");

if (tauriConf.version !== pkg.version) {
  tauriConf.version = pkg.version;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2));
  fs.writeFileSync(
    tomlPath,
    toml.replace(/version\s.*/m, `version = "${pkg.version}"`),
  );
  console.log(`🔄 Synced tauri.conf.json to version ${pkg.version}`);
} else {
  console.log(`✅ Versions already match: ${pkg.version}`);
}
