import { makeStyles, Tab, TabList } from "@fluentui/react-components";
import React, { useMemo, useState } from "react";
import ComponentList from "./ComponentList";
import Layers from "./Layers";

interface SidebarProps {}

const useStyles = makeStyles({
  container: {
    height: "100%",
    width: "var(--sidebar-width)",
    display: "flex",
    flexDirection: "column",
  },
});

type TTabKey = "components" | "templates" | "layers";
const tabs: Record<TTabKey, React.FC> = {
  components: ComponentList,
  templates: () => <>templates</>,
  layers: Layers,
};

const Sidebar: React.FC<SidebarProps> = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<TTabKey>("components");

  const TabComponent: React.FC = useMemo(() => {
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
      <div style={{ height: "100%" }}>
        <TabComponent />
      </div>
    </div>
  );
};

export default Sidebar;
