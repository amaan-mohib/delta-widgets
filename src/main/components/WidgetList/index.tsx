import React from "react";
import LoadingWidgets from "./LoadingWidgets";
import InstalledWidgets from "./InstalledWidgets";
import DraftWidgets from "./DraftWidgets";

interface WidgetListProps {}

const WidgetList: React.FC<WidgetListProps> = () => {
  return (
    <>
      <LoadingWidgets />
      <InstalledWidgets />
      <DraftWidgets />
    </>
  );
};

export default WidgetList;
