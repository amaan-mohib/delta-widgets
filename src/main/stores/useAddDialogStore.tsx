import { fileOrFolderPicker } from "../utils/widgets";
import { ILiteWidget } from "../../types/manifest";
import { create } from "zustand";

export interface IDialogState {
  open: boolean;
  type: "file" | "folder" | "url" | "none";
  path: string;
  manifest?: ILiteWidget | null;
  existingManifest?: Partial<ILiteWidget> | null;
}

interface IAddDialogStore {
  dialogState: IDialogState;
  setDialogState: (state: IDialogState) => void;
  resetDialogState: () => void;
  importHTML: (existingWidget?: ILiteWidget) => Promise<void>;
  importJSON: () => Promise<void>;
}

const defaultDialogState: IDialogState = {
  open: false,
  type: "none",
  path: "",
  manifest: null,
  existingManifest: null,
};

export const useAddDialogStore = create<IAddDialogStore>((set, get) => ({
  dialogState: defaultDialogState,
  setDialogState(state) {
    set({ dialogState: state });
  },
  resetDialogState() {
    set({
      dialogState: { ...defaultDialogState, type: get().dialogState.type },
    });
  },
  importHTML: async (existingWidget?: ILiteWidget) => {
    if (
      existingWidget &&
      existingWidget.widgetType === "html" &&
      existingWidget.file
    ) {
      get().setDialogState({
        open: true,
        type: "folder",
        path: existingWidget.file,
        manifest: null,
        existingManifest: {
          label: existingWidget.label,
          file: existingWidget.file,
          key: existingWidget.key,
          widgetType: "html",
          path: existingWidget.path,
        },
      });
      return;
    }

    const { path } = await fileOrFolderPicker({
      directory: true,
      title: "Select HTML folder",
    });
    if (path) get().setDialogState({ open: true, type: "folder", path });
  },
  importJSON: async () => {
    const { path, manifest } = await fileOrFolderPicker({
      title: "Select JSON file",
      extensions: ["json"],
    });
    if (path && manifest)
      get().setDialogState({
        open: true,
        type: "file",
        path,
        manifest,
      });
  },
}));
