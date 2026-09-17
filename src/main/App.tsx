import { useEffect } from "react";
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

function App() {
  const { updateAllWidgets, showSettings } = useDataStore();

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
        <Settings />
        <WidgetList />
      </div>

      <AddWidgetDialog />
      <WhatsNew />
      <Toaster toasterId={"toaster"} />
    </main>
  );
}

export default App;
