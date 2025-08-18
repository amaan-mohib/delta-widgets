const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const oldVersion = process.argv[2];
if (!oldVersion) {
  console.error(
    "⚠️ Please provide a version to downgrade to, e.g. `node scripts/downgrade.js 0.1.0`"
  );
  process.exit(1);
}

const releasesDir = path.join(__dirname, "..", "releases", oldVersion);
const msiFile = fs.readdirSync(releasesDir).find((f) => f.endsWith(".msi"));
const msiPath = path.join(releasesDir, msiFile);

console.log(`🔄 Downgrading to ${oldVersion} using ${msiFile}`);

try {
  execSync(`msiexec /x "${msiPath}" /quiet`, { stdio: "inherit" });
  console.log("✅ Uninstalled current version");
} catch (e) {
  console.log("ℹ️ No existing version found, skipping uninstall");
}

execSync(`msiexec /i "${msiPath}" /quiet`, { stdio: "inherit" });
console.log(`✅ Installed version ${oldVersion}`);
