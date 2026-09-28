import { useEffect, useRef } from "react";
import { Toaster } from "@fluentui/react-components";
import { listen } from "@tauri-apps/api/event";
import { trackInstall, trackUpdated } from "../common/analytics";
import Sidebar, { sidebarWidth } from "./components/Sidebar";
import { useDataStore } from "./stores/useDataStore";
import SettingsSidebar from "./components/Settings/Sidebar";
import Settings from "./components/Settings";
import AddWidgetDialog from "./components/AddWidgetDialog";
import WhatsNew from "./components/WhatsNew";
import WidgetList from "./components/WidgetList";
import { commands } from "../common/commands";
import WidgetSettingsDialog from "./components/WidgetSettings/WidgetSettingsDialog";
import { createWidgetWindow, duplicateWidget } from "./utils/widgets";
import Notifications from "./components/Notifications";
import "./App.css";
import { closeWidgetWindow } from "../common";

type DeepLinkEvent = { type: "upload" } | { type: "install"; key: string };

function App() {
  const showSettings = useDataStore((s) => s.showSettings);
  const deepLinkRef = useRef(false);
  const duplicateRef = useRef(false);
  const closeRef = useRef(false);

  useEffect(() => {
    useDataStore.getState().initData();
    trackInstall();
    trackUpdated();
  }, []);

  useEffect(() => {
    const unsub = listen<string>("creator-close", () => {
      const scrollY = window.scrollY;
      useDataStore
        .getState()
        .updateAllWidgets()
        .then(() => {
          useDataStore.setState({
            listRefreshKey: useDataStore.getState().listRefreshKey + 1,
          });
          setTimeout(() => {
            window.scrollTo({ top: scrollY });
          }, 500);
        });
    });

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  useEffect(() => {
    const unsub = listen<string>("focus-widget", ({ payload }) => {
      useDataStore.setState({
        activeTab: "installed",
        focusWidgetKey: payload,
      });
      setTimeout(() => {
        useDataStore.setState({ focusWidgetKey: null });
      }, 3000);
    });

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  useEffect(() => {
    if (duplicateRef.current) return;

    const unsub = listen<string>("duplicate-widget", async ({ payload }) => {
      const widget = useDataStore
        .getState()
        .installedWidgets.find((w) => w.key === payload);
      if (!widget) {
        return Promise.reject("No such widget found");
      }

      const duplicate = await duplicateWidget(widget.manifestPath, false, true);
      if (duplicate) {
        await createWidgetWindow(duplicate.path, false, false);
      }
      await useDataStore.getState().updateAllWidgets();
    });
    duplicateRef.current = true;

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  useEffect(() => {
    if (closeRef.current) return;

    const unsub = listen<{
      key: string;
      toggleVisibility?: boolean;
      isPreview?: boolean;
    }>(
      "close-widget",
      async ({ payload: { key, toggleVisibility, isPreview } }) => {
        const widget = useDataStore
          .getState()
          .installedWidgets.find((w) => w.key === key);
        if (!widget) {
          return Promise.reject("No such widget found");
        }

        await closeWidgetWindow(
          `widget${isPreview ? `-preview` : ""}-${key}`,
          toggleVisibility,
          widget.manifestPath,
        );
      },
    );
    closeRef.current = true;

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  useEffect(() => {
    if (deepLinkRef.current) return;

    const unsub = listen<DeepLinkEvent>("deep-link", async ({ payload }) => {
      switch (payload.type) {
        case "upload":
          await commands.createGalleryWindow({ url: `/dashboard/upload` });
          break;
        case "install":
          await commands.createGalleryWindow({
            url: `/widget/${payload.key}?install=true`,
          });
          break;
      }
    });
    deepLinkRef.current = true;

    return () => {
      unsub.then((f) => f());
    };
  }, []);

  return (
    <main className="container" style={{ position: "relative" }}>
      {showSettings ? <SettingsSidebar /> : <Sidebar />}

      <div
        style={{
          flex: 1,
          minHeight: "100vh",
          padding: "16px",
          paddingLeft: `${sidebarWidth + 16}px`,
          width: "100%",
        }}>
        {showSettings ? <Settings /> : <WidgetList />}
      </div>

      <AddWidgetDialog />
      <WhatsNew />
      <WidgetSettingsDialog />
      <Notifications />
      <Toaster toasterId={"toaster"} />
    </main>
  );
}

export default App;
