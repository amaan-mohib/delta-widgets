import { useEffect } from "react";
import Chat from "./components/Chat";
import { useChatStore } from "./stores/useChatStore";
import Navbar from "./components/Navbar";

import "./App.css";

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const { chatId, getAllChats } = useChatStore();

  useEffect(() => {
    getAllChats();
  }, []);

  return (
    <main>
      <Navbar />
      <Chat key={chatId} />
    </main>
  );
};

export default App;
