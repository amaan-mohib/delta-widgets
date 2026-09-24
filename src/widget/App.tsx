import React, { useEffect, useMemo, useState } from "react";
import { useDataTrackStore } from "./stores/useDataTrackStore";
import { disableWindowDrag, enableWindowDrag } from "../main/utils/widgets";
import Element from "./components/Element";
import useFetcher from "./useFetcher";
import useVariableUpdater from "./useVariableUpdater";
import FontPicker from "react-fontpicker-ts";
import { useCustomAssets } from "../creator/hooks/useCustomAssets";
import { createThumb } from "./utils/utils";
import { listen } from "@tauri-apps/api/event";
import { getManifestFromPath, templateWidgets } from "../common";
import Toolbar from "./components/Toolbar";
import { Spinner, tokens } from "@fluentui/react-components";

import "./index.css";

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const { initialStateLoading, manifest, fontsToLoad } = useDataTrackStore();
  const [key, setKey] = useState(0);

  const { elements, customFields } = useMemo(
    () => ({
      elements: manifest?.elements || [],
      customFields: manifest?.customFields || {},
    }),
    [manifest],
  );

  useFetcher(elements, customFields);
  useVariableUpdater();
  useCustomAssets(manifest);

  const initManifest = () => {
    useDataTrackStore.setState({ initialStateLoading: true });
    const searchParams = new URLSearchParams(window.location.search);
    const manifestPath = searchParams.get("manifestPath");
    if (!manifestPath) return;

    getManifestFromPath(manifestPath)
      .then((manifest) => {
        useDataTrackStore.setState({
          manifest: { ...manifest, path: manifestPath },
          initialStateLoading: false,
          isPreview: searchParams.get("isPreview") === "true",
        });
        setKey((prev) => prev + 1);
      })
      .catch((error) => {
        console.error(error);
        useDataTrackStore.setState({ initialStateLoading: false });
      });
  };

  useEffect(() => {
    initManifest();
  }, []);

  useEffect(() => {
    const unsub = listen("update-manifest", () => {
      initManifest();
    });

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  useEffect(() => {
    if (!manifest?.published) {
      return;
    }
    const unsub = listen<{ key: string }>(
      "update-thumb",
      ({ payload: { key } }) => {
        if (!manifest) return;
        if (key === manifest.key) {
          createThumb(manifest, true).catch(console.error);
        }
      },
    );

    return () => {
      unsub.then((f) => f());
    };
  }, [manifest]);

  useEffect(() => {
    if (
      initialStateLoading ||
      !manifest ||
      !manifest.published ||
      manifest.key in templateWidgets
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      createThumb(manifest).catch(console.error);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [initialStateLoading, manifest]);

  useEffect(() => {
    if (!manifest) {
      return;
    }
    if (manifest.pinned) {
      disableWindowDrag();
    } else {
      enableWindowDrag();
    }
  }, [manifest]);

  if (initialStateLoading) {
    return (
      <div
        id="widget-window-loading"
        style={{
          width: "100%",
          height: "100vh",
          display: "grid",
          placeItems: "center",
          background: tokens.colorNeutralBackgroundAlpha,
          borderRadius: 10,
        }}>
        <Spinner />
      </div>
    );
  }

  if (!manifest) return null;

  return (
    <div
      key={key}
      id="widget-window"
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
      }}>
      {manifest.published && <Toolbar />}
      {fontsToLoad.length > 0 && (
        <FontPicker loadFonts={fontsToLoad} loaderOnly />
      )}
      {elements &&
        elements.map((element) => (
          <Element key={element.id} component={element} />
        ))}
    </div>
  );
};

export default App;
