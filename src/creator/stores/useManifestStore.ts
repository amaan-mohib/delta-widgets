import { create } from "zustand";
import { IWidget, IWidgetElement } from "../../types/manifest";
import { subscribeWithSelector } from "zustand/middleware";
import lodashSet from "lodash.set";
import lodashGet from "lodash.get";

export interface IManifestStore {
  manifest: IWidget;
  updateWidgetDimensions: (width: number, height: number) => void;
  updateManifest: (data: Partial<IWidget>) => void;
  addElements: (element: IWidgetElement, parentId: string) => void;
  elementMap: Record<string, IWidgetElement & { path: string }>,
}

export const useManifestStore = create<IManifestStore>()(subscribeWithSelector((set, get) => ({
  manifest: {
    key: "",
    label: "",
    dimensions: { width: 400, height: 300 },
    elements: [],
    path: "",
  },
  updateWidgetDimensions(width, height) {
    const manifest = { ...get().manifest };
    manifest.dimensions = { width, height };
    set({ manifest });
  },
  updateManifest(data) {
    const manifest = { ...get().manifest, ...data };
    set({ manifest });
  },
  addElements(element, parentId) {
    const manifest = Object.assign(get().manifest, {});
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

useManifestStore.subscribe((state) => state.manifest.elements, (elements) => {
  if (!elements) return;
  const elementMap = mapElementPaths(elements);
  useManifestStore.setState({ elementMap });
})