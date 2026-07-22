import { useEffect, useState } from "react";
import Chat from "./components/Chat";
import { useChatStore } from "./stores/useChatStore";
import Navbar from "./components/Navbar";
import Settings from "./components/Settings";
import { nanoid } from "nanoid";
import { Spinner } from "@fluentui/react-components";

import "./App.css";

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const {
    loading,
    chatId,
    loadChat,
    getAllChats,
    getAllModels,
    selectedModel,
    selectedModelId,
    settingsScreen,
    models,
  } = useChatStore();
  const [chatKey, setChatKey] = useState("");

  useEffect(() => {
    (async () => {
      if (chatId) {
        await loadChat(chatId);
      }
      setChatKey(nanoid());
    })();
  }, [chatId, selectedModelId]);

  const init = async () => {
    useChatStore.setState({ loading: true });
    await Promise.all([getAllChats(), getAllModels()]);
    useChatStore.setState({ loading: false });
  };

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (models.length === 0 || !selectedModelId) {
      useChatStore.setState({
        settingsScreen: "model",
      });
    }
  }, [models, selectedModelId, loading]);

  if (loading)
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

  return (
    <main>
      <Navbar />
      <Settings />
      {settingsScreen === null && selectedModel && <Chat key={chatKey} />}
    </main>
  );
};

export default App;
