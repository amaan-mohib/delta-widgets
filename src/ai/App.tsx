import { useEffect } from "react";
import Chat from "./components/Chat";
import { useChatStore } from "./stores/useChatStore";
import Navbar from "./components/Navbar";
import Settings from "./components/Settings";
import { Spinner } from "@fluentui/react-components";
import EmptyChat from "./components/EmptyChat";

import "./App.css";

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const {
    loading,
    chatId,
    getAllChats,
    getAllModels,
    selectedModel,
    settingsScreen,
    chatKey,
  } = useChatStore();

  const shouldShowChat = settingsScreen === null && selectedModel;

  const init = async () => {
    useChatStore.setState({ loading: true });
    await Promise.all([getAllChats(), getAllModels()]);
    useChatStore.setState({ loading: false });
  };

  useEffect(() => {
    init();
  }, []);

  if (loading) {
    return (
      <main
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <Spinner />
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <Settings />
      {shouldShowChat && (chatId ? <Chat key={chatKey} /> : <EmptyChat />)}
    </main>
  );
};

export default App;
