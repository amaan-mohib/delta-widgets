import {
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from "@fluentui/react-components";
import {
  AppsAddInRegular,
  AppsRegular,
  BracesRegular,
  CodeRegular,
  LinkRegular,
} from "@fluentui/react-icons";
import React, { useCallback, useState } from "react";
import { fileOrFolderPicker } from "../../utils/widgets";
import AddWidgetDialog, { IDialogState } from "../AddWidgetDialog";
import { useDataStore } from "../../stores/useDataStore";

interface AddMenuProps {}

const AddMenu: React.FC<AddMenuProps> = () => {
  const [dialogState, setDialogState] = useState<IDialogState>({
    open: false,
    type: "none",
    path: "",
  });
  const updateAllWidgets = useDataStore((state) => state.updateAllWidgets);
  const createWidget = useDataStore((state) => state.createWidget);

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

  return (
    <>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton appearance="primary" icon={<AppsAddInRegular />}>
            Create
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem icon={<AppsRegular />} onClick={createWidget}>
              Custom
            </MenuItem>
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
      <AddWidgetDialog
        dialogState={dialogState}
        resetDialogState={setDialogState}
        updateAllWidgets={updateAllWidgets}
      />
    </>
  );
};

export default AddMenu;
