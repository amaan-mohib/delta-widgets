import { path } from "@tauri-apps/api";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { commands } from "./commands";
import { message } from "@tauri-apps/plugin-dialog";
import { IWidget } from "../types/manifest";

export const getStore = async () => {
  try {
    const storePath = await path.resolve(await path.appDataDir(), "store.json");
    const store = await readTextFile(storePath);
    return JSON.parse(store) as Record<string, any>;
  } catch (error) {
    return {};
  }
};

/** Get manifest path with manifest.json attached */
export const getManifestPath = async (manifestPath: string) => {
  if (!manifestPath.endsWith("manifest.json")) {
    manifestPath = await path.resolve(manifestPath, "manifest.json");
  }
  return manifestPath;
};

export const getManifestFromPath = async (manifestPath: string) => {
  manifestPath = await getManifestPath(manifestPath);
  const manifest = await readTextFile(manifestPath);
  return JSON.parse(manifest) as Omit<IWidget, "path">;
};

export const closeWidgetWindow = async (
  label: string,
  toggleVisibility?: boolean,
  path?: string,
) => {
  try {
    if (toggleVisibility && path) {
      const pathWithJSON = await getManifestPath(path);
      await commands.updateManifestValue({
        field: "visible",
        value: false,
        path: JSON.stringify(pathWithJSON),
      });
    }
    await commands.closeWidgetWindow({ label });
  } catch (error) {
    console.error(error);
    await message("Could not close widget window", {
      title: "Error",
      kind: "error",
    });
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
  "visualizer-delta-default": "templates/visualizer/thumb.png",
  "media-viz-delta-default": "templates/media-viz/thumb.png",
};
