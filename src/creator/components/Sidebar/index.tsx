import { makeStyles, Tab, TabList } from "@fluentui/react-components";
import React, { useState } from "react";

interface SidebarProps {}

const useStyles = makeStyles({
  container: {
    height: "100%",
    width: "250px",
    display: "flex",
    flexDirection: "column",
  },
});

const Sidebar: React.FC<SidebarProps> = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState("components");

  return (
    <div className={styles.container}>
      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => {
          setSelectedTab(data.value as string);
        }}>
        <Tab value="components">Components</Tab>
        <Tab value="templates">Templates</Tab>
      </TabList>
      <div style={{ height: "100%" }}>{selectedTab}</div>
    </div>
  );
};

export default Sidebar;
