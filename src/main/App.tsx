import { useEffect, useState } from "react";
import "./App.css";
import {
  Card,
  makeStyles,
  Spinner,
  Text,
  Toaster,
  tokens,
} from "@fluentui/react-components";
import { AppsAddInRegular } from "@fluentui/react-icons";
import WidgetCard from "./components/WidgetCard";
import { listen } from "@tauri-apps/api/event";
import { trackInstall, trackUpdated } from "./utils/analytics";
import Sidebar, { sidebarWidth } from "./components/Sidebar";
import { useDataStore } from "./stores/useDataStore";
import SettingsSidebar from "./components/Settings/Sidebar";
import Settings from "./components/Settings";

const useStyles = makeStyles({
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, 200px)",
    padding: "16px",
    gap: "16px",
    paddingLeft: `${sidebarWidth + 16}px`,
    width: "100%",
  },
  container2: {
    padding: "16px",
    paddingLeft: `${sidebarWidth + 16}px`,
    width: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "end",
    gap: "5px",
  },
  card: {
    minHeight: "130px",
    height: "100%",
  },
});

function App() {
  const styles = useStyles();
  const {
    installedWidgets,
    draftWidgets,
    createWidget,
    updateAllWidgets,
    activeTab,
    loading,
    showSettings,
  } = useDataStore();
  const [key, setKey] = useState(0);

  useEffect(() => {
    updateAllWidgets();
    trackInstall();
    trackUpdated();
  }, []);

  useEffect(() => {
    const unsub = listen<string>("creator-close", () => {
      updateAllWidgets().then(() => {
        setKey((prev) => prev + 1);
      });
    });

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  const createNew = (
    <Card
      className={styles.card}
      style={{ justifyContent: "center" }}
      onClick={createWidget}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "3px",
        }}>
        <AppsAddInRegular fontSize="32px" />
        <Text weight="semibold">Create new widget</Text>
        <Text
          align="center"
          size={200}
          style={{ marginTop: 5, color: tokens.colorNeutralForeground2 }}>
          Build a custom widget for your desktop
        </Text>
      </div>
    </Card>
  );

  return (
    <main className="container">
      {showSettings ? <SettingsSidebar /> : <Sidebar />}

      <div style={{ flex: 1 }}>
        {loading ? (
          <div className={styles.container} role="list">
            <Spinner />
          </div>
        ) : showSettings ? (
          <div className={styles.container2}>
            <Settings />
          </div>
        ) : (
          <div className={styles.container} role="list" key={key}>
            {activeTab === "installed" && (
              <>
                {installedWidgets.map((widget) => {
                  return (
                    <WidgetCard
                      key={widget.key}
                      widget={widget}
                      cardStyle={styles.card}
                      updateAllWidgets={updateAllWidgets}
                    />
                  );
                })}
                {createNew}
              </>
            )}
            {activeTab === "drafts" && (
              <>
                {draftWidgets.length === 0 && createNew}
                {draftWidgets.map((widget) => {
                  return (
                    <WidgetCard
                      key={widget.key}
                      widget={widget}
                      cardStyle={styles.card}
                      saves
                      updateAllWidgets={updateAllWidgets}
                    />
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      <Toaster toasterId={"toaster"} />
    </main>
  );
}

export default App;
