import {
  AppItem,
  Button,
  Hamburger,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
} from "@fluentui/react-components";
import { Add20Regular, SettingsRegular } from "@fluentui/react-icons";
import { useChatStore } from "../stores/useChatStore";

interface NavbarProps {}

const Navbar: React.FC<NavbarProps> = () => {
  const { chatId, chats, openDrawer, setOpenDrawer, loadChat } = useChatStore();

  return (
    <nav className="navbar">
      <Hamburger appearance="subtle" onClick={() => setOpenDrawer(true)} />
      <Button appearance="subtle" icon={<SettingsRegular />} />
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
