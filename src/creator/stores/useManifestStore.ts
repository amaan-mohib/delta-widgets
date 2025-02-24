import { create } from "zustand";
import { IWidget } from "../../main/utils/widgets";

export const useManifestStore = create<IWidget>(() => ({
  key: "",
  label: "",
  dimensions: { width: 400, height: 300 },
  elements: [],
  path: "",
}));