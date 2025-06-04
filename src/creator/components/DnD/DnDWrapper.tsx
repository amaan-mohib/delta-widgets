import { closestCenter, DndContext } from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import { componentTypeToDataMap } from "../Sidebar/ComponentList";

interface DnDWrapperProps {}

const DnDWrapper: React.FC<DnDWrapperProps & PropsWithChildren> = ({
  children,
}) => {
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={(e) => {
        useDataTrackStore.setState({
          activeId: String(e.active.id),
          isDragging: true,
          selectedId: null,
        });
      }}
      onDragEnd={(e) => {
        if (e.active.id === "container") {
          useDataTrackStore.setState({ activeId: null, isDragging: false });
          return;
        }

        if (e.over?.id) {
          if (e.active.data.current?.sortable && e.active.id !== e.over.id) {
            useManifestStore
              .getState()
              .moveElement(e.active.id.toString(), e.over.id.toString());
          } else if (!e.over?.id.toString().startsWith("container")) {
            useDataTrackStore.setState({ activeId: null, isDragging: false });
            return;
          } else if (e.active.data.current) {
            const { type } = e.active.data.current as { type: string };
            const element = componentTypeToDataMap[type]
              ? componentTypeToDataMap[type]()
              : null;
            if (element) {
              useManifestStore
                .getState()
                .addElements(element, String(e.over.id));
            }
          }
        }
        useDataTrackStore.setState({ activeId: null, isDragging: false });
      }}>
      {children}
    </DndContext>
  );
};

export default DnDWrapper;
