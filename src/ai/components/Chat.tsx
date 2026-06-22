import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { CustomChatTransport } from "../lib/customChatTransport";
import { ollama } from "ai-sdk-ollama";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import Markdown from "react-markdown";
import {
  Button,
  Input,
  Skeleton,
  SkeletonItem,
  Textarea,
  Toaster,
  tokens,
  useToastController,
} from "@fluentui/react-components";
import { ArrowDownRegular, SendRegular } from "@fluentui/react-icons";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useChatStore } from "../stores/useChatStore";

interface ChatProps {}

const Chat: React.FC<ChatProps> = () => {
  const [input, setInput] = useState("");
  // const model = ollama("phi4-mini:3.8b-q4_K_M");
  // const model = createGoogleGenerativeAI({
  //   apiKey: import.meta.env.VITE_GEMINI_KEY,
  // })("gemini-2.5-flash");
  const model = createOpenRouter({
    apiKey: import.meta.env.VITE_OPEN_ROUTER_KEY,
  })("openrouter/free");
  const { chatId, initialMessages, isNewChat, updateChatName } = useChatStore();
  const { messages, sendMessage, status, addToolOutput } = useChat({
    id: chatId!,
    messages: initialMessages,
    transport: new CustomChatTransport(model, isNewChat, updateChatName),
    experimental_throttle: 50,
    // sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    // async onToolCall({ toolCall }) {
    //   // Check if it's a dynamic tool first for proper type narrowing
    //   if (toolCall.dynamic) {
    //     return;
    //   }

    //   if (toolCall.toolName === "getWeatherInformation") {
    //     try {
    //       const getWeatherInformation = async (input: string) => {
    //         // Simulate fetching weather information based on the input
    //         // In a real-world scenario, you would call an actual weather API here
    //         return `The weather in ${input} is sunny with a high of 25°C.`;
    //       };
    //       const weather = await getWeatherInformation(toolCall.input as string);

    //       // No await - avoids potential deadlocks
    //       addToolOutput({
    //         tool: "getWeatherInformation",
    //         toolCallId: toolCall.toolCallId,
    //         output: weather,
    //       });
    //     } catch (err) {
    //       addToolOutput({
    //         tool: "getWeatherInformation",
    //         toolCallId: toolCall.toolCallId,
    //         state: "output-error",
    //         errorText: "Unable to get the weather information",
    //       });
    //     }
    //   }
    // },
  });
  const containerRef = useRef(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showButton, setShowButton] = useState(false);

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

  useEffect(() => {
    console.log({ messages });
  }, [messages]);

  const { dispatchToast } = useToastController("chat-toaster");

  return (
    <div className="container" style={{ position: "relative" }}>
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
                  <Markdown key={`${message.id}-text-${i}`}>
                    {part.text}
                  </Markdown>
                );
              }
              if (part.type.startsWith("tool-")) {
                return (
                  <div
                    key={`${message.id}-${part.type}-${i}`}
                    style={{ padding: "2px 0", fontSize: 12 }}>
                    {part.type === "tool-read_json_widget_schema"
                      ? "Reading widget schema"
                      : null}
                    {part.type === "tool-write_json_widget"
                      ? "Creating widget"
                      : null}
                    {part.type === "tool-update_json_widget"
                      ? "Updating widget"
                      : null}
                    {/* <strong>Tool:</strong> {part.type.replace("tool-", "")} */}
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
            <div ref={bottomRef} />
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
      </div>
      {showButton && (
        <Button
          onClick={scrollToBottom}
          icon={<ArrowDownRegular />}
          appearance="primary"
          shape="circular"
          // size="large"
          style={{ position: "absolute", bottom: "80px", left: "20px" }}>
          New messages
        </Button>
      )}
      <form
        className="input-container"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!input.trim()) return;
          const oldInput = input;
          try {
            setInput("");
            await sendMessage({ text: input });
          } catch (error) {
            setInput(oldInput);
            dispatchToast("Something went wrong. Please try again.");
            console.error("Failed to send message:", error);
          }
        }}>
        <Textarea
          value={input}
          rows={1}
          placeholder="Say something..."
          onChange={(e) => setInput(e.target.value)}
          style={{ width: "100%" }}
        />
        <Button
          style={{ height: "fit-content" }}
          icon={<SendRegular />}
          type="submit"
          appearance="primary"
          disabled={
            !input.trim() || status === "submitted" || status === "streaming"
          }>
          Send
        </Button>
      </form>
      <Toaster toasterId={"chat-toaster"} />
    </div>
  );
};

export default Chat;
