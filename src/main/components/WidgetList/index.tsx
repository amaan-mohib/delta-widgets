import React from "react";
import LoadingWidgets from "./LoadingWidgets";
import InstalledWidgets from "./InstalledWidgets";
import DraftWidgets from "./DraftWidgets";
import { useDataStore } from "../../stores/useDataStore";

interface WidgetListProps {}

const WidgetList: React.FC<WidgetListProps> = () => {
  const showSettings = useDataStore((s) => s.showSettings);

  if (showSettings) return null;

  return (
    <>
      <LoadingWidgets />
      <InstalledWidgets />
      <DraftWidgets />
    </>
  );
};

export default WidgetList;
