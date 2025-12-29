import React, { useEffect, useState } from "react";
import { IWidget } from "../../types/manifest";
import {
  AppsColor,
  DocumentColor,
  DocumentEditColor,
  LinkColor,
} from "@fluentui/react-icons";
import { Caption1, makeStyles, tokens } from "@fluentui/react-components";
import { path } from "@tauri-apps/api";
import { exists } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";

export const templateWidgets: Record<string, string> = {
  battery: "templates/battery/thumb.png",
  system: "templates/cpu/thumb.png",
  datetime: "templates/datetime/thumb.png",
  disk: "templates/disks/thumb.png",
  media: "templates/media/thumb.png",
  ram: "templates/ram/thumb.png",
  weather: "templates/weather/thumb.png",
};

interface WidgetPreviewProps {
  widget: IWidget;
  isDraft?: boolean;
}

const useStyles = makeStyles({
  container: {
    display: "flex !important",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "10px",
  },
  url: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    alignItems: "center",
    color: tokens.colorNeutralForeground2,
    width: "fit-content",
    padding: "10px 20px",
    borderRadius: "10px",
    minWidth: "100px",
  },
  urlText: {
    maxWidth: "120px",
    textOverflow: "ellipsis",
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
});

const checkThumbnailExists = async (manifestPath: string) => {
  let thumbPath = "";
  if (manifestPath.endsWith("manifest.json")) {
    thumbPath = await path.resolve(manifestPath, "..", "thumb.png");
  } else {
    thumbPath = await path.resolve(manifestPath, "thumb.png");
  }
  if (await exists(thumbPath)) {
    return convertFileSrc(thumbPath);
  }
  return "";
};

const WidgetPreview: React.FC<WidgetPreviewProps> = ({ widget, isDraft }) => {
  const { key, label, path, widgetType, url, file } = widget;
  const [thumbPath, setThumbPath] = useState("");
  const styles = useStyles();

  useEffect(() => {
    if (widgetType !== "json") return;

    if (key in templateWidgets) {
      setThumbPath(templateWidgets[key]);
      return;
    }

    checkThumbnailExists(path)
      .then((thumbPath) => {
        setThumbPath(thumbPath);
      })
      .catch(console.error);
  }, [path, widgetType]);

  if (widgetType === "url") {
    const location = new URL(url || "");
    return (
      <div className={styles.container}>
        <div className={styles.url}>
          <LinkColor fontSize={48} />
          <Caption1 className={styles.urlText}>{location.hostname}</Caption1>
        </div>
      </div>
    );
  }

  if (widgetType === "html") {
    return (
      <div className={styles.container}>
        <div className={styles.url}>
          <DocumentColor fontSize={48} />
          <Caption1 className={styles.urlText}>
            {(file || "").split(/\/|\\/).at(-1) || ""}
          </Caption1>
        </div>
      </div>
    );
  }

  if (key in templateWidgets) {
  }

  if (thumbPath) {
    return (
      <img
        style={{ padding: 10, maxHeight: 150, objectFit: "contain" }}
        src={thumbPath}
        alt={label}
      />
    );
  }

  return (
    <div className={styles.container}>
      {isDraft ? (
        <DocumentEditColor fontSize={48} />
      ) : (
        <AppsColor fontSize={48} />
      )}
    </div>
  );
};

export default WidgetPreview;
