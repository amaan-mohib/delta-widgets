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
import { useDataStore } from "../../stores/useDataStore";
import { useAddDialogStore } from "../../stores/useAddDialogStore";

interface AddMenuProps {}

const AddMenu: React.FC<AddMenuProps> = () => {
  const { importHTML, importJSON, setDialogState } = useAddDialogStore();
  const createWidget = useDataStore((state) => state.createWidget);

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
            <MenuItem icon={<CodeRegular />} onClick={() => importHTML()}>
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
    </>
  );
};

export default AddMenu;
