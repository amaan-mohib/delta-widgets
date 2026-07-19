import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { CustomChatTransport } from "../lib/customChatTransport";
import { ollama } from "ai-sdk-ollama";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import Markdown from "react-markdown";
import {
  Button,
  Skeleton,
  SkeletonItem,
  Toaster,
  tokens,
} from "@fluentui/react-components";
import { ArrowDownRegular } from "@fluentui/react-icons";
import { useChatStore } from "../stores/useChatStore";
import remarkGfm from "remark-gfm";
import MediaToolOutput from "./MediaToolOutput";
import ChatInput from "./ChatInput";

interface ChatProps {}

const Chat: React.FC<ChatProps> = () => {
  // const model = ollama("phi4-mini:3.8b-q4_K_M");
  // const model = createGoogleGenerativeAI({
  //   apiKey: import.meta.env.VITE_GEMINI_KEY,
  // })("gemini-2.5-flash");
  const model = createOpenRouter({
    apiKey: import.meta.env.VITE_OPEN_ROUTER_KEY,
  })("openrouter/free");
  const { chatId, initialMessages, updateChatName, loadChat, pendingMessage } =
    useChatStore();
  const { messages, sendMessage, status } = useChat({
    id: chatId!,
    messages: initialMessages,
    transport: new CustomChatTransport(model, updateChatName),
    experimental_throttle: 50,
  });
  const containerRef = useRef(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (pendingMessage && chatId) {
      sendMessage({ text: pendingMessage });
      useChatStore.setState({ pendingMessage: null });
    }
  }, [pendingMessage, chatId, sendMessage]);

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    // Check if the user has scrolled up away from the bottom (with 50px buffer)
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="container" style={{ position: "relative" }}>
      {chatId ? (
        <div
          className="message-container"
          ref={containerRef}
          onScroll={handleScroll}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${message.role === "user" ? "user-message" : "ai-message"}`}
              style={{
                backgroundColor:
                  message.role === "user" ? tokens.colorBrandBackground : "",
              }}>
              {message.parts?.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <Markdown
                      key={`${message.id}-text-${i}`}
                      remarkPlugins={[remarkGfm]}>
                      {part.text}
                    </Markdown>
                  );
                }
                if (part.type.startsWith("tool-")) {
                  return (
                    <div
                      key={`${message.id}-${part.type}-${i}`}
                      style={{ padding: "2px 0", fontSize: 12 }}>
                      {part.type === "tool-read_widget_schema"
                        ? "Gathering widget schema and examples"
                        : null}
                      {part.type === "tool-write_json_widget" ||
                      part.type === "tool-write_html_widget"
                        ? "Creating widget"
                        : null}
                      {part.type === "tool-update_json_widget" ||
                      part.type === "tool-update_html_widget"
                        ? "Updating widget"
                        : null}
                      {part.type === "tool-query_media_history" && (
                        <MediaToolOutput part={part} />
                      )}
                    </div>
                  );
                }
              })}
              {status === "ready" &&
              message.role === "assistant" &&
              (message.parts || []).filter((i) => i.type === "text").length ===
                0 ? (
                <div key={`error-${messages.length}`} className="error-message">
                  An error occurred while streaming the response. Please try
                  again.
                </div>
              ) : null}
            </div>
          ))}
          {status === "submitted" || status === "streaming" ? (
            <Skeleton>
              <SkeletonItem size={32} />
            </Skeleton>
          ) : null}

          {status === "error" ? (
            <div className="error-message">
              An error occurred while sending the message. Please try again.
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      ) : (
        <div
          className="message-container"
          style={{ alignItems: "center", justifyContent: "center" }}>
          <h3 style={{ textAlign: "center" }}>
            Hey! How can I help you today?
          </h3>
          <span
            style={{
              textAlign: "center",
              color: tokens.colorNeutralForeground3,
            }}>
            Not sure where to start? Ask what I can help with.
          </span>
        </div>
      )}
      {showButton && (
        <Button
          onClick={scrollToBottom}
          icon={<ArrowDownRegular />}
          appearance="primary"
          shape="circular"
          size="large"
          style={{
            position: "absolute",
            bottom: "70px",
            left: "10px",
          }}
        />
      )}
      <ChatInput
        buttonDisabled={status === "submitted" || status === "streaming"}
        sendMessage={async (text) => {
          if (!chatId) {
            await loadChat();
            useChatStore.setState({ pendingMessage: text });
            return;
          }
          await sendMessage({ text });
        }}
        scrollToBottom={scrollToBottom}
      />
      <Toaster toasterId={"chat-toaster"} />
    </div>
  );
};

export default Chat;
