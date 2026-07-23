import {
  AppItem,
  Button,
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
  Tooltip,
} from "@fluentui/react-components";
import {
  Add20Regular,
  AddRegular,
  DeleteRegular,
  ListRegular,
} from "@fluentui/react-icons";
import { useChatStore } from "../stores/useChatStore";
import { commands } from "../../common/commands";

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
    getAllChats,
    loadChat,
    settingsScreen,
  } = useChatStore();

  return (
    <nav className="navbar">
      <Hamburger appearance="subtle" onClick={() => setOpenDrawer(true)} />
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
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
        {chatId && settingsScreen === null && (
          <Tooltip relationship="label" content={"Delete chat"}>
            <Button
              icon={<DeleteRegular />}
              appearance="subtle"
              size="small"
              onClick={async () => {
                await commands.deleteChat({ id: chatId });
                await getAllChats();
                useChatStore.setState({ chatId: null, initialMessages: [] });
              }}
            />
          </Tooltip>
        )}
      </div>
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
              useChatStore.setState({
                chatId: null,
                initialMessages: [],
                settingsScreen: null,
              });
              setOpenDrawer(false);
            }}>
            New Chat
          </AppItem>
          {chats.map((chat) => (
            <NavItem
              key={chat.id}
              value={chat.id}
              onClick={async () => {
                await loadChat(chat.id);
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
