import { Button } from "@fluentui/react-components";
import {
  DismissRegular,
  PinOffRegular,
  PinRegular,
  WindowDevToolsRegular,
} from "@fluentui/react-icons";
import React from "react";
import { IWidget } from "../../types/manifest";
import { togglePinned } from "../../main/utils/widgets";
import { useDataTrackStore } from "../stores/useDataTrackStore";
import { emitTo } from "@tauri-apps/api/event";
import { message } from "@tauri-apps/plugin-dialog";
import { commands } from "../../common/commands";
import { closeWidgetWindow } from "../../common";

interface ToolbarProps {}

const closeWidget = async (manifest: IWidget) => {
  try {
    await closeWidgetWindow(`widget-${manifest.key}`, true, manifest.path);
  } catch (error) {
    console.error(error);
  }
};

const pinWidget = async (manifestPath: string, isPinned: boolean) => {
  try {
    await togglePinned(manifestPath, isPinned);
    await emitTo("main", "creator-close", {});
  } catch (error) {
    console.error(error);
    await message("Could not set pinned", {
      title: "Error",
      kind: "error",
    });
  }
};

const openDevtools = async (manifest: IWidget) => {
  try {
    await commands.openDevtools({ label: `widget-${manifest.key}` });
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
