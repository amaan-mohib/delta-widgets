import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  createCreatorWindow,
  fileOrFolderPicker,
  getAllWidgets,
} from "./utils/widgets";
import {
  Badge,
  Card,
  Divider,
  makeStyles,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Text,
  Title3,
  Toaster,
  Tooltip,
} from "@fluentui/react-components";
import {
  AddRegular,
  AppsAddInRegular,
  BracesRegular,
  CodeRegular,
  LinkRegular,
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import AddWidgetDialog, { IDialogState } from "./components/AddWidgetDialog";
import WidgetCard from "./components/WidgetCard";
import { IWidget } from "../types/manifest";
import * as autostart from "@tauri-apps/plugin-autostart";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import About from "./components/About";
import { check } from "@tauri-apps/plugin-updater";
import { sendMixpanelEvent, trackInstall } from "./utils/analytics";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexWrap: "wrap",
    padding: "16px 0",
    gap: "16px",
  },
  header: {
    paddingBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "end",
    gap: "10px",
  },
  card: {
    width: "200px",
    minHeight: "130px",
    height: "100%",
  },
});

function App() {
  const styles = useStyles();
  const [widgets, setWidgets] = useState<Record<string, IWidget>>({});
  const [savedWidgets, setSavedWidgets] = useState<Record<string, IWidget>>({});
  const [dialogState, setDialogState] = useState<IDialogState>({
    open: false,
    type: "none",
    path: "",
  });
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const widgetsList = useMemo(
    () =>
      Object.values(widgets).sort((a, b) =>
        a.label > b.label ? 1 : b.label > a.label ? -1 : 0
      ),
    [JSON.stringify(widgets)]
  );
  const savedWidgetsList = useMemo(
    () =>
      Object.values(savedWidgets).sort((a, b) =>
        a.label > b.label ? 1 : b.label > a.label ? -1 : 0
      ),
    [JSON.stringify(savedWidgets)]
  );

  const getAndSetWidgets = useCallback(async () => {
    getAllWidgets().then((widgets) => setWidgets(widgets));
  }, []);

  const getAndSetSavedWidgets = useCallback(async () => {
    getAllWidgets(true).then((widgets) => setSavedWidgets(widgets));
  }, []);

  const updateAllWidgets = useCallback(() => {
    getAndSetWidgets();
    getAndSetSavedWidgets();
  }, []);

  const checkForUpdates = useCallback(async () => {
    const update = await check();
    setUpdateAvailable(!!update);
  }, []);

  useEffect(() => {
    updateAllWidgets();
    checkForUpdates();
    trackInstall();
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

  const importHTML = useCallback(async () => {
    const { path } = await fileOrFolderPicker({
      directory: true,
      title: "Select HTML folder",
    });
    if (path) setDialogState({ open: true, type: "folder", path });
  }, []);

  const importJSON = useCallback(async () => {
    const { path, manifest } = await fileOrFolderPicker({
      title: "Select JSON file",
      extensions: ["json"],
    });
    if (path && manifest)
      setDialogState({
        open: true,
        type: "file",
        path,
        manifest,
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

  return (
    <main className="container">
      <header className={styles.header}>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton appearance="primary" icon={<AddRegular />}>
              Add
            </MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem icon={<CodeRegular />} onClick={importHTML}>
                HTML
              </MenuItem>
              <MenuItem
                icon={<LinkRegular />}
                onClick={() => {
                  setDialogState({ open: true, type: "url", path: "" });
                }}>
                URL
              </MenuItem>
              <MenuItem icon={<BracesRegular />} onClick={importJSON}>
                Import JSON
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton
              appearance="subtle"
              icon={<MoreHorizontal20Regular />}
            />
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem onClick={toggleAutostart}>
                {`${autostartEnabled ? "Disable" : "Enable"} autostart`}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAboutOpen(true);
                }}>
                About
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        {updateAvailable && (
          <Tooltip content="Update available" relationship="label">
            <Badge
              color="warning"
              onClick={() => {
                setAboutOpen(true);
              }}>
              !
            </Badge>
          </Tooltip>
        )}
      </header>
      <About open={aboutOpen} setOpen={setAboutOpen} />
      <Title3>Installed</Title3>
      <div className={styles.container} role="list">
        {widgetsList.map((widget) => {
          return (
            <WidgetCard
              key={widget.key}
              widget={widget}
              cardStyle={styles.card}
              updateAllWidgets={updateAllWidgets}
            />
          );
        })}
        <Card
          className={styles.card}
          style={{ justifyContent: "center" }}
          onClick={async () => {
            sendMixpanelEvent("created_new", {}).catch(console.error);
            await createCreatorWindow();
            updateAllWidgets();
          }}>
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
            <Text weight="semibold">Create new</Text>
          </div>
        </Card>
      </div>

      {savedWidgetsList.length > 0 ? (
        <>
          <Divider style={{ marginBottom: "16px" }} />
          <Title3>Drafts</Title3>
          <div className={styles.container} role="list">
            {savedWidgetsList.map((widget) => {
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
        </>
      ) : null}

      <AddWidgetDialog
        dialogState={dialogState}
        resetDialogState={setDialogState}
        updateAllWidgets={updateAllWidgets}
      />

      <Toaster toasterId={"toaster"} />
    </main>
  );
}

export default App;
