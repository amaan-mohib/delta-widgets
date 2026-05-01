import React, { useCallback, useEffect, useState } from "react";
import {
  NavDivider,
  makeStyles,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  CounterBadge,
  AppItemStatic,
  tokens,
  Badge,
} from "@fluentui/react-components";
import {
  Apps20Color,
  Apps20Regular,
  BuildingShop20Regular,
  BuildingStore20Color,
  bundleIcon,
  Drafts20Color,
  Drafts20Regular,
  ErrorCircle20Color,
  Heart20Color,
  Megaphone20Regular,
  QuestionCircle20Regular,
  Settings20Regular,
} from "@fluentui/react-icons";
import AddMenu from "./AddMenu";
import { check } from "@tauri-apps/plugin-updater";
import { useDataStore } from "../../stores/useDataStore";
import DiscordIcon from "../icons/Discord";

export const sidebarWidth = 250;

interface SidebarProps {}

export const commonItems = [
  {
    value: "donate",
    text: "Donate",
    href: "https://buymeacoffee.com/amaan.mohib",
    icon: <Heart20Color />,
  },
  {
    value: "whats-new",
    text: "What's new",
    onClick: () => {
      useDataStore.setState({ openWhatsNew: true });
    },
    icon: <Megaphone20Regular />,
  },
  {
    value: "discord",
    text: "Discord",
    href: "https://discord.gg/wDE8KNx8fB",
    icon: <DiscordIcon width={20} height={20} />,
  },
  {
    value: "help",
    text: "Help",
    href: "https://amaan-mohib.github.io/delta-widgets/",
    icon: <QuestionCircle20Regular />,
  },
];

const useStyles = makeStyles({
  drawer: {
    height: "100vh",
    width: `${sidebarWidth}px`,
    position: "fixed",
    left: 0,
    top: 0,
    backgroundColor: "transparent",
  },
  drawerBody: {
    paddingBottom: "16px !important",
  },
  transparent: {
    backgroundColor: "transparent",
  },
  navItem: {
    backgroundColor: "transparent",
    ":hover": {
      backgroundColor: `color-mix(in srgb,${tokens.colorNeutralBackground1Hover},transparent 25%)`,
    },
  },
});

const Sidebar: React.FC<SidebarProps> = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const styles = useStyles();
  const { draftWidgets, activeTab, setActiveTab } = useDataStore();
  const InstalledIcon = bundleIcon(Apps20Color, Apps20Regular);
  const DraftIcon = bundleIcon(Drafts20Color, Drafts20Regular);
  const MarketplaceIcon = bundleIcon(
    BuildingStore20Color,
    BuildingShop20Regular,
  );

  const checkForUpdates = useCallback(async () => {
    const update = await check();
    setUpdateAvailable(!!update);
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    <>
      <NavDrawer
        className={`${styles.drawer} ${styles.transparent}`}
        selectedValue={activeTab}
        type="inline"
        open>
        <NavDrawerHeader style={{ paddingTop: 8 }}>
          <AppItemStatic className={styles.transparent}>
            <AddMenu />
          </AppItemStatic>
        </NavDrawerHeader>
        <NavDrawerBody className={styles.drawerBody}>
          <NavItem
            className={styles.navItem}
            onClick={() => setActiveTab("installed")}
            value={"installed"}
            icon={<InstalledIcon />}>
            Installed
          </NavItem>
          <NavItem
            className={styles.navItem}
            onClick={() => setActiveTab("drafts")}
            value={"drafts"}
            icon={<DraftIcon />}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              Drafts
              <CounterBadge showZero={false} count={draftWidgets.length} />
            </div>
          </NavItem>
          <NavItem
            className={styles.navItem}
            onClick={() => setActiveTab("marketplace")}
            value={"marketplace"}
            icon={<MarketplaceIcon />}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              Marketplace
              <Badge appearance="tint">New</Badge>
            </div>
          </NavItem>
          <NavDivider style={{ marginTop: "auto" }} />
          {updateAvailable && (
            <NavItem
              className={styles.navItem}
              value={"help"}
              icon={<ErrorCircle20Color />}
              onClick={() => {
                useDataStore.setState({
                  showSettings: true,
                  settingsActiveTab: "about",
                });
              }}>
              Update available
            </NavItem>
          )}
          {commonItems.map((item) => (
            <NavItem
              key={item.value}
              className={styles.navItem}
              value={item.value}
              href={item.href}
              target="_blank"
              icon={item.icon}
              onClick={item.onClick}>
              {item.text}
            </NavItem>
          ))}
          <NavItem
            className={styles.navItem}
            value={"settings"}
            onClick={() => {
              useDataStore.setState({
                showSettings: true,
                settingsActiveTab: "general",
              });
            }}
            icon={<Settings20Regular />}>
            Settings
          </NavItem>
        </NavDrawerBody>
      </NavDrawer>
    </>
  );
};

export default Sidebar;
