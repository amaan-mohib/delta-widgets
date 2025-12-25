import { create } from "zustand";
import { IWidget } from "../../types/manifest";
import { createCreatorWindow, getAllWidgets } from "../utils/widgets";
import { sendMixpanelEvent } from "../utils/analytics";

export type TActiveTab = "installed" | "drafts";
interface IDataStore {
  installedWidgets: IWidget[];
  draftWidgets: IWidget[];
  activeTab: TActiveTab;
  loading: boolean;
  setActiveTab: (tab: TActiveTab) => void;
  updateAllWidgets: () => Promise<void>;
  createWidget: () => Promise<void>;
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
    const [installedWidgets, draftWidgets] = await Promise.all([
      getAllWidgets(),
      getAllWidgets(true),
    ]);
    set({
      installedWidgets: Object.values(installedWidgets).sort((a, b) =>
        a.label > b.label ? 1 : b.label > a.label ? -1 : 0
      ),
      draftWidgets: Object.values(draftWidgets).sort((a, b) =>
        a.label > b.label ? 1 : b.label > a.label ? -1 : 0
      ),
      loading: false,
    });
  },
  createWidget: async () => {
    sendMixpanelEvent("created_new", {}).catch(console.error);
    await createCreatorWindow();
    get().updateAllWidgets();
  },
}));
