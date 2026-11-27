import { create } from "zustand";
import { ILiteWidget, TWidgetWithDate } from "../../common/types/manifest";
import { createCreatorWindow, isWidgetInDraft } from "../utils/widgets";
import { sendMixpanelEvent } from "../../common/analytics";
import { commands } from "../../common/commands";
import { getVersion } from "@tauri-apps/api/app";
import { getInstalledAt, getStore } from "../../common";

export type TActiveTab = "installed" | "drafts";
export type TSettingsActiveTab = "general" | "theme" | "about";
export interface INotification {
  id: number;
  title: string;
  message: string;
  link?: string | null;
  created_at: string | Date;
}

const getVersions = async (keys: string[]) => {
  try {
    const searchParams = new URLSearchParams();
    keys.forEach((key) => {
      searchParams.append("keys", key);
    });
    const res = await commands.fetchRequest({
      url: `${import.meta.env.VITE_GALLERY_LINK}/api/updates?${searchParams.toString()}`,
    });
    const body = JSON.parse(res);
    return body;
  } catch (error) {
    console.error(error);
    return {};
  }
};

const getNotifications = async () => {
  try {
    const res = await commands.fetchRequest({
      url: `${import.meta.env.VITE_GALLERY_LINK}/api/notifications`,
    });
    const body = JSON.parse(res);
    return body as INotification[];
  } catch (error) {
    console.error(error);
    return [];
  }
};

interface IDataStore {
  installedWidgets: TWidgetWithDate[];
  draftWidgets: TWidgetWithDate[];
  activeTab: TActiveTab;
  settingsActiveTab: TSettingsActiveTab;
  loading: boolean;
  showSettings: boolean;
  setActiveTab: (tab: TActiveTab) => void;
  setSettingsActiveTab: (tab: TSettingsActiveTab) => void;
  updateAllWidgets: () => Promise<TWidgetWithDate[]>;
  updateInstalledWidget: (
    key: string,
    values: Pick<ILiteWidget, "alwaysOnTop" | "pinned" | "visible">,
  ) => void;
  createWidget: () => Promise<void>;
  editWidget: (widget: ILiteWidget) => Promise<void>;
  openWhatsNew: boolean;
  openingCreator: boolean;
  listRefreshKey: number;
  focusWidgetKey: string | null;
  initData: () => Promise<void>;
  galleryWidgetVersions: Record<string, { version: string; revision: number }>;
  lastSeenVersion: string;
  version: string;
  lastSeenNotificationAt: string | null;
  notifications: INotification[];
  openNotifications: boolean;
  renameWidget: ILiteWidget | null;
  openDonationBox: boolean;
}

export const useDataStore = create<IDataStore>((set, get) => ({
  installedWidgets: [],
  draftWidgets: [],
  loading: true,
  activeTab: "installed",
  setActiveTab(tab) {
    set({ activeTab: tab });
  },
  async initData() {
    const installedWidgets = await get().updateAllWidgets();
    const galleryWidgets = installedWidgets
      .filter((w) => !!w.isGalleryWidget)
      .map((w) => w.key);

    const [
      updates,
      version,
      notifications,
      {
        lastSeenVersion = "0",
        lastSeenNotificationAt = null,
        lastSeenDonationAt = null,
        didClickDonate = false,
      },
      installedAt,
    ] = await Promise.all([
      getVersions(galleryWidgets),
      getVersion(),
      getNotifications(),
      getStore(),
      getInstalledAt(),
    ]);
    let openDonationBox = false;
    const hasEnabledWidgets =
      installedWidgets.filter((item) => !!item.visible).length > 0;

    if (!didClickDonate && hasEnabledWidgets) {
      const createdAt = installedAt || new Date();
      const lastDonationShowAt = new Date(lastSeenDonationAt || createdAt);
      openDonationBox =
        Date.now() - lastDonationShowAt.getTime() >=
        (lastSeenDonationAt ? 30 : 5) * 86400 * 1000;
    }

    set({
      galleryWidgetVersions: updates,
      version,
      lastSeenVersion,
      lastSeenNotificationAt,
      notifications,
      openDonationBox,
    });
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
          createdAt: widget.createdAt,
          manifestPath: widget.manifestPath,
          thumbPath: widget.thumbPath,
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

      return installedWidgets;
    } catch (error) {
      console.error(error);
      return [];
    }
  },
  updateInstalledWidget(key, values) {
    const installedWidgets = get().installedWidgets;
    set({
      installedWidgets: installedWidgets.map((item) =>
        item.key === key ? { ...item, ...values } : item,
      ),
    });
  },
  createWidget: async () => {
    try {
      sendMixpanelEvent("created_new", {}).catch(console.error);
      await createCreatorWindow();
      get().updateAllWidgets();
    } catch (error) {
      console.error(error);
    }
  },
  editWidget: async (widget: ILiteWidget) => {
    try {
      const draftPath = await isWidgetInDraft(widget.key);
      await createCreatorWindow(draftPath, widget.path);
      get().setActiveTab("drafts");
      get().updateAllWidgets();
    } catch (error) {
      console.error(error);
    }
  },
  settingsActiveTab: "about",
  setSettingsActiveTab(tab) {
    set({ settingsActiveTab: tab });
  },
  showSettings: false,
  openWhatsNew: false,
  openingCreator: false,
  listRefreshKey: 0,
  focusWidgetKey: null,
  lastSeenVersion: "0",
  version: "0",
  lastSeenNotificationAt: null,
  galleryWidgetVersions: {},
  notifications: [],
  openNotifications: false,
  renameWidget: null,
  openDonationBox: false,
}));
