import React from "react";
import { useChatStore } from "../stores/useChatStore";
import ModelList from "./ModelList";
import ModelForm from "./ModelForm";

interface SettingsProps {}

const Settings: React.FC<SettingsProps> = () => {
  const { settingsScreen, editModel } = useChatStore();

  if (settingsScreen === "list") return <ModelList />;
  if (settingsScreen === "model") return <ModelForm initModel={editModel} />;

  return null;
};

export default Settings;
