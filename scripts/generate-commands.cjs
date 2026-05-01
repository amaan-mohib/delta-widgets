const fs = require("fs");
const path = require("path");

const tsCommandsPath = path.join("src", "common", "commands.ts");
let tsCommands = fs.readFileSync(tsCommandsPath, "utf-8");

const rsCommandsPath = path.join("src-tauri", "src", "lib.rs");
const rsCommands = fs.readFileSync(rsCommandsPath, "utf-8");

const snakeToCamel = (str) =>
  str
    .toLowerCase()
    .replace(/(_\w)/g, (match) => match.toUpperCase().replace("_", ""));

function getAllTauriCommands() {
  const block =
    rsCommands.match(/tauri::generate_handler!\[(.*)\]/s)?.[1] ?? "";
  const commands = [...block.matchAll(/(\w+)(?=\s*[,\]])/g)].map((m) => m[1]);
  // console.log(commands);
  return commands;
}

const TS_REGEX =
  /(?:\w+):\s*\([^)]*\)\s*=>\s*invoke(?:\<.*\>)*\("(\w+)"[^)]*\),?/g;

function getAddedCommands() {
  const commands = [...tsCommands.matchAll(TS_REGEX)].map(
    ([, command]) => command,
  );

  return new Set(commands);
}

const existingSet = getAddedCommands();
const tauriCommands = getAllTauriCommands();
const missingCommands = tauriCommands.filter((cmd) => !existingSet.has(cmd));
const tauriCommandsSet = new Set(tauriCommands);
const invalidCommands = [...existingSet].filter(
  (cmd) => !tauriCommandsSet.has(cmd),
);

if (invalidCommands.length > 0) {
  console.warn(
    "Redundant or invalid commands were present: " + invalidCommands,
  );
  tsCommands = tsCommands.replace(TS_REGEX, (match, command) =>
    invalidCommands.includes(command) ? "" : match,
  );
  // return;
}

const newEntries = missingCommands
  .map(
    (cmd) =>
      `  ${snakeToCamel(cmd)}: (params: {}) => invoke<void>("${cmd}", params),`,
  )
  .join("\n");

const updated = tsCommands.replace(/(\s*}\s*;?\s*)$/, `\n${newEntries}$1`);

fs.writeFileSync(tsCommandsPath, updated);
