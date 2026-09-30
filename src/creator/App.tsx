import Sidebar from "./components/Sidebar";
import Canvas from "./components/Canvas";
import { makeStyles, Spinner, tokens } from "@fluentui/react-components";
import { getManifestStore, useManifestStore } from "./stores/useManifestStore";
import { useEffect } from "react";
import CreatorToolbar from "./components/Toolbar";
import { useDataTrackStore } from "./stores/useDataTrackStore";
import Properties from "./components/Properties";
import DnDWrapper from "./components/DnD/DnDWrapper";
import { useCustomAssets } from "./hooks/useCustomAssets";
import { getManifestFromPath } from "../common";
import "./index.css";

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
  const initialStateLoading = useDataTrackStore((s) => s.initialStateLoading);

  useCustomAssets(manifestStore);

  useEffect(() => {
    useDataTrackStore.setState({ initialStateLoading: true });
    const searchParams = new URLSearchParams(window.location.search);
    const manifestPath = searchParams.get("manifestPath");
    if (!manifestPath) return;

    getManifestFromPath(manifestPath)
      .then((manifest) => {
        useManifestStore.setState({
          manifest: { ...manifest, path: manifestPath },
        });
        useDataTrackStore.setState({ initialStateLoading: false });
      })
      .catch((error) => {
        console.error(error);
        useDataTrackStore.setState({ initialStateLoading: false });
      });
  }, []);

  return initialStateLoading ? (
    <main
      className="container"
      style={{ alignItems: "center", justifyContent: "center" }}>
      <Spinner size="huge" />
    </main>
  ) : (
    <DnDWrapper>
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
    </DnDWrapper>
  );
};

export default App;
