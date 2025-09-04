const fs = require("fs");
const crypto = require("crypto");

function safeReadJSON(path) {
  if (!fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const runnerOS = process.env.RUNNER_OS;
const osMap = {
  win32: "Windows",
  darwin: "macOS",
  linux: "Linux",
};
const normalizedOS = runnerOS || osMap[process.platform] || process.platform;

const pkg = safeReadJSON("package.json");
const lock = safeReadJSON("package-lock.json");

// Only include deps, ignore "version" etc.
const deps = {
  dependencies: pkg.dependencies,
  devDependencies: pkg.devDependencies,
  peerDependencies: pkg.peerDependencies,
  optionalDependencies: pkg.optionalDependencies,
};

if (lock.packages && lock.packages[""]) {
  delete lock.packages[""].version;
}
// Only include lock data relevant to deps
const lockDeps = {
  dependencies: lock.dependencies,
  packages: lock.packages,
};

const hash = crypto
  .createHash("sha256")
  .update(JSON.stringify({ deps, lockDeps }))
  .digest("hex");

console.log(`cache-key=cache-nodemodules-${normalizedOS}-${hash}`);
