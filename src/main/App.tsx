import { useCallback, useEffect, useState } from "react";
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
import * as autostart from "@tauri-apps/plugin-autostart";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import About from "./components/About";
import { trackInstall, trackUpdated } from "./utils/analytics";
import Theme from "./theme/Theme";
import Sidebar, { sidebarWidth } from "./components/Sidebar";
import { useDataStore } from "./stores/useDataStore";

const useStyles = makeStyles({
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
    padding: "16px",
    gap: "16px",
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
    backgroundColor: `color-mix(in srgb,${tokens.colorNeutralBackground1},transparent 45%)`,
    ":hover": {
      backgroundColor: `color-mix(in srgb,${tokens.colorNeutralBackground1Hover},transparent 25%)`,
    },
  },
});

function App() {
  const styles = useStyles();
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const [themeOpen, setThemeOpen] = useState(false);
  const {
    installedWidgets,
    draftWidgets,
    createWidget,
    updateAllWidgets,
    activeTab,
    loading,
  } = useDataStore();

  useEffect(() => {
    updateAllWidgets();
    trackInstall();
    trackUpdated();
  }, []);

  useEffect(() => {
    let unsub: UnlistenFn;
    (async () => {
      unsub = await listen<string>("creator-close", () => {
        updateAllWidgets();
      });
    })();
    return () => {
      unsub && unsub();
    };
  }, []);

  useEffect(() => {
    autostart.isEnabled().then((enabled) => {
      setAutostartEnabled(enabled);
    });
  }, []);

  const toggleAutostart = useCallback(async () => {
    if (autostartEnabled) {
      await autostart.disable();
    } else {
      await autostart.enable();
    }
    await invoke("write_to_store_cmd", {
      key: "autostart",
      value: !autostartEnabled,
    });
    setAutostartEnabled((prev) => !prev);
  }, [autostartEnabled]);

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
      <Sidebar />

      {/* <header className={styles.header}>

        <Button
          as="a"
          href="https://buymeacoffee.com/amaan.mohib"
          target="_blank"
          appearance="subtle"
          icon={<HeartColor />}>
          Donate
        </Button>
        <Tooltip content="Help / Documentation" relationship="label">
          <Button
            as="a"
            href="https://amaan-mohib.github.io/delta-widgets/"
            target="_blank"
            icon={<QuestionCircleColor />}
            appearance="subtle"
          />
        </Tooltip>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton
              appearance="subtle"
              icon={<MoreHorizontal20Regular />}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem
                onClick={() => {
                  setThemeOpen(true);
                }}>
                Theme
              </MenuItem>
              <MenuItem onClick={toggleAutostart}>
                {`${autostartEnabled ? "Disable" : "Enable"} autostart`}
              </MenuItem>
              <MenuItemLink
                href="https://github.com/amaan-mohib/delta-widgets/issues"
                target="_blank">
                Report an issue
              </MenuItemLink>
              <MenuItem
                onClick={() => {
                  setAboutOpen(true);
                }}>
                About
              </MenuItem>
            </MenuList>
            {import.meta.env.MODE === "development" && (
              <>
                <MenuItem
                  onClick={() => {
                    invoke("migrate", { direction: "up" });
                  }}>
                  Migrate Up
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    invoke("migrate", { direction: "down" });
                  }}>
                  Migrate Down
                </MenuItem>
              </>
            )}
          </MenuPopover>
        </Menu>
        {updateAvailable && (
          <Tooltip content="Update available" relationship="label">
            <Button
              appearance="subtle"
              onClick={() => {
                setAboutOpen(true);
              }}
              icon={<ErrorCircleColor />}
            />
          </Tooltip>
        )}
      </header> */}
      <About open={aboutOpen} setOpen={setAboutOpen} />
      <Theme open={themeOpen} setOpen={setThemeOpen} />
      <div style={{ flex: 1 }}>
        {loading ? (
          <div className={styles.container} role="list">
            <Spinner />
          </div>
        ) : (
          <div className={styles.container} role="list">
            {activeTab === "installed" && (
              <>
                {createNew}
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
              </>
            )}
            {activeTab === "drafts" && (
              <>
                {draftWidgets.length === 0 && (
                  <div style={{ width: 200 }}>{createNew}</div>
                )}
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
