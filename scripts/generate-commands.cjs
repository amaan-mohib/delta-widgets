const fs = require("fs");
const path = require("path");

const tsCommandsPath = path.join("src", "common", "commands.ts");
let tsCommands = fs.readFileSync(tsCommandsPath, "utf-8");

const rsCommandsPath = path.join("src-tauri", "src", "lib.rs");
const rsCommands = fs.readFileSync(rsCommandsPath, "utf-8");

const snakeToCamel = (str = "") =>
  str
    .toLowerCase()
    .replace(/(_\w)/g, (match) => match.toUpperCase().replace("_", ""));

function getAllTauriCommands() {
  const block =
    rsCommands.match(/tauri::generate_handler!\[(.*)\]/s)?.[1] ?? "";
  const commands = [...block.matchAll(/(\w+)(?=\s*[,\]])/g)].map((m) => m[1]);

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
}

const newEntries = [];
const newTypes = [];
missingCommands.forEach((cmd) => {
  const name = snakeToCamel(cmd);
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  const typeName = `I${capitalizedName}`;
  newEntries.push(
    `  ${name}: (params?: ${typeName}Params) => invoke<${typeName}>("${cmd}", params),`,
  );
  newTypes.push(
    `export type ${typeName}Params = {};\nexport type ${typeName} = void;\n`,
  );
});

const updated =
  newEntries.length > 0
    ? tsCommands.replace(/(\s*}\s*;?\s*)$/, `\n${newEntries.join("\n")}$1`)
    : tsCommands;

const updatedWithTypes =
  newTypes.length > 0
    ? updated.replace(
        "export const commands = {",
        `${newTypes.join("\n")}\nexport const commands = {`,
      )
    : updated;

fs.writeFileSync(tsCommandsPath, updatedWithTypes);
