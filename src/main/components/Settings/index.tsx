import React from "react";
import { useDataStore } from "../../stores/useDataStore";
import About from "./About";
import General from "./General";
import Theme from "./Theme";

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  const { settingsActiveTab } = useDataStore();

  return (
    <div>
      {settingsActiveTab === "general" && <General />}
      {settingsActiveTab === "theme" && <Theme />}
      {settingsActiveTab === "about" && <About />}
    </div>
  );
};

export default Settings;
