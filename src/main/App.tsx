import { useEffect, useRef, useState } from "react";
import {
  Card,
  makeStyles,
  Skeleton,
  SkeletonItem,
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
import "./App.css";
import AddWidgetDialog from "./components/AddWidgetDialog";
import WhatsNew from "./components/WhatsNew";
import { useAddDialogStore } from "./stores/useAddDialogStore";

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
    height: "100vh",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "end",
    gap: "5px",
  },
  card: {
    minHeight: "180px",
    height: "100%",
  },
});

function App() {
  const styles = useStyles();
  const {
    installedWidgets,
    draftWidgets,
    updateAllWidgets,
    activeTab,
    loading,
    showSettings,
  } = useDataStore();
  const [key, setKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusWidget, setFocusWidget] = useState<string | null>(null);

  useEffect(() => {
    updateAllWidgets();
    trackInstall();
    trackUpdated();
  }, []);

  useEffect(() => {
    const unsub = listen<string>("creator-close", () => {
      if (containerRef.current) {
        containerRef.current.style.minHeight = `${containerRef.current.clientHeight}px`;
      }
      const scrollY = window.scrollY;
      updateAllWidgets().then(() => {
        setKey((prev) => prev + 1);
        setTimeout(() => {
          window.scrollTo({ top: scrollY });
        }, 500);
      });
    });

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  useEffect(() => {
    const unsub = listen<string>("focus-widget", ({ payload }) => {
      useDataStore.setState({ activeTab: "installed" });
      setFocusWidget(payload);
      setTimeout(() => {
        setFocusWidget(null);
      }, 3000);
    });

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  const createNew = (
    <Card
      className={styles.card}
      style={{ justifyContent: "center" }}
      onClick={() => useAddDialogStore.setState({ openCreateMenu: true })}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "3px",
          minHeight: 150,
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
    <main className="container" style={{ position: "relative" }}>
      {showSettings ? <SettingsSidebar /> : <Sidebar />}

      <div style={{ flex: 1, minHeight: "100vh" }} ref={containerRef}>
        {loading ? (
          <div className={styles.container} role="list">
            {Array(9)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i}>
                  <SkeletonItem className={styles.card} />
                </Skeleton>
              ))}
          </div>
        ) : showSettings ? (
          <div className={styles.container2}>
            <Settings />
          </div>
        ) : (
          <>
            {activeTab === "installed" && (
              <div className={styles.container} role="list" key={key}>
                {installedWidgets.map((widget) => {
                  return (
                    <WidgetCard
                      key={widget.key}
                      widget={widget}
                      cardStyle={styles.card}
                      focusWidget={focusWidget}
                    />
                  );
                })}
                {createNew}
              </div>
            )}
            {activeTab === "drafts" && (
              <div className={styles.container} role="list" key={key}>
                {draftWidgets.map((widget) => {
                  return (
                    <WidgetCard
                      key={widget.key}
                      widget={widget}
                      cardStyle={styles.card}
                      saves
                    />
                  );
                })}
                {createNew}
              </div>
            )}
          </>
        )}
      </div>

      <AddWidgetDialog />
      <WhatsNew />
      <Toaster toasterId={"toaster"} />
    </main>
  );
}

export default App;
