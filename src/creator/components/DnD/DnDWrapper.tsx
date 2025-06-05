import { closestCenter, DndContext } from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";
import { useDataTrackStore } from "../../stores/useDataTrackStore";
import { useManifestStore } from "../../stores/useManifestStore";
import { componentTypeToDataMap } from "../Sidebar/ComponentList";
import { message } from "@tauri-apps/plugin-dialog";

interface DnDWrapperProps {}

const DnDWrapper: React.FC<DnDWrapperProps & PropsWithChildren> = ({
  children,
}) => {
  const resetDragSatate = () => {
    useDataTrackStore.setState({ activeId: null, isDragging: false });
  };
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
      onDragEnd={async (e) => {
        if (!e.over?.id) {
          resetDragSatate();
          return;
        }
        // cancel drop
        if (e.over.id === "dnd-cancel-zone") {
          resetDragSatate();
          return;
        }
        const parentId =
          e.over.data.current?.parentId ||
          e.over.data.current?.id ||
          e.over.id.toString();

        // add new element
        if (e.active.data.current?.new) {
          const type: string = e.active.data.current?.type;
          const element = componentTypeToDataMap[type]
            ? componentTypeToDataMap[type]()
            : null;
          if (element) {
            useManifestStore
              .getState()
              .addElements(element, parentId, e.over.data.current?.index);
          }
        }

        // move existing element
        if (e.active.data.current?.move) {
          const error = useManifestStore
            .getState()
            .moveElement(
              e.active.id.toString(),
              parentId,
              e.over.data.current?.index ?? 0
            );
          if (error) {
            await message(error, {
              title: "Error",
              kind: "error",
            });
          }
        }
        resetDragSatate();
      }}>
      {children}
    </DndContext>
  );
};

export default DnDWrapper;
