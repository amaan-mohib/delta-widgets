import { makeStyles, Tab, TabList } from "@fluentui/react-components";
import React, { useMemo, useState } from "react";
import ComponentList from "./ComponentList";
import Layers from "./Layers";

interface SidebarProps {}

const useStyles = makeStyles({
  container: {
    height: "calc(100vh - var(--toolbar-height))",
    width: "var(--sidebar-width)",
    display: "flex",
    flexDirection: "column",
  },
});

type TTabKey = "components" | "templates" | "layers";
const tabs: Record<TTabKey, React.ReactNode> = {
  components: <ComponentList />,
  templates: <>templates</>,
  layers: <Layers />,
};

const Sidebar: React.FC<SidebarProps> = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<TTabKey>("components");

  const tabComponent = useMemo(() => {
    return tabs[selectedTab];
  }, [selectedTab]);

  return (
    <div className={styles.container}>
      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => {
          setSelectedTab(data.value as TTabKey);
        }}>
        <Tab value="components">Components</Tab>
        <Tab value="templates">Templates</Tab>
        <Tab value="layers">Elements</Tab>
      </TabList>
      <div key={selectedTab} style={{ flex: 1, overflow: "auto" }}>
        {tabComponent}
      </div>
    </div>
  );
};

export default Sidebar;
