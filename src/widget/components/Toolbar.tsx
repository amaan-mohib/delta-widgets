import { Button } from "@fluentui/react-components";
import {
  DismissRegular,
  PinOffRegular,
  PinRegular,
  SettingsRegular,
  WindowDevToolsRegular,
} from "@fluentui/react-icons";
import React, { useEffect, useState } from "react";
import { IWidget } from "../../common/types/manifest";
import { togglePinned } from "../../main/utils/widgets";
import { useDataTrackStore } from "../stores/useDataTrackStore";
import { emitTo } from "@tauri-apps/api/event";
import { message } from "@tauri-apps/plugin-dialog";
import { commands } from "../../common/commands";
import { closeWidgetWindow } from "../../common";
import { useVariableStore } from "../stores/useVariableStore";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { IEmitSettings } from "../../common/types/variables";

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
  const { manifest, isPreview } = useDataTrackStore();
  const dynamicVariableMap = useVariableStore((s) => s.dynamicVariableMap);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setShowSettings(
      dynamicVariableMap.has("date") ||
        dynamicVariableMap.has("time") ||
        dynamicVariableMap.has("datetime") ||
        dynamicVariableMap.has("weather"),
    );
  }, [dynamicVariableMap]);

  const openSettings = async () => {
    if (!manifest || isPreview) return;

    const mainWindow = await WebviewWindow.getByLabel("main");
    if (!mainWindow) return;
    await mainWindow.show();
    await mainWindow.setFocus();
    const values: IEmitSettings["dateValues"] = {};
    const entries = Object.fromEntries(dynamicVariableMap);
    for (let key in entries) {
      if (["date", "time", "datetime"].includes(key)) {
        values[key] = entries[key];
      }
    }
    await emitTo<IEmitSettings>("main", "widget-settings", {
      label: manifest.label,
      key: manifest.key,
      path: manifest.path,
      dateValues: values,
      hasWeather: dynamicVariableMap.has("weather"),
    });
  };

  if (!manifest || isPreview) {
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
      {showSettings && (
        <Button
          icon={<SettingsRegular />}
          size="small"
          onClick={() => {
            openSettings();
          }}
        />
      )}
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
