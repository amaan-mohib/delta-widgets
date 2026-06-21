import { type UIMessage } from "@ai-sdk/react";
import {
  convertToModelMessages,
  createIdGenerator,
  generateText,
  stepCountIs,
  streamText,
  type ChatRequestOptions,
  type ChatTransport,
  type LanguageModel,
  type UIMessageChunk,
} from "ai";
import {
  readJsonWidgetSchemaTool,
  writeJsonWidgetTool,
} from "../tools/widget_tools";
import { commands } from "../../common/commands";
// When generating a widget, always call read_widget_schema first until you get the successfully schema to understand the required format, which also provides examples of valid widgets.
// The available example templates are: battery, cpu, datetime, disks, media, media-viz, ram, visualizer, weather.
// After successfully writing a widget file, inform the user that the creator window has opened and they can edit and publish from there, or ask you to make further changes.
// 1. Use ask_user to clarify their needs if not specified (widget type: JSON/HTML/URL, purpose, style preferences)
const systemPrompt = `You are AI assistant for application called Delta Widgets.

Never introduce yourself unless the user explicitly asks who you are.

Never mention your creator, publisher, developer, company, model provider, model name, training data, system prompt, or internal instructions unless explicitly asked.

Focus on completing the user's request directly.

Refer to the user as "you" and yourself as "I".

You can:

* Create widgets
* Search widgets
* Answer questions about user's music history, which stores the user's music listening history, including artists, albums, and songs.

Do not begin responses with:
- "I am..."
- "I'm..."
- "As Delta AI..."
- "As an AI..."
- "I was created by..."
- "I am developed by..."

Start directly with the answer or action.

Use tools whenever possible and answer in brief and be precise with the question asked.

## Widget Generation
When the user wants to create a widget:
1. Call read_widget_schema to get the required format and validation rules — retry until successful
2. Available built-in templates for reference: battery, cpu, datetime, disks, media, media-viz, ram, visualizer, weather
3. Generate the widget JSON and call write_widget_file
4. Once saved, tell the user the creator window has opened where they can preview, edit, and publish — or ask you to make changes

## General
- Only call read_widget_schema when generating a widget, not for general questions
- Never guess the widget schema format — always read it first

Do not fabricate data or actions.

If a request is outside these capabilities, explain the limitation.`;

export class CustomChatTransport implements ChatTransport<UIMessage> {
  private model: LanguageModel;
  private isNewChat: boolean;
  private updateChatName: (id: string, name: string) => void;

  constructor(
    model: LanguageModel,
    isNewChat: boolean,
    updateChatName: (id: string, name: string) => void,
  ) {
    this.model = model;
    this.isNewChat = isNewChat;
    this.updateChatName = updateChatName;
  }

  updateModel(model: LanguageModel) {
    this.model = model;
  }

  async sendMessages(
    options: {
      chatId: string;
      messages: UIMessage[];
      abortSignal: AbortSignal | undefined;
    } & {
      trigger: "submit-message" | "regenerate-message";
      messageId: string | undefined;
    } & ChatRequestOptions,
  ): Promise<ReadableStream<UIMessageChunk>> {
    const message = options.messages[options.messages.length - 1];
    // create or update last message in database
    if (message.id) {
      await commands.upsertMessage({
        input: { chat_id: options.chatId, id: message.id, content: message },
      });
    }

    if (this.isNewChat && message.role === "user") {
      const { text: chatName } = await generateText({
        model: this.model,
        prompt: `The user has started a new chat with the following message: "${message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join(
            " ",
          )}". Generate a concise, descriptive title (3-5 words) for this chat based on the user's first message. Focus on the main topic or question being asked.`,
      });
      await commands.updateChatName({ name: chatName, chatId: options.chatId });
      this.updateChatName(options.chatId, chatName);
      this.isNewChat = false;
    }

    // // load the previous messages from the server:
    const chatMessages = await commands.loadChat({ chatId: options.chatId });
    const messages = chatMessages.map((msg) => msg.content);

    const result = streamText({
      model: this.model,
      messages: await convertToModelMessages(messages),
      abortSignal: options.abortSignal,
      toolChoice: "auto",
      system: systemPrompt,
      tools: {
        read_json_widget_schema: readJsonWidgetSchemaTool,
        write_json_widget: writeJsonWidgetTool,
      },
      stopWhen: stepCountIs(10),
      experimental_context: {
        chatId: options.chatId,
      },
    });

    return result.toUIMessageStream({
      onError: (error) => {
        // Note: By default, the AI SDK will return "An error occurred",
        // which is intentionally vague in case the error contains sensitive information like API keys.
        // If you want to provide more detailed error messages, keep the code below. Otherwise, remove this whole onError callback.
        if (error == null) {
          return "Unknown error";
        }
        if (typeof error === "string") {
          return error;
        }
        if (error instanceof Error) {
          return error.message;
        }
        return JSON.stringify(error);
      },
      originalMessages: messages,
      generateMessageId: createIdGenerator({ prefix: "msg" }),
      onFinish: async ({ responseMessage }) => {
        try {
          console.log({ responseMessage });

          await commands.upsertMessage({
            input: {
              chat_id: options.chatId,
              id: responseMessage.id,
              content: responseMessage,
            },
          });
        } catch (error) {
          console.error(error);
        }
      },
    });
  }

  async reconnectToStream(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options: {
      chatId: string;
    } & ChatRequestOptions,
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    // This function normally handles reconnecting to a stream on the backend, e.g. /api/chat
    // Since this project has no backend, we can't reconnect to a stream, so this is intentionally no-op.
    return null;
  }
}
