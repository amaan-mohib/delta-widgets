import { useEffect } from "react";
import { Button } from "@fluentui/react-components";
import Chat from "./components/Chat";
import { useChatStore } from "./stores/useChatStore";
import Navbar from "./components/Navbar";

import "./App.css";

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const { chatId, getAllChats, loadChat } = useChatStore();

  useEffect(() => {
    getAllChats();
  }, []);

  return (
    <main>
      <Navbar />
      {chatId ? (
        <Chat key={chatId} />
      ) : (
        <Button onClick={() => loadChat()}>Start new chat</Button>
      )}
    </main>
  );
};

export default App;
