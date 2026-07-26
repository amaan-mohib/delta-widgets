import { Button, tokens } from "@fluentui/react-components";
import { BotSparkleColor } from "@fluentui/react-icons";
import React from "react";
import ChatInput from "./ChatInput";
import { useChatStore } from "../stores/useChatStore";

interface EmptyChatProps {}

const EmptyChat: React.FC<EmptyChatProps> = () => {
  const { loadChat } = useChatStore();

  const handleSend = async (text: string) => {
    useChatStore.setState({ pendingMessage: text });
    await loadChat();
  };

  return (
    <div className="container" style={{ position: "relative" }}>
      <div
        className="message-container"
        style={{ alignItems: "center", justifyContent: "center" }}>
        <BotSparkleColor fontSize={32} />
        <h3 style={{ textAlign: "center" }}>Hey! How can I help you today?</h3>
        <Button
          appearance="subtle"
          style={{
            textAlign: "center",
            color: tokens.colorNeutralForeground3,
          }}
          onClick={() => handleSend("Hey, how can you help me?")}>
          Not sure where to start? Ask what I can help with.
        </Button>
      </div>
      <ChatInput
        buttonDisabled={false}
        sendMessage={handleSend}
        scrollToBottom={() => {}}
      />
    </div>
  );
};

export default EmptyChat;
