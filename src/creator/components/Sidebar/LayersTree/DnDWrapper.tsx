import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import React, { PropsWithChildren } from "react";
import { message } from "@tauri-apps/plugin-dialog";
import { useManifestStore } from "../../../stores/useManifestStore";
import { useDataTrackStore } from "../../../stores/useDataTrackStore";

interface DnDWrapperProps {}

const activationConstraint = { delay: 250, distance: 3, tolerance: 10 };

const DnDWrapper: React.FC<DnDWrapperProps & PropsWithChildren> = ({
  children,
}) => {
  const mouseSensor = useSensor(MouseSensor, { activationConstraint });
  const touchSensor = useSensor(TouchSensor, { activationConstraint });
  const keyboardSensor = useSensor(KeyboardSensor, {});
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const resetDragSatate = () => {
    useDataTrackStore.setState({ layerActiveId: null, layerIsDragging: false });
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => {
        useDataTrackStore.setState({
          layerActiveId: String(e.active.id),
          layerIsDragging: true,
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
