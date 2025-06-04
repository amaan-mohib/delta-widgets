import { closestCenter, DndContext } from "@dnd-kit/core";
import "./index.css";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import { makeStyles, Spinner, tokens } from "@fluentui/react-components";
import { getManifestStore, useManifestStore } from "./stores/useManifestStore";
import { useEffect } from "react";
import { nanoid } from "nanoid";
import CreatorToolbar from "./components/Toolbar";
import { useDataTrackStore } from "./stores/useDataTrackStore";
import Properties from "./components/Properties";
import { getManifestFromPath } from "../main/utils/widgets";
import { componentTypeToDataMap } from "./components/Sidebar/ComponentList";

const useStyles = makeStyles({
  toolbar: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
    padding: "0 3px",
    height: "var(--toolbar-height)",
  },
});
interface AppProps {}

const App: React.FC<AppProps> = () => {
  const styles = useStyles();
  const manifestStore = getManifestStore();
  const {
    initialStateLoading,
    incrementInitialStateLoadCounter,
    initialStateLoadCounter,
  } = useDataTrackStore();

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (window.__INITIAL_STATE__) {
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
    const initialManifest = window.__INITIAL_STATE__?.manifest;
    if (initialManifest && manifestStore === null) {
      const manifestPath = initialManifest.path;
      getManifestFromPath(manifestPath).then((manifest) => {
        useManifestStore.setState({
          manifest: { ...manifest, path: manifestPath },
        });
      });
    } else {
      const { key, label } = manifestStore || {};
      if (!key || !label) {
        const newLabel = `Untitled-${nanoid(4)}`;
        const newKey = newLabel.toLowerCase();
        useManifestStore
          .getState()
          .updateManifest({ key: newKey, label: newLabel });
      }
    }
  }, [initialStateLoading]);

  return initialStateLoading ? (
    <main
      className="container"
      style={{ alignItems: "center", justifyContent: "center" }}>
      <Spinner size="huge" />
    </main>
  ) : (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={(e) => {
        useDataTrackStore.setState({
          activeId: String(e.active.id),
          isDragging: true,
          selectedId: null,
        });
      }}
      onDragEnd={(e) => {
        if (e.active.id === "container") {
          useDataTrackStore.setState({ activeId: null, isDragging: false });
          return;
        }

        if (e.over?.id) {
          if (e.active.data.current?.sortable && e.active.id !== e.over.id) {
            useManifestStore
              .getState()
              .moveElement(e.active.id.toString(), e.over.id.toString());
          } else if (!e.over?.id.toString().startsWith("container")) {
            useDataTrackStore.setState({ activeId: null, isDragging: false });
            return;
          } else if (e.active.data.current) {
            const { type } = e.active.data.current as { type: string };
            const element = componentTypeToDataMap[type]
              ? componentTypeToDataMap[type]()
              : null;
            if (element) {
              useManifestStore
                .getState()
                .addElements(element, String(e.over.id));
            }
          }
        }
        useDataTrackStore.setState({ activeId: null, isDragging: false });
      }}>
      <main className="container">
        <div className={styles.toolbar}>
          <CreatorToolbar />
        </div>
        <div className="layout">
          <Sidebar />
          <Canvas />
          <Properties />
        </div>
      </main>
    </DndContext>
  );
};

export default App;
