import { Card, makeStyles } from "@fluentui/react-components";
import { Square24Regular, TextField24Regular } from "@fluentui/react-icons";
import React, { ReactNode } from "react";
import Draggable from "../Draggable";
import { DragOverlay } from "@dnd-kit/core";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { IWidgetElement } from "../../../types/manifest";
import { nanoid } from "nanoid";

interface ComponentListProps {}

export const components: {
  name: string;
  type: string;
  key: string;
  icon: ReactNode;
  data: () => IWidgetElement;
}[] = [
  {
    name: "Container",
    type: "container",
    key: "flex-container",
    icon: <Square24Regular />,
    data: () => ({
      id: `container-${nanoid(4)}`,
      type: "container",
      styles: {
        display: "flex",
        flex: 1,
        background: "transparent",
        padding: 5,
        width: "100%",
      },
      children: [],
    }),
  },
  {
    name: "Text",
    key: "text",
    type: "text",
    icon: <TextField24Regular />,
    data: () => ({
      id: `text-${nanoid(4)}`,
      type: "text",
      styles: {},
      data: { text: "Text" },
    }),
  },
];

export const componentTypeToDataMap: Record<string, () => IWidgetElement> = {};
Object.values(components).forEach((item) => {
  componentTypeToDataMap[item.type] = item.data;
});

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "10px",
  },
  chiclet: {
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
    <Card className={styles.chiclet} key={item.key}>
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
          <Draggable
            id={item.key}
            key={item.key}
            dragOverlay
            data={{ type: item.type }}>
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
