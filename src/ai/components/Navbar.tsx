import {
  AppItem,
  Hamburger,
  Menu,
  MenuButton,
  MenuItem,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
} from "@fluentui/react-components";
import { Add20Regular, AddRegular, ListRegular } from "@fluentui/react-icons";
import { useChatStore } from "../stores/useChatStore";

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  const {
    chatId,
    chats,
    openDrawer,
    setOpenDrawer,
    models,
    selectedModel,
    changeSelectedModel,
  } = useChatStore();

  return (
    <nav className="navbar">
      <Hamburger appearance="subtle" onClick={() => setOpenDrawer(true)} />

      {selectedModel && (
        <Menu checkedValues={{ model: [selectedModel.id] }}>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton size="small" appearance="subtle">
              {selectedModel.displayName || selectedModel.model}
            </MenuButton>
          </MenuTrigger>

          <MenuPopover>
            <MenuList>
              {models.map((model) => (
                <MenuItemRadio
                  key={model.id}
                  value={model.id}
                  name="model"
                  onClick={() => {
                    changeSelectedModel(model.id);
                  }}>
                  {model.displayName || model.model}
                </MenuItemRadio>
              ))}
              <MenuItem
                icon={<ListRegular />}
                onClick={() =>
                  useChatStore.setState({ settingsScreen: "list" })
                }>
                Show All
              </MenuItem>
              <MenuItem
                icon={<AddRegular />}
                onClick={() =>
                  useChatStore.setState({ settingsScreen: "model" })
                }>
                Add new
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      )}
      <NavDrawer
        selectedValue={chatId ? chatId : ""}
        open={openDrawer}
        onOpenChange={(_, { open }) => setOpenDrawer(open)}>
        <NavDrawerHeader>
          <Hamburger aria-label="Close" onClick={() => setOpenDrawer(false)} />
        </NavDrawerHeader>

        <NavDrawerBody>
          <AppItem
            icon={<Add20Regular />}
            onClick={async () => {
              useChatStore.setState({ chatId: null, initialMessages: [] });
              setOpenDrawer(false);
            }}>
            New Chat
          </AppItem>
          {chats.map((chat) => (
            <NavItem
              key={chat.id}
              value={chat.id}
              onClick={async () => {
                useChatStore.setState({ chatId: chat.id });
                setOpenDrawer(false);
              }}>
              {chat.name}
            </NavItem>
          ))}
        </NavDrawerBody>
      </NavDrawer>
    </nav>
  );
};

export default Navbar;
