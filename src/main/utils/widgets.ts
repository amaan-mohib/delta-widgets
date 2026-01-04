import { path } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api/core";
import { message, open } from "@tauri-apps/plugin-dialog";
import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  remove,
  UnwatchFn,
  watch,
  writeFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { nanoid } from "nanoid";
import { IWidget } from "../../types/manifest";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { toBlob } from "html-to-image";

export const getWidgetsDirPath = async (saves?: boolean) => {
  const appDataDir = await path.appDataDir();
  const widgetsDir = await path.resolve(
    appDataDir,
    saves ? "saves" : "widgets"
  );
  const widgetsDirExists = await exists(widgetsDir);
  return { widgetsDir, widgetsDirExists };
};

export const getAllWidgets = async (saves?: boolean) => {
  const result: Record<string, IWidget> = {};
  const { widgetsDir, widgetsDirExists } = await getWidgetsDirPath(saves);
  if (!widgetsDirExists) {
    await mkdir(widgetsDir, { recursive: true });
  }
  const widgetFolders = await readDir(widgetsDir);

  await Promise.all(
    widgetFolders.map(async (folder) => {
      try {
        if (folder.isDirectory) {
          const folderPath = await path.resolve(widgetsDir, folder.name);
          const manifestPath = await path.resolve(folderPath, "manifest.json");
          const manifest = JSON.parse(await readTextFile(manifestPath));
          result[manifest.key] = {
            ...manifest,
            path: saves ? manifestPath : folderPath,
          };
        }
      } catch (error) {
        console.error(error);
      }
    })
  );

  return result;
};

export const watchWidgetFolder = async (cb: () => void, saves?: boolean) => {
  const { widgetsDir, widgetsDirExists } = await getWidgetsDirPath(saves);
  let unwatch: UnwatchFn | null = null;
  if (widgetsDirExists) {
    unwatch = await watch(
      widgetsDir,
      () => {
        cb();
      },
      { delayMs: 500, recursive: true }
    );
  }
  return unwatch;
};

export const fileOrFolderPicker = async (params: {
  directory?: boolean;
  title?: string;
  extensions?: string[];
  validate?: boolean;
}) => {
  const {
    directory,
    title = "Select file",
    extensions,
    validate = true,
  } = params;
  const path = await open({
    directory,
    title,
    filters: extensions ? [{ extensions, name: "Filters" }] : undefined,
  });
  if (validate && path && !directory) {
    try {
      const manifest = JSON.parse(await readTextFile(path)) as IWidget;
      if (!manifest.key) {
        await message("Invalid widget JSON file", {
          title: "Invalid file",
          kind: "error",
        });
        return { path: null };
      }
      return { manifest, path };
    } catch (error) {
      await message("Invalid widget JSON file", {
        title: "Invalid file",
        kind: "error",
      });
      console.error(error);
      return { path: null };
    }
  }
  if (validate && path && directory) {
    try {
      const htmlFiles = await readDir(path);
      if (!htmlFiles.find((item) => item.name === "index.html")) {
        await message("No index.html found in the folder", {
          title: "Invalid folder",
          kind: "error",
        });
        return { path: null };
      }
    } catch (error) {
      console.error(error);
      return { path: null };
    }
  }
  return { path };
};

export const sanitizeString = (input: string) => {
  const sanitized = input
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "");
  if (!sanitized || sanitized.replace(/-+/g, "") === "") {
    return nanoid();
  }
  return sanitized;
};

export const addWidget = async (
  type: IWidget["widgetType"] = "json",
  data: { url?: string; path?: string; manifest?: IWidget; label: string },
  saves?: boolean
) => {
  try {
    if (!data.label) {
      throw new Error("Label is required");
    }
    const key = sanitizeString(data.manifest?.key || data.label);
    const description = data.manifest?.description;
    const { widgetsDir, widgetsDirExists } = await getWidgetsDirPath(saves);
    if (!widgetsDirExists) {
      throw new Error("Widget directory does not exist");
    }
    const widgetFolders = await readDir(widgetsDir);
    if (widgetFolders.find((item) => item.name === key)) {
      throw new Error("Widget with same key exists");
    }

    let manifest: Omit<IWidget, "path"> | null = null;

    if (type === "url" && data.url) {
      manifest = {
        ...(data.manifest || {}),
        key,
        label: data.label,
        url: data.url,
        description,
      };
    }

    if (type === "json" && data.manifest) {
      manifest = { ...data.manifest, label: data.label, description };
    }

    if (type === "html" && data.path) {
      await invoke("copy_custom_assets_dir", { key, path: data.path });
      manifest = {
        ...(data.manifest || {}),
        key,
        label: data.label,
        file: data.path,
        description,
      };
    }
    try {
      await mkdir(await path.resolve(widgetsDir, key));
      await writeTextFile(
        await path.resolve(widgetsDir, key, "manifest.json"),
        JSON.stringify(
          { ...manifest, widgetType: type, path: undefined },
          null,
          2
        )
      );
    } catch (error) {
      console.error(error);
      throw new Error("Something went wrong while adding widget");
    }
  } catch (error) {
    console.error(error);
    await message(error as string, {
      title: "Error",
      kind: "error",
    });
  }
};

export const duplicateWidget = async (widget: IWidget, saves?: boolean) => {
  const copyLabel = `${widget.label}-${nanoid(4)}`;
  const copyKey = copyLabel.toLowerCase();
  await addWidget(
    widget.widgetType,
    {
      label: copyLabel,
      manifest: {
        ...widget,
        label: copyLabel,
        key: copyKey,
        description: `Copy of ${widget.label}`,
      },
      path: widget.file,
      url: widget.url,
    },
    saves
  );
};

