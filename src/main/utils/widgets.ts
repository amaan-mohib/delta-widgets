import { path } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api/core";
import { message, open } from "@tauri-apps/plugin-dialog";
import { exists, mkdir, readDir, readTextFile, remove, UnwatchFn, watch, writeTextFile } from "@tauri-apps/plugin-fs";
import { nanoid } from "nanoid";

export interface IWidget {
  key: string,
  label: string,
  path: string,
  description?: string,
  dimensions?: { width: number, height: number },
  position?: { x: number, y: number },
  visible?: boolean,
  elements?: any[],
  file?: string,
  url?: string,
}

export const getWidgetsDirPath = async (saves?: boolean) => {
  const appDataDir = await path.appDataDir();
  const widgetsDir = await path.resolve(appDataDir, saves ? "saves" : "widgets");
  const widgetsDirExists = await exists(widgetsDir);
  return { widgetsDir, widgetsDirExists }
}

export const getAllWidgets = async (saves?: boolean) => {
  const result: Record<string, IWidget> = {};
  const { widgetsDir, widgetsDirExists } = await getWidgetsDirPath(saves);
  if (!widgetsDirExists) {
    await mkdir(widgetsDir, { recursive: true });
  }
  const widgetFolders = await readDir(widgetsDir);

  await Promise.all(widgetFolders.map(async folder => {
    try {
      if (folder.isDirectory) {
        const folderPath = await path.resolve(widgetsDir, folder.name)
        const manifestPath = await path.resolve(folderPath, "manifest.json");
        const manifest = JSON.parse(await readTextFile(manifestPath));
        result[manifest.key] = { ...manifest, path: saves ? manifestPath : folderPath };
      }
    } catch (error) {
      console.error(error);
    }
  }));

  return result;
}

export const watchWidgetFolder = async (cb: Function, saves?: boolean) => {
  const { widgetsDir, widgetsDirExists } = await getWidgetsDirPath(saves);
  let unwatch: UnwatchFn | null = null;
  if (widgetsDirExists) {
    unwatch = await watch(widgetsDir, () => {
      cb();
    }, { delayMs: 500, recursive: true });
  }
  return unwatch;
}

export const fileOrFolderPicker = async (directory: boolean, title?: string, extensions?: string[], validate = true) => {
  const path = await open({
    directory,
    title: title || "Select file",
    filters: extensions ? [{ extensions, name: "Filters" }] : undefined
  });
  if (validate && path && !directory) {
    try {
      const manifest = JSON.parse(await readTextFile(path)) as IWidget;
      if (!manifest.key) {
        await message("Invalid widget JSON file", { title: "Invalid file", kind: 'error' });
        return { path: null };
      }
      return { manifest, path };
    } catch (error) {
      await message("Invalid widget JSON file", { title: "Invalid file", kind: 'error' });
      console.error(error);
      return { path: null };
    }
  }
  if (validate && path && directory) {
    try {
      const htmlFiles = await readDir(path);
      if (!htmlFiles.find(item => item.name === "index.html")) {
        await message("No index.html found in the folder", { title: "Invalid folder", kind: 'error' });
        return { path: null };
      }
    } catch (error) {
      console.error(error);
      return { path: null };
    }
  }
  return { path };
}

export const addWidget = async (type: "url" | "json" | "html", data: { url?: string, path?: string, manifest?: IWidget, label: string }, saves?: boolean) => {
  if (!data.label) {
    await message("Label is required", { title: "Label is required", kind: 'error' });
    return Promise.reject("Label is required");
  }
  const key = data.manifest?.key || data.label.toLowerCase();
  const description = data.manifest?.description;
  const { widgetsDir, widgetsDirExists } = await getWidgetsDirPath(saves);
  if (!widgetsDirExists) {
    return Promise.reject("Widget directory does not exist");
  }
  const widgetFolders = await readDir(widgetsDir);
  if (widgetFolders.find(item => item.name === key)) {
    await message("Widget with same key exists", { title: "Cannot add widget", kind: 'error' });
    return Promise.reject("Widget with same key exists");
  }
  await mkdir(await path.resolve(widgetsDir, key));
  let manifest: Omit<IWidget, 'path'> | null = null;

  if (type === "url" && data.url) {
    manifest = {
      ...(data.manifest || {}),
      key,
      label: data.label,
      url: data.url,
      description
    };
  }

  if (type === "json" && data.manifest) {
    manifest = { ...data.manifest, label: data.label, description };
  }

  if (type === "html" && data.path) {
    manifest = {
      ...(data.manifest || {}),
      key,
      label: data.label,
      file: await path.resolve(data.path, "index.html"),
      description
    };
  }

  await writeTextFile(await path.resolve(widgetsDir, key, "manifest.json"), JSON.stringify({ ...manifest, path: undefined }, null, 2));
  return Promise.resolve();
}

export const duplicateWidget = async (widget: IWidget, saves?: boolean) => {
  const copyLabel = `${widget.label}-${nanoid(4)}`;
  const copyKey = copyLabel.toLowerCase();
  addWidget(
    widget.url
      ? "url"
      : widget.file
        ? "html"
        : "json",
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
  )
}

export const removeWidget = async (path: string) => {
  try {
    await remove(path, { recursive: true });
  } catch (error) {
    console.error(error);
    await message("Could not remove widget", { title: "Error", kind: 'error' });
  }
}

export const createCreatorWindow = async (manifestPath?: string) => {
  const appDataDir = await path.appDataDir();
  const savePath = await path.resolve(appDataDir, "saves");
  if (!(await exists(savePath))) {
    await mkdir(savePath);
  }
  let projectFolder = "";

  const label = manifestPath ? "" : `Untitled-${nanoid(4)}`;
  const key = manifestPath ? "" : label.toLowerCase();
  let manifest: Omit<IWidget, 'path'> = {
    key,
    label,
    elements: [{
      type: "container",
      styles: {
        display: "flex",
        background: "transparent",
      }
    }],
    dimensions: {
      width: 400,
      height: 300,
    },
  };

  if (!manifestPath) {
    const timestamp = new Date().getTime();
    projectFolder = await path.resolve(savePath, timestamp.toString());
    await mkdir(projectFolder);

    manifestPath = await path.resolve(projectFolder, "manifest.json");
    await writeTextFile(manifestPath, JSON.stringify(manifest, null, 2));
  } else {
    projectFolder = await path.resolve(manifestPath, "..");
    manifest = JSON.parse(await readTextFile(manifestPath));
  }
  await invoke("create_creator_window", {
    manifest: JSON.stringify({ ...manifest, path: projectFolder }),
    currentFolder: projectFolder
  });
}
