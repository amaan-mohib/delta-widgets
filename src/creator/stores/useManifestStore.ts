import { create } from "zustand";
import { IWidget, IWidgetElement } from "../../types/manifest";
import { subscribeWithSelector } from "zustand/middleware";
import lodashSet from "lodash.set";
import lodashGet from "lodash.get";
import debounce from "lodash.debounce";
import unset from "lodash.unset";
import { updateManifest } from "../../main/utils/widgets";
import { useDataTrackStore } from "./useDataTrackStore";

const cloneObject = <T>(obj: T) => {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export interface IManifestStore {
  manifest: IWidget | null;
  updateWidgetDimensions: (width: number, height: number) => void;
  updateManifest: (data: Partial<IWidget>) => void;
  addElements: (element: IWidgetElement, parentId: string) => void;
  removeElement: (path: string) => void;
  elementMap: Record<string, IWidgetElement & { path: string }>,
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
  removeElement(path) {
    const oldManifest = get().manifest;
    if (!oldManifest) return;
    const manifest = cloneObject(oldManifest);
    const parentPath = `${path.split(".").slice(0, -1).join(".")}.children`;
    unset(manifest, `elements${path}`);
    const newManifest = lodashSet(
      manifest,
      `elements${parentPath}`,
      (lodashGet(manifest, `elements${parentPath}`) || []).filter((item: any) => !!item)
    );
    set({ manifest: newManifest });
  },
  elementMap: {
    "container": {
      id: "container",
      type: "container",
      children: [],
      path: "[0]",
      styles: {},
    }
  }
})));

function mapElementPaths(
  elements: IWidgetElement[],
  parentPath: string = ""
) {
  let map: IManifestStore["elementMap"] = {};

  elements.forEach((element, index) => {
    const currentPath = parentPath
      ? `${parentPath}.children[${index}]`
      : `[${index}]`;
    map[element.id] = { ...element, path: currentPath };

    if (element.children) {
      Object.assign(map, mapElementPaths(element.children, currentPath));
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
    useDataTrackStore.setState({ isSaving: false });
  });
}, 500);

useManifestStore.subscribe(state => state.manifest, manifest => {
  if (!manifest) return;
  debouncedUpdate(manifest);
});