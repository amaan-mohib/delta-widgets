import { useEffect, useMemo } from "react";
import { path } from "@tauri-apps/api";
import { appCacheDir } from "@tauri-apps/api/path";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { IWidget } from "../../types/manifest";

const addStyleSheet = async (
  href: string,
  key: string,
  createHref?: boolean
) => {
  if (createHref) {
    await invoke<string>("copy_custom_assets", {
      key,
      path: href,
    });

    href = convertFileSrc(
      await path.resolve(await appCacheDir(), "assets", href)
    );
  }

  const isAlreadyLoaded = document.head.querySelector<HTMLLinkElement>(
    `#${key}`
  );

  if (!isAlreadyLoaded) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.type = "text/css";
    link.id = key;
    link.className = "custom-stylesheet";
    document.head.appendChild(link);
  }
};

const removeExtraStylesheets = (keys: string[]) => {
  const styles = Array.from(
    document.head.querySelectorAll<HTMLLinkElement>(".custom-stylesheet")
  );
  styles.forEach((link) => {
    if (!keys.includes(link.id)) {
      document.head.removeChild(link);
    }
  });
};

export const useCustomAssets = (manifest: IWidget | null) => {
  const links = useMemo(() => manifest?.customAssets || [], [manifest]);

  useEffect(() => {
    links.forEach((item) => {
      if (item.type === "css") {
        if (item.kind === "url") {
          addStyleSheet(item.path, item.key);
        } else {
          addStyleSheet(item.path, item.key, true);
        }
      }
    });
    removeExtraStylesheets(links.map((item) => item.key));
  }, [links]);
};
