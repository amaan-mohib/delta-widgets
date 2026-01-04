import { create } from "zustand";
import { IWidget, IWidgetElement, TCustomFields } from "../../types/manifest";
import { subscribeWithSelector } from "zustand/middleware";
import lodashSet from "lodash.set";
import lodashGet from "lodash.get";
import debounce from "lodash.debounce";
import { createThumb, updateManifest } from "../../main/utils/widgets";
import { useDataTrackStore } from "./useDataTrackStore";
import { arrayMove } from "@dnd-kit/sortable";
import { useShallow } from "zustand/shallow";
import { cloneObject } from "../utils";

export interface IUpdateElementProperties {
  data?: any;
  styles?: IWidgetElement["styles"];
  label?: string;
}

export type IWidgetElementValue = IWidgetElement & {
  path: string;
  index: number;
  parentPath: string;
  parentId: string | null;
};

export interface IManifestStore {
  manifest: IWidget | null;
  updateWidgetDimensions: (width: number, height: number) => void;
  updateManifest: (data: Partial<IWidget>) => void;
  updateCustomValues: (data: TCustomFields) => void;
  removeCustomValues: (id: string) => void;
  updateElementProperties: (id: string, data: IUpdateElementProperties) => void;
  addElements: (
    element: IWidgetElement,
    parentId: string,
    index?: number
  ) => void;
  removeElement: (id: string, cut?: boolean) => void;
  moveElement: (id: string, dropId: string, dropIndex: number) => string | void;
  elementMap: Record<string, IWidgetElementValue>;
  undoStack: { timestamp: string; data: IWidget }[];
  redoStack: { timestamp: string; data: IWidget }[];
  undo: () => void;
  redo: () => void;
  isUndoRedo: boolean;
  clipboard: IWidgetElement | null;
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
    addElements(element, parentId, index) {
      const oldManifest = get().manifest;
      if (!oldManifest) return;
      const manifest = cloneObject(oldManifest);
      const elementPath = get().elementMap[parentId]?.path || "";
      const elements: IWidgetElement[] =
        lodashGet(manifest.elements, elementPath)?.children || [];
      if (index !== undefined) {
        elements.splice(index, 0, element);
      } else {
        elements.push(element);
      }

      const newManifest = lodashSet(
        manifest,
        `elements${elementPath}.children`,
        elements
      );

      set({
        manifest: {
          ...newManifest,
          elements: [...(newManifest.elements || [])],
        },
      });
    },
    removeElement(id, cut) {
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
      if (cut) {
        const element = cloneObject(elementMap[id]);
        set({
          clipboard: {
            id: element.id,
            styles: element.styles,
            type: element.type,
            children: element.children,
            data: element.data,
            label: element.label,
          },
        });
      }
      set({ manifest: newManifest });
    },
    moveElement(id, dropId, dropIndex) {
      if (!dropId.startsWith("container")) {
        return "Something went wrong, please try again.";
      }
      const { manifest: oldManifest, elementMap } = get();
      if (!oldManifest || !elementMap[id] || !elementMap[dropId]) return;

      const manifest = cloneObject(oldManifest);

      // Get source element details
      const {
        index: sourceIndex,
        parentPath: sourceParentPath,
        parentId: sourceParentId,
        path: sourcePath,
      } = elementMap[id];

      // Get target element details
      const { path: targetPath } = elementMap[dropId];

      if (targetPath.startsWith(sourcePath)) {
        return "Cannot move an element into itself or its children.";
      }

      // Case 1: Moving within the same parent
      if (sourceParentId === dropId) {
        const reorderedElements = arrayMove(
          lodashGet(manifest, `elements${sourceParentPath}`) || [],
          sourceIndex,
          dropIndex
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
      const targetInsertPath = `elements${targetPath}.children`;
      const targetItems: any[] = [
        ...(lodashGet(manifest, targetInsertPath) || []),
      ];
      targetItems.splice(dropIndex, 0, {
        ...elementMap[id],
        parentId: undefined,
        parentPath: undefined,
        index: undefined,
        path: undefined,
      });
      const sourceItems = [
        ...(lodashGet(manifest, `elements${sourceParentPath}`) || []),
      ].filter((item: any) => item.id !== id);

      // Update source then target if moving from a child to any of the parents
      if (sourcePath.startsWith(targetPath)) {
        const manifestWithNewTarget = lodashSet(
          manifest,
          `elements${sourceParentPath}`,
          sourceItems
        );
        const finalManifest = lodashSet(
          manifestWithNewTarget,
          targetInsertPath,
          targetItems
        );

        set({ manifest: finalManifest });
        return;
      }

      // Update target then source if moving between different containers or within same inheritance
      const manifestWithNewTarget = lodashSet(
        manifest,
        targetInsertPath,
        targetItems
      );
      const finalManifest = lodashSet(
        manifestWithNewTarget,
        `elements${sourceParentPath}`,
        sourceItems
      );

      set({ manifest: finalManifest });
    },
    updateElementProperties(id, { data, styles, label }) {
      const oldManifest = get().manifest;
      const elementMap = get().elementMap;
      if (!oldManifest || !elementMap[id]) return;
      const manifest = cloneObject(oldManifest);
      const element = elementMap[id];
      const oldElement = lodashGet(manifest, `elements${element.path}`) || {};
      const newManifest = lodashSet(manifest, `elements${element.path}`, {
        ...oldElement,
        label: label || element.label || id,
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
    clipboard: null,
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
  createThumb(manifest).catch(console.error);
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
