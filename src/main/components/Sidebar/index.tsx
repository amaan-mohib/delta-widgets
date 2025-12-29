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
} from "@fluentui/react-components";
import {
  Apps20Filled,
  Apps20Regular,
  bundleIcon,
  Drafts20Filled,
  Drafts20Regular,
  ErrorCircle20Color,
  Heart20Color,
  QuestionCircle20Regular,
  Settings20Regular,
} from "@fluentui/react-icons";
import AddMenu from "./AddMenu";
import { check } from "@tauri-apps/plugin-updater";
import { useDataStore } from "../../stores/useDataStore";

export const sidebarWidth = 250;

interface SidebarProps {}

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
  const InstalledIcon = bundleIcon(Apps20Filled, Apps20Regular);
  const DraftIcon = bundleIcon(Drafts20Filled, Drafts20Regular);

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
          <NavItem
            className={styles.navItem}
            value={"donate"}
            href="https://buymeacoffee.com/amaan.mohib"
            target="_blank"
            icon={<Heart20Color />}>
            Donate
          </NavItem>
          <NavItem
            className={styles.navItem}
            value={"help"}
            href="https://amaan-mohib.github.io/delta-widgets/"
            target="_blank"
            icon={<QuestionCircle20Regular />}>
            Help
          </NavItem>

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
