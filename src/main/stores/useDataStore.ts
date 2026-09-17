import { create } from "zustand";
import { ILiteWidget, TWidgetWithDate } from "../../common/types/manifest";
import { createCreatorWindow, isWidgetInDraft } from "../utils/widgets";
import { sendMixpanelEvent } from "../utils/analytics";
import { commands } from "../../common/commands";

export type TActiveTab = "installed" | "drafts";
export type TSettingsActiveTab = "general" | "theme" | "about";
interface IDataStore {
  installedWidgets: TWidgetWithDate[];
  draftWidgets: TWidgetWithDate[];
  activeTab: TActiveTab;
  settingsActiveTab: TSettingsActiveTab;
  loading: boolean;
  showSettings: boolean;
  setActiveTab: (tab: TActiveTab) => void;
  setSettingsActiveTab: (tab: TSettingsActiveTab) => void;
  updateAllWidgets: () => Promise<void>;
  createWidget: () => Promise<void>;
  editWidget: (widget: ILiteWidget) => Promise<void>;
  openWhatsNew: boolean;
  openingCreator: boolean;
  listRefreshKey: number;
}

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
      const allWidgets = await commands.getAllWidgets();
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
          a.label.localeCompare(b.label),
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
  editWidget: async (widget: ILiteWidget) => {
    const draftPath = await isWidgetInDraft(widget.key);
    await createCreatorWindow(draftPath, widget.path);
    get().setActiveTab("drafts");
    get().updateAllWidgets();
  },
  settingsActiveTab: "about",
  setSettingsActiveTab(tab) {
    set({ settingsActiveTab: tab });
  },
  showSettings: false,
  openWhatsNew: false,
  openingCreator: false,
  listRefreshKey: 0,
}));
