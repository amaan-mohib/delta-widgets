import { Button, tokens, useToastController } from "@fluentui/react-components";
import { SendRegular } from "@fluentui/react-icons";
import React, {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { useChatStore } from "../stores/useChatStore";

interface IChatInputProps {
  sendMessage: (message: string) => Promise<void>;
  buttonDisabled: boolean;
  scrollToBottom: () => void;
}

const ChatInput: React.FC<IChatInputProps> = ({
  sendMessage,
  buttonDisabled,
  scrollToBottom,
}) => {
  const { chatKey, selectedModelId } = useChatStore();
  const [text, setText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { dispatchToast } = useToastController("chat-toaster");

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight + 2, 150)}px`;
    }
  }, [text]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [chatKey, selectedModelId]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (buttonDisabled || !text.trim()) return;

    scrollToBottom();
    const oldInput = text;
    try {
      setText("");
      await sendMessage(text);
    } catch (error) {
      setText(oldInput);
      dispatchToast("Something went wrong. Please try again.");
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div
      style={{ background: tokens.colorNeutralCardBackgroundSelected }}
      className="input-container">
      <textarea
        id="chat-input"
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask something..."
        rows={1}
        style={{
          background: tokens.colorNeutralCardBackgroundSelected,
          width: "100%",
          resize: "none",
          overflowY: "auto",
          maxHeight: "150px",
          padding: "8px 0",
          border: "none",
          outline: "none",
          fontSize: "14px",
          fontFamily: "inherit",
        }}
      />
      {text.trim() && (
        <Button
          disabled={buttonDisabled}
          icon={<SendRegular />}
          onClick={handleSend}
          appearance="primary"
        />
      )}
    </div>
  );
};

export default ChatInput;
