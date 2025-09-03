import React, { useEffect, useMemo } from "react";
import { useDataTrackStore } from "./stores/useDataTrackStore";
import { getManifestFromPath } from "../main/utils/widgets";
import Element from "./components/Element";
import useFetcher from "./useFetcher";
import useVariableUpdater from "./useVariableUpdater";
import FontPicker from "react-fontpicker-ts";
import { useCustomAssets } from "../creator/hooks/useCustomAssets";

import "./index.css";

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const {
    initialStateLoading,
    incrementInitialStateLoadCounter,
    initialStateLoadCounter,
    manifest,
    fontsToLoad,
  } = useDataTrackStore();

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

  useEffect(() => {
    if (initialStateLoading) return;
    const manifestPath = window.__INITIAL_WIDGET_STATE__?.manifestPath;
    if (manifestPath && manifest === null) {
      getManifestFromPath(manifestPath).then((manifest) => {
        useDataTrackStore.setState({
          manifest: { ...manifest, path: manifestPath },
        });
      });
    }
  }, [initialStateLoading]);

  if (initialStateLoading || !manifest) return null;

  return (
    <div
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
