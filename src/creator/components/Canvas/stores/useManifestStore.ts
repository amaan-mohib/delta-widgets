import { create } from "zustand";

export const useManifestStore = create(() => ({
  key: "",
  label: "",
  dimensions: { width: 400, height: 300 },
  elements: [],
  path: "",
}));