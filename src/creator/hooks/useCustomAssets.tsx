import { useEffect } from "react";
import { useManifestStore } from "../stores/useManifestStore";
import { useShallow } from "zustand/shallow";
import { path } from "@tauri-apps/api";
import { appCacheDir } from "@tauri-apps/api/path";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";

const addStyleSheet = async (href: string, createHref?: string) => {
  const isAlreadyLoaded = Array.from(
    document.head.querySelectorAll<HTMLLinkElement>(".custom-stylesheet")
  ).some((link) => link.href === href);

  const id = href;

  if (createHref) {
    await invoke<string>("copy_custom_assets", {
      key: href,
      path: createHref,
    });

    href = convertFileSrc(
      await path.resolve(await appCacheDir(), "assets", href)
    );
  }

  if (!isAlreadyLoaded) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.type = "text/css";
    link.id = id;
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

export const useCustomAssets = () => {
  const links =
    useManifestStore(useShallow((state) => state.manifest?.customAssets)) || [];

  useEffect(() => {
    links.forEach((item) => {
      if (item.type === "css") {
        if (item.kind === "url") {
          addStyleSheet(item.path);
        } else {
          addStyleSheet(item.key, item.path);
        }
      }
    });
    removeExtraStylesheets(
      links.map((item) => (item.kind === "url" ? item.path : item.key))
    );
  }, [links]);
};
