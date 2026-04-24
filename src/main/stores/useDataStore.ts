import { create } from "zustand";
import { IWidget } from "../../types/manifest";
import {
  createCreatorWindow,
  getManifestFromPath,
  isWidgetInDraft,
} from "../utils/widgets";
import { sendMixpanelEvent } from "../utils/analytics";
import { invoke } from "@tauri-apps/api/core";

export type TActiveTab = "installed" | "drafts" | "marketplace";
export type TSettingsActiveTab = "general" | "theme" | "about";
interface IDataStore {
  installedWidgets: IWidget[];
  draftWidgets: IWidget[];
  activeTab: TActiveTab;
  settingsActiveTab: TSettingsActiveTab;
  loading: boolean;
  showSettings: boolean;
  setActiveTab: (tab: TActiveTab) => void;
  setSettingsActiveTab: (tab: TSettingsActiveTab) => void;
  updateAllWidgets: () => Promise<void>;
  createWidget: () => Promise<void>;
  editWidget: (widgetPath: string) => Promise<void>;
}

interface IGetAllWidget {
  manifest: IWidget;
  path: string;
  modifiedAt: number;
  isDraft: boolean;
}
type TWidgetWithDate = IWidget & { modifiedAt: number };

export const useDataStore = create<IDataStore>((set, get) => ({
  installedWidgets: [],
  draftWidgets: [],
  loading: true,
  activeTab: "installed",
  setActiveTab(tab) {
    set({ activeTab: tab });
  },
  updateAllWidgets: async () => {
    try {
      set({ loading: true });

      const allWidgets = await invoke<IGetAllWidget[]>("get_all_widgets");
      const installedWidgets: TWidgetWithDate[] = [];
      const draftWidgets: TWidgetWithDate[] = [];
      allWidgets.forEach((widget) => {
        const obj = {
          ...widget.manifest,
          path: widget.path,
          modifiedAt: widget.modifiedAt,
        };
        if (widget.isDraft) {
          draftWidgets.push(obj);
        } else {
          installedWidgets.push(obj);
        }
      });

      set({
        installedWidgets: installedWidgets.sort((a, b) =>
          a.label > b.label ? 1 : b.label > a.label ? -1 : 0,
        ),
        draftWidgets: draftWidgets.sort((a, b) =>
          a.modifiedAt > b.modifiedAt
            ? -1
            : b.modifiedAt > a.modifiedAt
              ? 1
              : 0,
        ),
        loading: false,
      });
    } catch (error) {
      console.error(error);
    }
  },
  createWidget: async () => {
    sendMixpanelEvent("created_new", {}).catch(console.error);
    await createCreatorWindow();
    get().updateAllWidgets();
  },
  editWidget: async (widgetPath: string) => {
    const widget = await getManifestFromPath(widgetPath);
    if (!widget) return;
    const draftPath = await isWidgetInDraft(widget.key);
    await createCreatorWindow(draftPath, widget);
    get().setActiveTab("drafts");
    get().updateAllWidgets();
  },
  settingsActiveTab: "about",
  setSettingsActiveTab(tab) {
    set({ settingsActiveTab: tab });
  },
  showSettings: false,
}));
