import { Button } from "@fluentui/react-components";
import {
  DismissRegular,
  PinOffRegular,
  PinRegular,
  WindowDevToolsRegular,
} from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";
import React from "react";
import { IWidget } from "../../types/manifest";
import {
  disableWindowDrag,
  enableWindowDrag,
  getManifestFromPath,
  getManifestPath,
} from "../../main/utils/widgets";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useDataTrackStore } from "../stores/useDataTrackStore";
import { emitTo } from "@tauri-apps/api/event";
import { updateManifest } from "../utils/utils";

interface ToolbarProps {}

const closeWidget = async (manifest: IWidget) => {
  try {
    const path = await getManifestPath(manifest.path);
    await invoke("toggle_widget_visibility", {
      visibility: false,
      path: JSON.stringify(path),
    });
    await emitTo("main", "creator-close", {});
    await invoke("close_widget_window", { label: `widget-${manifest.key}` });
  } catch (error) {
    console.error(error);
  }
};

const pinWidget = async (manifestPath: string, isPinned: boolean) => {
  try {
    const manifest = await getManifestFromPath(manifestPath);
    await updateManifest({
      ...manifest,
      path: manifestPath,
      pinned: isPinned,
    });
    const window = await WebviewWindow.getByLabel(`widget-${manifest.key}`);
    window?.setResizable(!isPinned);
    if (isPinned) {
      disableWindowDrag();
    } else {
      enableWindowDrag();
    }
    await emitTo("main", "creator-close", {});
  } catch (error) {
    console.error(error);
  }
};

const openDevtools = async (manifest: IWidget) => {
  try {
    await invoke("open_devtools", { label: `widget-${manifest.key}` });
  } catch (error) {
    console.error(error);
  }
};

const Toolbar: React.FC<ToolbarProps> = () => {
  const { manifest } = useDataTrackStore();
  if (!manifest) {
    return null;
  }

  return (
    <div className="floating-btns">
      <Button
        icon={<DismissRegular />}
        size="small"
        onClick={() => {
          closeWidget(manifest);
        }}
      />
      <Button
        icon={manifest.pinned ? <PinOffRegular /> : <PinRegular />}
        size="small"
        onClick={() => {
          pinWidget(manifest.path, !manifest.pinned);
          useDataTrackStore.setState({
            manifest: {
              ...manifest,
              pinned: !manifest.pinned,
            },
          });
        }}
      />
      {import.meta.env.MODE === "development" && (
        <Button
          icon={<WindowDevToolsRegular />}
          size="small"
          onClick={() => {
            openDevtools(manifest);
          }}
        />
      )}
    </div>
  );
};

export default Toolbar;
