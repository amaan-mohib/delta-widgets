import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  createCreatorWindow,
  fileOrFolderPicker,
  getAllWidgets,
  IWidget,
  watchWidgetFolder,
} from "./utils/widgets";
import {
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
} from "@fluentui/react-components";
import {
  AddRegular,
  AppsAddInRegular,
  BracesRegular,
  CodeRegular,
  LinkRegular,
} from "@fluentui/react-icons";
import { UnwatchFn } from "@tauri-apps/plugin-fs";
import AddWidgetDialog, { IDialogState } from "./components/AddWidgetDialog";
import WidgetCard from "./components/WidgetCard";

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

  const getAndSetWidgets = useCallback(() => {
    getAllWidgets().then((widgets) => {
      setWidgets(widgets);
    });
  }, []);
  useEffect(() => {
    let unwatch: UnwatchFn | null;
    (async () => {
      try {
        unwatch = await watchWidgetFolder(() => {
          getAndSetWidgets();
        });
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      unwatch && unwatch();
    };
  }, []);

  const getAndSetSavedWidgets = useCallback(() => {
    getAllWidgets(true).then((widgets) => {
      setSavedWidgets(widgets);
    });
  }, []);
  useEffect(() => {
    let unwatch: UnwatchFn | null;
    (async () => {
      try {
        unwatch = await watchWidgetFolder(() => {
          getAndSetSavedWidgets();
        }, true);
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      unwatch && unwatch();
    };
  }, []);

  useEffect(() => {
    getAndSetWidgets();
    getAndSetSavedWidgets();
    // let unsub: UnlistenFn;
    // (async () => {
    //   unsub = await listen("media_updated", () => {
    //     console.log("media updated");
    //   });
    // })();
    // return () => {
    //   unsub && unsub();
    // };
  }, []);

  // async function greet() {
  //   // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
  //   setGreetMsg(await invoke("greet", { name }));
  //   const data: any = await invoke("get_media").catch(console.log);
  //   console.log(data);
  //   // setImage(
  //   //   `data:image/png;base64,${Buffer.from(data.thumbnail).toString("base64")}`
  //   // );
  //   await invoke("media_action", {
  //     playerId: data[0].player_id,
  //     action: "position",
  //     position: 10000,
  //   }).catch(console.log);
  // }

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
              <MenuItem
                icon={<CodeRegular />}
                onClick={async () => {
                  const { path } = await fileOrFolderPicker(
                    true,
                    "Select HTML folder"
                  );
                  if (path)
                    setDialogState({ open: true, type: "folder", path });
                  console.log(path);
                }}>
                HTML
              </MenuItem>
              <MenuItem
                icon={<LinkRegular />}
                onClick={() => {
                  setDialogState({ open: true, type: "url", path: "" });
                }}>
                URL
              </MenuItem>
              <MenuItem
                icon={<BracesRegular />}
                onClick={async () => {
                  const { path, manifest } = await fileOrFolderPicker(
                    false,
                    "Select JSON file",
                    ["json"]
                  );
                  if (path && manifest)
                    setDialogState({
                      open: true,
                      type: "file",
                      path,
                      manifest,
                    });
                  console.log(path);
                }}>
                Import JSON
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </header>

      <Title3>Installed</Title3>
      <div className={styles.container} role="list">
        {widgetsList.map((widget) => {
          return <WidgetCard widget={widget} cardStyle={styles.card} />;
        })}
        <Card
          className={styles.card}
          style={{ justifyContent: "center" }}
          onClick={async () => {
            await createCreatorWindow();
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
                <WidgetCard widget={widget} cardStyle={styles.card} saves />
              );
            })}
          </div>
        </>
      ) : null}

      <AddWidgetDialog
        dialogState={dialogState}
        resetDialogState={setDialogState}
        onClose={() => {}}
      />
    </main>
  );
}

export default App;
