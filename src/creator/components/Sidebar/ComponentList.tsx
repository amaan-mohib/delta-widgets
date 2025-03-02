import { Card, makeStyles } from "@fluentui/react-components";
import { Square24Regular, TextField24Regular } from "@fluentui/react-icons";
import React, { ReactNode } from "react";
import Draggable from "../Draggable";
import { DragOverlay } from "@dnd-kit/core";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { IWidgetElement } from "../../../types/manifest";

interface ComponentListProps {}

export const components: {
  name: string;
  key: string;
  icon: ReactNode;
  data: Omit<IWidgetElement, "id">;
}[] = [
  {
    name: "Flex",
    key: "flex-container",
    icon: <Square24Regular />,
    data: {
      type: "container",
      styles: {
        display: "flex",
        flex: 1,
        background: "transparent",
        padding: 5,
        width: "100%",
      },
      children: [],
    },
  },
  {
    name: "Text",
    key: "text",
    icon: <TextField24Regular />,
    data: {
      type: "text",
      styles: {},
    },
  },
];

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "10px",
  },
  chicklet: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "80px",
    height: "80px",
    userSelect: "none",
  },
});

const ComponentItem: React.FC<{
  itemId?: string;
  item?: (typeof components)[0] | null;
}> = ({ itemId, item }) => {
  const styles = useStyles();
  item =
    item || components.find((component) => component.key === itemId) || null;

  if (!item) return null;
  return (
    <Card className={styles.chicklet} key={item.key}>
      {item.icon}
      {item.name}
    </Card>
  );
};

const ComponentList: React.FC<ComponentListProps> = () => {
  const styles = useStyles();
  const draggingId = useDataTrackStore((state) => state.activeId);

  return (
    <div>
      <div className={styles.container}>
        {components.map((item) => (
          <Draggable id={item.key} key={item.key} dragOverlay data={item.data}>
            <ComponentItem item={item} />
          </Draggable>
        ))}
        <DragOverlay dropAnimation={null}>
          {draggingId ? <ComponentItem itemId={draggingId} /> : null}
        </DragOverlay>
      </div>
    </div>
  );
};

export default ComponentList;
