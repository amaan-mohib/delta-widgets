const fs = require("fs");
const path = require("path");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const tauriConfPath = path.join("src-tauri", "tauri.conf.json");
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf-8"));

if (tauriConf.package.version !== pkg.version) {
  tauriConf.package.version = pkg.version;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2));
  console.log(`🔄 Synced tauri.conf.json to version ${pkg.version}`);
} else {
  console.log(`✅ Versions already match: ${pkg.version}`);
}
