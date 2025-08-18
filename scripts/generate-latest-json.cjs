const fs = require("fs");
const path = require("path");

const version = require("../package.json").version;
const bundleDir = path.join("src-tauri", "target", "release", "bundle", "msi");

const msiFile = fs
  .readdirSync(bundleDir)
  .sort()
  .reverse()
  .find((f) => f.endsWith(".msi"));
const sigFile = msiFile + ".sig";

const manifest = {
  version,
  notes: "Local testing build",
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: fs.readFileSync(path.join(bundleDir, sigFile), "utf-8"),
      url: `http://localhost:3000/${msiFile}`,
    },
  },
};

fs.writeFileSync("latest.json", JSON.stringify(manifest, null, 2));
console.log("✅ Generated latest.json");