export const removeWidget = async (filePath: string) => {
  try {
    const manifestPath = await getManifestPath(filePath);
    await remove(await path.resolve(manifestPath, ".."), {
      recursive: true,
    });
  } catch (error) {
    console.error(error);
    await message("Could not remove widget", { title: "Error", kind: "error" });
  }
};

export const defaultManifest: Omit<IWidget, "path"> = {
  key: "",
  label: "",
  elements: [
    {
      type: "container",
      id: "container",
      styles: {
        display: "flex",
        background: "transparent",
        flex: 1,
        width: "100%",
        padding: "5px",
      },
      children: [],
    },
  ],
  dimensions: {
    width: 400,
    height: 300,
  },
  widgetType: "json",
};

export const createCreatorWindow = async (manifestPath?: string) => {
  const appDataDir = await path.appDataDir();
  const savePath = await path.resolve(appDataDir, "saves");
  if (!(await exists(savePath))) {
    await mkdir(savePath);
  }
  let projectFolder = "";

  const label = manifestPath ? "" : `Untitled-${nanoid(4)}`;
  const key = manifestPath ? "" : label.toLowerCase();

  if (!manifestPath) {
    const timestamp = new Date().getTime();
    projectFolder = await path.resolve(savePath, timestamp.toString());
    await mkdir(projectFolder);

    manifestPath = await path.resolve(projectFolder, "manifest.json");
    await writeTextFile(
      manifestPath,
      JSON.stringify({ ...defaultManifest, key, label }, null, 2)
    );
  } else {
    projectFolder = await path.resolve(manifestPath, "..");
  }
  await invoke("create_creator_window", {
    manifest: JSON.stringify({ path: projectFolder }),
    currentFolder: projectFolder,
  });
};

/** Get manifest path with manifest.json attached */
export const getManifestPath = async (manifestPath: string) => {
  if (!manifestPath.endsWith("manifest.json")) {
    manifestPath = await path.resolve(manifestPath, "manifest.json");
  }
  return manifestPath;
};

export const createWidgetWindow = async (
  manifestPath: string,
  isPreview?: boolean,
  toggleVisibility?: boolean
) => {
  try {
    const pathWithJSON = await getManifestPath(manifestPath);
    if (toggleVisibility) {
      await invoke("toggle_widget_visibility", {
        visibility: true,
        path: JSON.stringify(pathWithJSON),
      });
    }
    await invoke("create_widget_window", {
      path: JSON.stringify(pathWithJSON),
      isPreview,
    });
  } catch (error) {
    console.error("Error creating widget window:", error);
    await message(
      `Widget maybe already being ${
        isPreview ? "previewed" : "enabled"
      } or something went wrong.`,
      {
        title: "Error",
        kind: "error",
      }
    );
  }
};

export const closeWidgetWindow = async (
  label: string,
  toggleVisibility?: boolean,
  path?: string
) => {
  try {
    if (toggleVisibility && path) {
      const pathWithJSON = await getManifestPath(path);
      await invoke("toggle_widget_visibility", {
        visibility: false,
        path: JSON.stringify(pathWithJSON),
      });
    }
    await invoke("close_widget_window", { label });
  } catch (error) {
    console.error(error);
    await message("Could not close widget window", {
      title: "Error",
      kind: "error",
    });
  }
};

export const getManifestFromPath = async (manifestPath: string) => {
  manifestPath = await getManifestPath(manifestPath);
  const manifest = await readTextFile(manifestPath);
  return JSON.parse(manifest) as Omit<IWidget, "path">;
};

export const createThumb = async (manifest: IWidget) => {
  try {
    document.querySelectorAll("link").forEach((link) => {
      link.setAttribute("crossorigin", "anonymous");
    });
    const blob = await toBlob(
      document.getElementById("widget-preview-window")!
    );
    if (blob) {
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const thumbPath = await path.resolve(manifest.path, "thumb.png");
      await writeFile(thumbPath, buffer);
    }
  } catch (error) {
    console.log(error);
  }
};

export const updateManifest = async (manifest: IWidget) => {
  const manifestPath = await getManifestPath(manifest.path);
  await writeTextFile(
    manifestPath,
    JSON.stringify({ ...manifest, path: undefined }, null, 2)
  );
};

export const publishWidget = async (manifestPath: string) => {
  try {
    const path = await getManifestPath(manifestPath);
    await invoke("publish_widget", { path: JSON.stringify(path) });
  } catch (error) {
    console.error(error);
    await message("Could not publish widget", {
      title: "Error",
      kind: "error",
    });
  }
};

export const toggleAlwaysOnTop = async (
  manifestPath: string,
  value: boolean
) => {
  try {
    const path = await getManifestPath(manifestPath);
    await invoke("toggle_always_on_top", { value, path: JSON.stringify(path) });
  } catch (error) {
    console.error(error);
    await message("Could not set always on top", {
      title: "Error",
      kind: "error",
    });
  }
};

export const openManifestFolder = async (manifest: IWidget) => {
  if (manifest.path) {
    const path = await getManifestPath(manifest.path);
    await revealItemInDir(path);
  }
};

export const disableWindowDrag = () => {
  const root = document.querySelector<HTMLDivElement>("#root");
  root?.classList.add("no-drag");
};

export const enableWindowDrag = () => {
  const root = document.querySelector<HTMLDivElement>("#root");
  root?.classList.remove("no-drag");
};
