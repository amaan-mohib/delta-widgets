import React from "react";
import { useDataStore } from "../../stores/useDataStore";
import GridContainer from "./GridContainer";
import WidgetCard from "../WidgetCard";
import CreateNewCard from "./CreateNewCard";

interface DraftWidgetsProps {}

const DraftWidgets: React.FC<DraftWidgetsProps> = () => {
  const draftWidgets = useDataStore((s) => s.draftWidgets);
  const key = useDataStore((s) => s.listRefreshKey);
  const activeTab = useDataStore((s) => s.activeTab);

  if (activeTab !== "drafts") return null;

  return (
    <GridContainer key={key}>
      {draftWidgets.map((widget) => {
        return <WidgetCard key={widget.key} widget={widget} saves />;
      })}
      <CreateNewCard />
    </GridContainer>
  );
};

export default DraftWidgets;
