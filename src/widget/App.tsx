import React, { useEffect, useMemo, useState } from "react";
import { useDataTrackStore } from "./stores/useDataTrackStore";
import { getManifestFromPath } from "../main/utils/widgets";
import Element from "./components/Element";
import useFetcher from "./useFetcher";
import useVariableUpdater from "./useVariableUpdater";
import FontPicker from "react-fontpicker-ts";
import { useCustomAssets } from "../creator/hooks/useCustomAssets";

import "./index.css";
import { createThumb } from "./utils/utils";
import { listen } from "@tauri-apps/api/event";
import { templateWidgets } from "../common";

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const {
    initialStateLoading,
    incrementInitialStateLoadCounter,
    initialStateLoadCounter,
    manifest,
    fontsToLoad,
  } = useDataTrackStore();
  const [key, setKey] = useState(0);

  const { elements, customFields } = useMemo(
    () => ({
      elements: manifest?.elements || [],
      customFields: manifest?.customFields || {},
    }),
    [manifest]
  );

  useFetcher(elements, customFields);
  useVariableUpdater();
  useCustomAssets(manifest);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (window.__INITIAL_WIDGET_STATE__) {
        useDataTrackStore.setState({ initialStateLoading: false });
      } else {
        incrementInitialStateLoadCounter();
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [initialStateLoadCounter]);

  const initManifest = (update?: boolean) => {
    const manifestPath = window.__INITIAL_WIDGET_STATE__?.manifestPath;
    if (manifestPath && (update || manifest === null)) {
      getManifestFromPath(manifestPath).then((manifest) => {
        useDataTrackStore.setState({
          manifest: { ...manifest, path: manifestPath },
        });
        setKey((prev) => prev + 1);
      });
    }
  };

  useEffect(() => {
    if (initialStateLoading) return;
    initManifest();
  }, [initialStateLoading]);

  useEffect(() => {
    const unsub = listen("update-manifest", () => {
      initManifest(true);
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
      }
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

  if (initialStateLoading || !manifest) return null;

  return (
    <div
      key={key}
      id="widget-window"
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
      }}>
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
