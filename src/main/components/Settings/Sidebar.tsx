import React from "react";
import {
  makeStyles,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  AppItemStatic,
  tokens,
  Button,
  NavDivider,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  bundleIcon,
  Color20Filled,
  Color20Regular,
  Flag20Regular,
  Info20Filled,
  Info20Regular,
  Settings20Filled,
  Settings20Regular,
} from "@fluentui/react-icons";
import { TSettingsActiveTab, useDataStore } from "../../stores/useDataStore";
import { sidebarWidth } from "../Sidebar";

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

const items = [
  {
    name: "General",
    Icon: bundleIcon(Settings20Filled, Settings20Regular),
    value: "general",
  },
  {
    name: "Theme",
    Icon: bundleIcon(Color20Filled, Color20Regular),
    value: "theme",
  },
  {
    name: "About",
    Icon: bundleIcon(Info20Filled, Info20Regular),
    value: "about",
  },
];

const SettingsSidebar: React.FC<SidebarProps> = () => {
  const styles = useStyles();
  const { settingsActiveTab, setSettingsActiveTab } = useDataStore();

  return (
    <>
      <NavDrawer
        className={`${styles.drawer} ${styles.transparent}`}
        selectedValue={settingsActiveTab}
        type="inline"
        open>
        <NavDrawerHeader style={{ paddingTop: 8 }}>
          <AppItemStatic className={styles.transparent}>
            <Button
              style={{
                justifyContent: "start",
                marginLeft: -16,
                gap: 10,
              }}
              appearance="transparent"
              icon={<ArrowLeftRegular />}
              onClick={() => {
                useDataStore.setState({
                  showSettings: false,
                });
              }}>
              Home
            </Button>
          </AppItemStatic>
        </NavDrawerHeader>
        <NavDrawerBody className={styles.drawerBody}>
          {items.map((item) => (
            <NavItem
              key={item.value}
              className={styles.navItem}
              onClick={() =>
                setSettingsActiveTab(item.value as TSettingsActiveTab)
              }
              value={item.value}
              icon={<item.Icon />}>
              {item.name}
            </NavItem>
          ))}
          <NavDivider style={{ marginTop: "auto" }} />
          <NavItem
            className={styles.navItem}
            value={"report"}
            href="https://github.com/amaan-mohib/delta-widgets/issues"
            target="_blank"
            icon={<Flag20Regular />}>
            Report an issue
          </NavItem>
        </NavDrawerBody>
      </NavDrawer>
    </>
  );
};

export default SettingsSidebar;
