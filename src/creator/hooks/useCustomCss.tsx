import { useEffect } from "react";
import { useManifestStore } from "../stores/useManifestStore";
import { useShallow } from "zustand/shallow";

export const useCustomCss = () => {
  const links =
    useManifestStore(useShallow((state) => state.manifest?.css)) || [];

  useEffect(() => {
    const addedLinks: HTMLLinkElement[] = [];

    links.forEach((href) => {
      console.log({ href });

      const isAlreadyLoaded = Array.from(
        document.head.querySelectorAll<HTMLLinkElement>(
          'link[rel="stylesheet"]'
        )
      ).some((link) => link.href === href);

      if (!isAlreadyLoaded) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.type = "text/css";
        document.head.appendChild(link);
        addedLinks.push(link);
      }
    });

    // Cleanup only links that this effect added
    return () => {
      addedLinks.forEach((link) => {
        document.head.removeChild(link);
      });
    };
  }, [links]);
};
