import { create } from "zustand";
import { IWidget, IWidgetElement } from "../../types/manifest";
import { subscribeWithSelector } from "zustand/middleware";
import lodashSet from "lodash.set";
import lodashGet from "lodash.get";
import debounce from "lodash.debounce";
import { updateManifest } from "../../main/utils/widgets";
import { useDataTrackStore } from "./useDataTrackStore";
import { arrayMove } from "@dnd-kit/sortable";
import { CSSProperties } from "react";

const cloneObject = <T>(obj: T) => {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export interface IManifestStore {
  manifest: IWidget | null;
  updateWidgetDimensions: (width: number, height: number) => void;
  updateManifest: (data: Partial<IWidget>) => void;
  updateElementProperties: (id: string, { data, styles }: { data?: any, styles?: IWidgetElement["styles"] }) => void;
  addElements: (element: IWidgetElement, parentId: string) => void;
  removeElement: (id: string) => void;
  moveElement: (id: string, dropId: string) => void;
  elementMap: Record<string, IWidgetElement & { path: string, index: number, parentPath: string, parentId: string | null }>,
  undoStack: { timestamp: string, data: IWidget }[];
  redoStack: { timestamp: string, data: IWidget }[];
  undo: () => void;
  redo: () => void;
  isUndoRedo: boolean;
}

export const useManifestStore = create<IManifestStore>()(subscribeWithSelector((set, get) => ({
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
  addElements(element, parentId) {
    const oldManifest = get().manifest;
    if (!oldManifest) return;
    const manifest = cloneObject(oldManifest);
    const elementPath = get().elementMap[parentId]?.path || "";
    const elementIndex = parentId ? lodashGet(manifest.elements, elementPath)?.children?.length : manifest.elements?.length;
    const newManifest = lodashSet(manifest, parentId ? `elements${elementPath}.children[${elementIndex}]` : `elements[${elementIndex}]`, element);

    set({
      manifest: {
        ...newManifest,
        elements: [...(newManifest.elements || [])]
      }
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
      (lodashGet(manifest, `elements${parentPath}`) || []).filter((_, index) => index !== elementIndex)
    );
    set({ manifest: newManifest });
  },
  moveElement(id, dropId) {
    const oldManifest = get().manifest;
    const elementMap = get().elementMap;
    if (!oldManifest || !elementMap[id] || !elementMap[dropId]) return;
    const manifest = cloneObject(oldManifest);
    const { index: activeIndex, parentPath: activeParentPath, parentId: activeParentId } = elementMap[id];
    const { index: overIndex, path: overPath, parentPath: overParentPath } = elementMap[dropId];

    if (activeParentPath === overParentPath) {
      const newManifest = lodashSet(
        manifest,
        `elements${overParentPath}`,
        arrayMove((lodashGet(manifest, `elements${overParentPath}`) || []), activeIndex, overIndex)
      );

      set({ manifest: newManifest });
    } else if (activeParentId !== dropId) {
      const updatedOverPath = `elements${dropId.startsWith("container") ? `${overPath}.children` : overParentPath}`
      const overItems = ((lodashGet(manifest, updatedOverPath) || []) as any[]);
      overItems.splice(overIndex + 1,
        0,
        { ...elementMap[id], parentId: undefined, parentPath: undefined, index: undefined, path: undefined }
      );

      let newManifest = lodashSet(
        manifest,
        `elements${activeParentPath}`,
        (lodashGet(manifest, `elements${activeParentPath}`) || []).filter((item: any) => item.id !== id)
      );
      newManifest = lodashSet(
        newManifest,
        updatedOverPath,
        overItems
      );

      set({ manifest: newManifest });
    }
  },
  updateElementProperties(id, { data, styles }) {
    const oldManifest = get().manifest;
    const elementMap = get().elementMap;
    if (!oldManifest || !elementMap[id]) return;
    const manifest = cloneObject(oldManifest);
    const element = elementMap[id];
    const oldElement = lodashGet(manifest, `elements${element.path}`) || {};
    const newManifest = lodashSet(
      manifest,
      `elements${element.path}`,
      {
        ...oldElement,
        data: {
          ...(element.data || {}),
          ...(data || {})
        },
        styles: {
          ...(element.styles || {}),
          ...(styles || {})
        },
      }
    );
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
      redoStack.push({ timestamp: new Date().toISOString(), data: cloneObject(currentState) });
      set({ manifest: undo.data, redoStack: redoStack.slice(), undoStack: undoStack.slice(), isUndoRedo: true });
    }
  },
  redo() {
    const currentState = get().manifest;
    const undoStack = get().undoStack.slice();
    const redoStack = get().redoStack.slice();
    const redo = redoStack.pop();
    if (redo && currentState) {
      undoStack.push({ timestamp: new Date().toISOString(), data: cloneObject(currentState) });
      set({ manifest: redo.data, redoStack: redoStack.slice(), undoStack: undoStack.slice(), isUndoRedo: true });
    }
  },
  isUndoRedo: false,
})));

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
    map[element.id] = { ...element, path: currentPath, parentPath: parentPath ? `${parentPath}.children` : "", index, parentId };

    if (element.children) {
      Object.assign(map, mapElementPaths(element.children, currentPath, currentId));
    }
  });

  return map;
}

useManifestStore.subscribe((state) => state.manifest?.elements, (elements) => {
  if (!elements) return;
  const elementMap = mapElementPaths(elements);
  useManifestStore.setState({ elementMap });
});

const debouncedUpdate = debounce((manifest: IWidget) => {
  useDataTrackStore.setState({ isSaving: true });
  updateManifest(manifest).catch(console.error).finally(() => {
    useDataTrackStore.setState({ isSaving: false, });
  });
}, 500);

const debouncedHistory = debounce((prevManifest: IWidget) => {
  if (!useManifestStore.getState().isUndoRedo) {
    const undoStack = useManifestStore.getState().undoStack.slice();
    undoStack.push({ timestamp: new Date().toISOString(), data: cloneObject(prevManifest) });
    while (undoStack.length > 50) {
      undoStack.shift();
    }
    useManifestStore.setState({ undoStack, redoStack: [], });
  }
  useManifestStore.setState({ isUndoRedo: false });
}, 700, { leading: true, trailing: false })

useManifestStore.subscribe(state => state.manifest, (manifest) => {
  if (!manifest) return;
  debouncedUpdate(manifest);
});
useManifestStore.subscribe(state => state.manifest, (_, prevManifest) => {
  if (!prevManifest) return;
  debouncedHistory(prevManifest)
});