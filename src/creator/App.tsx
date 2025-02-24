import { DndContext } from "@dnd-kit/core";
import "./index.css";
import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import { makeStyles, tokens } from "@fluentui/react-components";
import { useManifestStore } from "./stores/useManifestStore";
import { useEffect } from "react";
import { nanoid } from "nanoid";
import CreatorToolbar from "./components/Toolbar";

const useStyles = makeStyles({
  toolbar: {
    borderBottom: `1px solid ${tokens.colorNeutralBackground1}`,
    padding: "0 3px",
  },
});
interface AppProps {}

const App: React.FC<AppProps> = () => {
  const styles = useStyles();
  const manifestStore = useManifestStore();

  useEffect(() => {
    const initialManifest = window.__INITIAL_STATE__?.manifest;
    if (initialManifest) {
      useManifestStore.setState(initialManifest);
    } else {
      const { key, label } = manifestStore;
      if (!key || !label) {
        const newLabel = `Untitled-${nanoid(4)}`;
        const newKey = newLabel.toLowerCase();
        useManifestStore.setState({ key: newKey, label: newLabel });
      }
    }
  }, []);

  return (
    <DndContext>
      <main className="container">
        <div className={styles.toolbar}>
          <CreatorToolbar />
        </div>
        <div className="layout">
          <Sidebar />
          <Canvas />
          {/* <Sidebar /> */}
        </div>
      </main>
    </DndContext>
  );
};

export default App;
