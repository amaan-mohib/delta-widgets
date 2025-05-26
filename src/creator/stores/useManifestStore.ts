import { create } from "zustand";
import { IWidget, IWidgetElement, TCustomFields } from "../../types/manifest";
import { subscribeWithSelector } from "zustand/middleware";
import lodashSet from "lodash.set";
import lodashGet from "lodash.get";
import debounce from "lodash.debounce";
import { updateManifest } from "../../main/utils/widgets";
import { useDataTrackStore } from "./useDataTrackStore";
import { arrayMove } from "@dnd-kit/sortable";
import { useShallow } from "zustand/shallow";

const cloneObject = <T>(obj: T) => {
  return JSON.parse(JSON.stringify(obj)) as T;
};

export interface IManifestStore {
  manifest: IWidget | null;
  updateWidgetDimensions: (width: number, height: number) => void;
  updateManifest: (data: Partial<IWidget>) => void;
  updateCustomValues: (data: TCustomFields) => void;
  removeCustomValues: (id: string) => void;
  updateElementProperties: (
    id: string,
    { data, styles }: { data?: any; styles?: IWidgetElement["styles"] }
  ) => void;
  addElements: (element: IWidgetElement, parentId: string) => void;
  removeElement: (id: string) => void;
  moveElement: (id: string, dropId: string) => void;
  elementMap: Record<
    string,
    IWidgetElement & {
      path: string;
      index: number;
      parentPath: string;
      parentId: string | null;
    }
  >;
  undoStack: { timestamp: string; data: IWidget }[];
  redoStack: { timestamp: string; data: IWidget }[];
  undo: () => void;
  redo: () => void;
  isUndoRedo: boolean;
}

export const useManifestStore = create<IManifestStore>()(
  subscribeWithSelector((set, get) => ({
    manifest: null,
    updateWidgetDimensions(width, height) {
      const oldManifest = get().manifest;
      if (!oldManifest) return;
      const manifest = { ...oldManifest };
      manifest.dimensions = { width, height };
      set({ manifest });
    },
    updateManifest(data) {
      const oldManifest = get().manifest;
      if (!oldManifest) return;
      const manifest = { ...cloneObject(oldManifest), ...data };
      set({ manifest });
    },
    updateCustomValues(data) {
      const oldManifest = get().manifest;
      if (!oldManifest) return;
      const manifest = cloneObject(oldManifest);
      manifest.customFields = {
        ...(manifest.customFields || {}),
        ...data,
      };
      set({ manifest });
    },
    removeCustomValues(id) {
      const oldManifest = get().manifest;
      if (!oldManifest) return;
      const manifest = cloneObject(oldManifest);
      if (manifest.customFields && manifest.customFields[id]) {
        delete manifest.customFields[id];
      }
      set({ manifest });
    },
    addElements(element, parentId) {
      const oldManifest = get().manifest;
      if (!oldManifest) return;
      const manifest = cloneObject(oldManifest);
      const elementPath = get().elementMap[parentId]?.path || "";
      const elementIndex = parentId
        ? lodashGet(manifest.elements, elementPath)?.children?.length
        : manifest.elements?.length;
      const newManifest = lodashSet(
        manifest,
        parentId
          ? `elements${elementPath}.children[${elementIndex}]`
          : `elements[${elementIndex}]`,
        element
      );

      set({
        manifest: {
          ...newManifest,
          elements: [...(newManifest.elements || [])],
        },
      });
    },
    removeElement(id) {
      const oldManifest = get().manifest;
      const elementMap = get().elementMap;
      if (!oldManifest || !elementMap[id]) return;
      const manifest = cloneObject(oldManifest);
      const elementIndex = elementMap[id].index;
      const parentPath = elementMap[id].parentPath;
      const newManifest = lodashSet(
        manifest,
        `elements${parentPath}`,
        (lodashGet(manifest, `elements${parentPath}`) || []).filter(
          (_, index) => index !== elementIndex
        )
      );
      set({ manifest: newManifest });
    },
    moveElement(id, dropId) {
      const { manifest: oldManifest, elementMap } = get();
      if (!oldManifest || !elementMap[id] || !elementMap[dropId]) return;

      const manifest = cloneObject(oldManifest);

      // Get source element details
      const {
        index: sourceIndex,
        parentPath: sourceParentPath,
        parentId: sourceParentId,
      } = elementMap[id];

      // Get target element details
      const {
        index: targetIndex,
        path: targetPath,
        parentPath: targetParentPath,
      } = elementMap[dropId];

      // Case 1: Moving within the same parent
      if (sourceParentPath === targetParentPath) {
        const reorderedElements = arrayMove(
          lodashGet(manifest, `elements${sourceParentPath}`) || [],
          sourceIndex,
          targetIndex
        );

        const newManifest = lodashSet(
          manifest,
          `elements${sourceParentPath}`,
          reorderedElements
        );

        set({ manifest: newManifest });
        return;
      }

      // Case 2: Moving between different parents
      if (sourceParentId !== dropId) {
        // Determine the target path based on whether dropping into a container
        const targetInsertPath = `elements${
          dropId.startsWith("container")
            ? `${targetPath}.children`
            : targetParentPath
        }`;

        // Insert element at new location
        const targetItems: any[] = lodashGet(manifest, targetInsertPath) || [];
        targetItems.splice(targetIndex + 1, 0, {
          ...elementMap[id],
          parentId: undefined,
          parentPath: undefined,
          index: undefined,
          path: undefined,
        });

        // Handle special case where target and source share inheritance
        const inheritanceIndex = targetItems.findIndex(
          (item) => item.id === sourceParentId
        );
        if (inheritanceIndex !== -1) {
          const updatedItems = targetItems.map((item, index) => {
            if (index === inheritanceIndex && item.id.startsWith("container")) {
              return {
                ...item,
                children: item.children.filter((child: any) => child.id !== id),
              };
            }
            return item;
          });

          set({
            manifest: lodashSet(manifest, targetInsertPath, updatedItems),
          });
          return;
        }

        // Update both source and target locations
        const manifestWithNewTarget = lodashSet(
          manifest,
          targetInsertPath,
          targetItems
        );

        const sourceItems = (
          lodashGet(manifestWithNewTarget, `elements${sourceParentPath}`) || []
        ).filter((item: any) => item.id !== id);

        const finalManifest = lodashSet(
          manifestWithNewTarget,
          `elements${sourceParentPath}`,
          sourceItems
        );

        set({ manifest: finalManifest });
      }
    },
    updateElementProperties(id, { data, styles }) {
      const oldManifest = get().manifest;
      const elementMap = get().elementMap;
      if (!oldManifest || !elementMap[id]) return;
      const manifest = cloneObject(oldManifest);
      const element = elementMap[id];
      const oldElement = lodashGet(manifest, `elements${element.path}`) || {};
      const newManifest = lodashSet(manifest, `elements${element.path}`, {
        ...oldElement,
        data: {
          ...(element.data || {}),
          ...(data || {}),
        },
        styles: {
          ...(element.styles || {}),
          ...(styles || {}),
        },
      });
      set({ manifest: newManifest });
    },
    elementMap: {},
    undoStack: [],
    redoStack: [],
    undo() {
      const currentState = get().manifest;
      const undoStack = get().undoStack.slice();
      const redoStack = get().redoStack.slice();
      const undo = undoStack.pop();
      if (undo && currentState) {
        redoStack.push({
          timestamp: new Date().toISOString(),
          data: cloneObject(currentState),
        });
        set({
          manifest: undo.data,
          redoStack: redoStack.slice(),
          undoStack: undoStack.slice(),
          isUndoRedo: true,
        });
      }
    },
    redo() {
      const currentState = get().manifest;
      const undoStack = get().undoStack.slice();
      const redoStack = get().redoStack.slice();
      const redo = redoStack.pop();
      if (redo && currentState) {
        undoStack.push({
          timestamp: new Date().toISOString(),
          data: cloneObject(currentState),
        });
        set({
          manifest: redo.data,
          redoStack: redoStack.slice(),
          undoStack: undoStack.slice(),
          isUndoRedo: true,
        });
      }
    },
    isUndoRedo: false,
  }))
);

