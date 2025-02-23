import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  duplicateWidget,
  fileOrFolderPicker,
  getAllWidgets,
  IWidget,
  removeWidget,
  watchWidgetFolder,
} from "./utils/widgets";
import {
  Card,
  CardFooter,
  CardHeader,
  makeStyles,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Switch,
  Text,
} from "@fluentui/react-components";
import {
  AddRegular,
  AppsAddInRegular,
  BracesRegular,
  CodeRegular,
  CopyRegular,
  DeleteRegular,
  LinkRegular,
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import { UnwatchFn } from "@tauri-apps/plugin-fs";
import AddWidgetDialog, { IDialogState } from "./components/AddWidgetDialog";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexWrap: "wrap",
    padding: "16px",
    gap: "16px",
  },
  header: {
    padding: "16px",
    paddingBottom: "0px",
    display: "flex",
    alignItems: "center",
    justifyContent: "end",
  },
  card: {
    width: "200px",
    minHeight: "130px",
    height: "100%",
  },
  cardFooter: {
    marginTop: "auto",
  },
  switch: {
    marginLeft: "0px",
  },
});

function App() {
  const styles = useStyles();
  const [widgets, setWidgets] = useState<Record<string, IWidget>>({});
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

  useEffect(() => {
    getAndSetWidgets();
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
      <div className={styles.container} role="list">
        {widgetsList.map((widget) => {
          return (
            <Card role="listitem" key={widget.key} className={styles.card}>
              <CardHeader
                action={
                  <Menu positioning={"below-end"}>
                    <MenuTrigger disableButtonEnhancement>
                      <MenuButton
                        size="small"
                        appearance="transparent"
                        icon={<MoreHorizontal20Regular />}
                      />
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        <MenuItem
                          icon={<CopyRegular />}
                          onClick={() => {
                            duplicateWidget(widget).catch(console.log);
                          }}>
                          Duplicate
                        </MenuItem>
                        <MenuItem
                          icon={<DeleteRegular />}
                          onClick={() => removeWidget(widget.path)}>
                          Remove
                        </MenuItem>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                }
                header={<Text weight="semibold">{widget.label}</Text>}
              />
              {widget.description && <p>{widget.description}</p>}
              <CardFooter className={styles.cardFooter}>
                <Switch
                  className={styles.switch}
                  label={widget.visible ? "Enabled" : "Disabled"}
                  style={{ margin: 0 }}
                  defaultChecked={widget.visible}
                  indicator={{ className: styles.switch }}
                />
              </CardFooter>
            </Card>
          );
        })}
        <Card
          className={styles.card}
          style={{ justifyContent: "center" }}
          onClick={() => {}}>
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
        <AddWidgetDialog
          dialogState={dialogState}
          resetDialogState={setDialogState}
          onClose={() => {}}
        />
      </div>
    </main>
  );
}

export default App;
