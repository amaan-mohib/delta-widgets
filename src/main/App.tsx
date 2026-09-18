import { useEffect, useRef } from "react";
import { Toaster } from "@fluentui/react-components";
import { listen } from "@tauri-apps/api/event";
import { trackInstall, trackUpdated } from "./utils/analytics";
import Sidebar, { sidebarWidth } from "./components/Sidebar";
import { useDataStore } from "./stores/useDataStore";
import SettingsSidebar from "./components/Settings/Sidebar";
import Settings from "./components/Settings";
import AddWidgetDialog from "./components/AddWidgetDialog";
import WhatsNew from "./components/WhatsNew";
import WidgetList from "./components/WidgetList";
import "./App.css";
import { commands } from "../common/commands";

type DeepLinkEvent = { type: "upload" } | { type: "install"; key: string };

function App() {
  const { updateAllWidgets, showSettings } = useDataStore();
  const deepLinkRef = useRef(false);

  useEffect(() => {
    updateAllWidgets();
    trackInstall();
    trackUpdated();
  }, []);

  useEffect(() => {
    const unsub = listen<string>("creator-close", () => {
      const scrollY = window.scrollY;
      updateAllWidgets().then(() => {
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
      <Toaster toasterId={"toaster"} />
    </main>
  );
}

export default App;
