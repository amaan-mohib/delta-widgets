import { useEffect, useState } from "react";
import {
  Button,
  Card,
  makeStyles,
  Spinner,
  Text,
  Toaster,
  tokens,
} from "@fluentui/react-components";
import { AppsAddInRegular, Open16Regular } from "@fluentui/react-icons";
import WidgetCard from "./components/WidgetCard";
import { listen } from "@tauri-apps/api/event";
import { trackInstall, trackUpdated } from "./utils/analytics";
import Sidebar, { sidebarWidth } from "./components/Sidebar";
import { useDataStore } from "./stores/useDataStore";
import SettingsSidebar from "./components/Settings/Sidebar";
import Settings from "./components/Settings";
import "./App.css";

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
          <>
            {activeTab === "installed" && (
              <div className={styles.container} role="list" key={key}>
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
              </div>
            )}
            {activeTab === "drafts" && (
              <div className={styles.container} role="list" key={key}>
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
              </div>
            )}
            <div className={styles.container2}>
              {activeTab === "marketplace" && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <Text size={500} weight="semibold">
                    Template Marketplace Coming Soon!
                  </Text>
                  <Text>
                    We're building a community marketplace where widget creators
                    can share, buy, and sell custom templates. This waitlist
                    helps us gauge interest and prioritize development.
                  </Text>
                  <Text size={200}>
                    Join the waitlist to be among the first to create and
                    monetize your widget templates.
                  </Text>
                  <Button
                    style={{ width: "fit-content" }}
                    appearance="primary"
                    as="a"
                    href="https://forms.gle/Y7ni54Eknp599nG6A"
                    target="_blank"
                    icon={<Open16Regular />}
                    iconPosition="after">
                    Join Marketplace Waitlist
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Toaster toasterId={"toaster"} />
    </main>
  );
}

export default App;
