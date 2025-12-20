import { path } from "@tauri-apps/api";
import { readTextFile } from "@tauri-apps/plugin-fs";

export const getStore = async () => {
  try {
    const storePath = await path.resolve(await path.appDataDir(), "store.json");
    const store = await readTextFile(storePath);
    return JSON.parse(store) as Record<string, any>;
  } catch (error) {
    return {};
  }
};