function mapElementPaths(
  elements: IWidgetElement[],
  parentPath: string = "",
  parentId: string | null = null
) {
  let map: IManifestStore["elementMap"] = {};

  elements.forEach((element, index) => {
    const currentPath = parentPath
      ? `${parentPath}.children[${index}]`
      : `[${index}]`;
    const currentId = element.id;
    map[element.id] = {
      ...element,
      path: currentPath,
      parentPath: parentPath ? `${parentPath}.children` : "",
      index,
      parentId,
    };

    if (element.children) {
      Object.assign(
        map,
        mapElementPaths(element.children, currentPath, currentId)
      );
    }
  });

  return map;
}

useManifestStore.subscribe(
  (state) => state.manifest?.elements,
  (elements) => {
    if (!elements) return;
    const elementMap = mapElementPaths(elements);
    useManifestStore.setState({ elementMap });
  }
);

const debouncedUpdate = debounce((manifest: IWidget) => {
  useDataTrackStore.setState({ isSaving: true });
  updateManifest(manifest)
    .catch(console.error)
    .finally(() => {
      useDataTrackStore.setState({ isSaving: false });
    });
}, 500);

const debouncedHistory = debounce(
  (prevManifest: IWidget) => {
    if (!useManifestStore.getState().isUndoRedo) {
      const undoStack = useManifestStore.getState().undoStack.slice();
      undoStack.push({
        timestamp: new Date().toISOString(),
        data: cloneObject(prevManifest),
      });
      while (undoStack.length > 50) {
        undoStack.shift();
      }
      useManifestStore.setState({ undoStack, redoStack: [] });
    }
    useManifestStore.setState({ isUndoRedo: false });
  },
  700,
  { leading: true, trailing: false }
);

useManifestStore.subscribe(
  (state) => state.manifest,
  (manifest, prevManifest) => {
    if (manifest) debouncedUpdate(manifest);
    if (prevManifest) debouncedHistory(prevManifest);
  }
);

export const getManifestStore = () =>
  useManifestStore(useShallow((state) => state.manifest));
