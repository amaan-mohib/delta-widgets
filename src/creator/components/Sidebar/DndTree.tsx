import * as React from "react";
import {
  FlatTree,
  FlatTreeItem,
  TreeItemLayout,
  useHeadlessFlatTree_unstable,
  HeadlessFlatTreeItemProps,
  FlatTreeItemProps,
} from "@fluentui/react-components";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IWidgetElement } from "../../../types/manifest";
import { useManifestStore } from "../../stores/useManifestStore";

type FlatItem = HeadlessFlatTreeItemProps & { layout: string };

const sortItems = (array: FlatItem[], from: number, to: number) => {
  const newArray = array.slice();
  const startIndex = from < 0 ? array.length + from : from;
  const item = newArray.splice(startIndex, 1)[0];
  const endIndex = to < 0 ? array.length + to : to;
  newArray.splice(endIndex, 0, item);
  return newArray;
};

const SortableTreeItem = ({ children, value, ...rest }: FlatTreeItemProps) => {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: value as UniqueIdentifier,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <FlatTreeItem
      ref={setNodeRef}
      value={value}
      style={style}
      {...attributes}
      {...listeners}
      {...rest}>
      {children}
    </FlatTreeItem>
  );
};

function flatten(
  items: IWidgetElement[],
  parentId: UniqueIdentifier | null = null,
  depth = 0
): FlatItem[] {
  const flattenedItems: FlatItem[] = [];
  items.forEach((item) => {
    flattenedItems.push({
      layout: item.id,
      value: item.id,
      parentValue: parentId || undefined,
    });
    if (item.children) {
      flattenedItems.push(...flatten(item.children, item.id, depth + 1));
    }
  });

  return flattenedItems;
}

export const DndTree = () => {
  const manifestElements = useManifestStore((state) => state.manifest.elements);
  const [items, setItems] = React.useState(flatten(manifestElements || []));
  const virtualTree = useHeadlessFlatTree_unstable(items, {
    defaultOpenItems: ["1"],
  });

  React.useEffect(() => {
    setItems(flatten(manifestElements || []));
  }, [manifestElements]);

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    console.log({ active, over });

    if (active.id !== over?.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex(
          (item) => item.value === active.id
        );
        const newIndex = prevItems.findIndex((item) => item.value === over?.id);
        return sortItems(prevItems, oldIndex, newIndex);
      });
    }
  }, []);

  const sortableItems = items
    .filter((item) => item.parentValue)
    .map((item) => item.value);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}>
      <SortableContext
        items={sortableItems}
        strategy={verticalListSortingStrategy}>
        <FlatTree aria-label="Drag And Drop" {...virtualTree.getTreeProps()}>
          {Array.from(virtualTree.items(), (item) => {
            const { layout, ...itemProps } = item.getTreeItemProps();

            return item.itemType === "leaf" ? (
              <SortableTreeItem key={item.value} {...itemProps}>
                <TreeItemLayout>{layout}</TreeItemLayout>
              </SortableTreeItem>
            ) : (
              <FlatTreeItem {...itemProps} key={item.value}>
                <TreeItemLayout>{layout}</TreeItemLayout>
              </FlatTreeItem>
            );
          })}
        </FlatTree>
      </SortableContext>
    </DndContext>
  );
};
