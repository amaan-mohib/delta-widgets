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

export const templateWidgets: Record<string, string> = {
  battery: "templates/battery/thumb.png",
  system: "templates/cpu/thumb.png",
  datetime: "templates/datetime/thumb.png",
  disk: "templates/disks/thumb.png",
  media: "templates/media/thumb.png",
  ram: "templates/ram/thumb.png",
  weather: "templates/weather/thumb.png",
};
