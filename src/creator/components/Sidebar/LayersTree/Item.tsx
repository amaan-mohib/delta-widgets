import React from "react";
import { IWidgetElement } from "../../../../types/manifest";
import { Button, Card, Text } from "@fluentui/react-components";
import {
  ChevronDown12Regular,
  ChevronRight12Regular,
} from "@fluentui/react-icons";
import { useDataTrackStore } from "../../../stores/useDataTrackStore";
import DropZone from "./DropZone";
import { DragOverlay, useDraggable } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useManifestStore } from "../../../stores/useManifestStore";

interface ItemProps {
  item: IWidgetElement;
}

const Item: React.FC<ItemProps> = ({ item }) => {
  const { id, label, children = [] } = item;
  const selectedId = useDataTrackStore((state) => state.selectedId);
  const layerOpenMap = useDataTrackStore((state) => state.layerOpenMap);
  const elementMap = useManifestStore((state) => state.elementMap);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { move: true },
  });
  const hasChildren = children.length > 0;
  const elementLabel = elementMap[id]?.label || `#${id}`;

  return (
    <div>
      <div
        ref={setNodeRef}
        style={{
          display: "flex",
          alignItems: "center",
          opacity: isDragging ? 0.8 : 1,
        }}
        id={`layer-${id}`}>
        {hasChildren ? (
          <Button
            onClick={() => {
              useDataTrackStore.getState().toggleLayerOpen(id);
            }}
            appearance="subtle"
            size="small"
            icon={
              layerOpenMap[id] ? (
                <ChevronDown12Regular />
              ) : (
                <ChevronRight12Regular />
              )
            }
          />
        ) : (
          <div style={{ width: 20, height: 20 }}></div>
        )}
        <Button
          {...attributes}
          {...listeners}
          onClick={() => {
            useDataTrackStore.setState({ selectedId: id });
          }}
          appearance={selectedId === id ? "primary" : "subtle"}
          style={{
            flex: 1,
            justifyContent: "start",
            textAlign: "left",
            paddingLeft: 5,
          }}>
          {label || `#${id}`}
        </Button>
      </div>
      {children.length !== 0 && !!layerOpenMap[id] && (
        <DropZone id={id} index={0} />
      )}
      {hasChildren && !!layerOpenMap[id] && (
        <>
          <div style={{ paddingLeft: 20 }}>
            {children.map((child, index) => (
              <React.Fragment key={child.id}>
                <Item item={child} />
                {index + 1 !== children.length && (
                  <DropZone id={child.id} parentId={id} index={index} end />
                )}
              </React.Fragment>
            ))}
          </div>
          <DropZone id={id} index={children.length} end />
        </>
      )}
      {isDragging && (
        <DragOverlay dropAnimation={null} modifiers={[restrictToVerticalAxis]}>
          <Card size="small" style={{ opacity: 0.8 }}>
            <Text size={400}>{elementLabel}</Text>
          </Card>
        </DragOverlay>
      )}
    </div>
  );
};

export default Item;
