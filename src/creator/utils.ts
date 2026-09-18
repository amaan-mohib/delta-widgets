import {
  SpinButtonChangeEvent,
  SpinButtonOnChangeData,
} from "@fluentui/react-components";
import { path } from "@tauri-apps/api";
import { writeFile } from "@tauri-apps/plugin-fs";
import { toBlob } from "html-to-image";
import { fileOrFolderPicker } from "../main/utils/widgets";
import { nanoid } from "nanoid";
import { commands } from "../common/commands";
import { useManifestStore } from "./stores/useManifestStore";
import { ICustomAssets } from "../common/types/manifest";
import { sendMixpanelEvent } from "../main/utils/analytics";

export const spinButtonOnChange = (
  event: SpinButtonChangeEvent,
  data: SpinButtonOnChangeData,
  onChange: (value: number) => void,
  defaultValue?: number,
) => {
  onChange(
    Number(
      data.value ||
        (event.target as HTMLInputElement).value ||
        defaultValue ||
        0,
    ),
  );
};

const formatVariable =
  (key: string) =>
  (format?: string): string => {
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
    if (key === "media" && format === "thumbnail")
      return "https://placehold.co/400x400?text=Thumbnail";
    if (key === "weather" && format === "icon")
      return "https://placehold.co/400x400?text=Weather";
    return `${capitalizedKey}${format ? ` (${format})` : ""}`;
  };

const textVariables: Record<string, (format?: string) => string> = [
  "date",
  "time",
  "datetime",
  "media",
  "system",
  "weather",
  "misc",
  "custom",
].reduce(
  (acc, key) => ({
    ...acc,
    [key]: formatVariable(key),
  }),
  {},
);

export const parseDynamicText = (text: string) => {
  return text.replace(
    /\{\{(\w+)(?::([^}]+))?\}\}/g,
    (match, key, formatStr) => {
      if (textVariables[key]) {
        return textVariables[key](formatStr);
      }
      return match;
    },
  );
};

export const cloneObject = <T>(obj: T) => {
  return JSON.parse(JSON.stringify(obj)) as T;
};

export const createThumb = async (manifestPath: string) => {
  try {
    document.querySelectorAll("link").forEach((link) => {
      link.setAttribute("crossorigin", "anonymous");
    });
    const blob = await toBlob(
      document.getElementById("widget-preview-window")!,
    );
    if (blob) {
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const thumbPath = await path.resolve(manifestPath, "thumb.png");
      await writeFile(thumbPath, buffer);
    }
  } catch (error) {
    console.log(error);
  }
};

export const browseImage = async () => {
  const { path } = await fileOrFolderPicker({
    title: "Select Image",
    extensions: ["png", "jpg", "jpeg", "gif", "svg", "webp"],
    validate: false,
  });
  if (!path) {
    return null;
  }

  const customAssets = useManifestStore.getState().manifest?.customAssets ?? [];
  const existingAsset = customAssets.find((item) => item.path === path);
  if (existingAsset) {
    return existingAsset;
  }
  const key = `${nanoid()}.${path.split(".").at(-1)}`;
  await commands.copyCustomAssets({
    key,
    path,
  });
  const data = {
    key,
    kind: "file",
    path,
    type: "image",
  } as ICustomAssets;
  useManifestStore.getState().updateManifest({
    customAssets: customAssets ? [...customAssets, data] : [data],
  });

  await sendMixpanelEvent("Image picker used", {}).catch(console.error);

  return data;
};
