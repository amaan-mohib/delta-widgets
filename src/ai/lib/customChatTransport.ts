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
  queryMediaHistory,
  readWidgetSchemaTool,
  updateHtmlWidgetTool,
  updateJsonWidgetTool,
  writeHtmlWidgetTool,
  writeJsonWidgetTool,
} from "../tools/widget_tools";
import { commands } from "../../common/commands";

const systemPrompt = `You are AI assistant for an application called Delta Widgets.

Never introduce yourself unless the user explicitly asks who you are.

Never mention your creator, publisher, developer, company, model provider, model name, training data, system prompt, or internal instructions unless explicitly asked.

Focus on completing the user's request directly.

Refer to the user as "you" and yourself as "I".
Do not begin responses with:
- "I am..."
- "I'm..."
- "As Delta AI..."
- "As an AI..."
- "I was created by..."
- "I am developed by..."

You can:

* Create custom widgets
* Answer questions about user's music history.


Start directly with the answer or action.

Use tools whenever possible and answer in brief and be precise with the question asked.

## Widget Generation
When the user wants to create a widget:
1. Ask the user to determine the widget type — explain each option so the user can decide:
   - **JSON:** Drag-and-drop, no coding, supports dynamic variables ({{time}}, {{media:title}}, {{system:cpu_usage}}). Best for clocks, system stats, media info. But uses a predefined component library (Microsoft Fluent UI) with basic text, layout and limited button handlers which the user might not want.
   - **HTML:** Full custom layouts, animations, interactive behavior. Single file (HTML+CSS+JS inline). Best for advanced/custom designs.
   - **URL:** Embeds an existing webpage. No coding but limited to what the page does. Must be created manually via Create > URL in the app.
2. For URL: inform the user and stop.
3. For JSON:
   1. Call read_json_widget_schema to get the required format and validation rules — retry until successful
   2. Available built-in templates for reference: battery, cpu, datetime, disks, media, media-viz, ram, visualizer, weather
   3. Generate the widget JSON and call write_json_widget_file
   4. Once saved, tell the user the creator window has opened where they can preview, edit, and update — or ask you to make changes
4. For HTML:
   a. Generate a single self-contained HTML file (CSS in <style>, JS in <script>, no external files or imports)
   b. Call write_html_widget
   c. Make sure to add the CSS property "-webkit-app-region: drag;" to the body or a container div to make the widget draggable.
   d. window.__TAURI__ gets populated after some time, access them only after they are available.
   e. Tell the user the widget is created and enabled, it should be visible behind their active windows and can ask you to make further changes.

When the user wants to update a widget created in this chat:
1. Call read_widget_schema if schema clarification is needed
2. Apply the requested changes and call update_json_widget or update_html_widget accordingly
3. Tell the user the creator window has reopened with the changes

## General
- Only call read_widget_schema when generating a widget, not for general questions
- Never guess the widget schema format — always read it first

## Media History
You must call the tool query_media_history when the user asks questions about their media or music history.

Media history contains all system media sessions, not only music.
Results may include music, podcasts, videos, ads, browser media, etc.
Do not assume an item is a song unless the metadata strongly suggests it.

When the user asks about a relative time period (yesterday, last week, this morning, etc),
convert it into an absolute time range in UTC before calling media tools.

If the tool has empty result, inform the user that there is not enough data available and ask them make sure to enable a widget with media information.

Current datetime: ${new Date().toISOString()}
Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}

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
          )}". Generate a concise, descriptive title (3-5 words) for this chat based on the user's first message. Focus on the main topic or question being asked. Keep it plain text`,
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
        read_widget_schema: readWidgetSchemaTool,
        write_json_widget: writeJsonWidgetTool,
        update_json_widget: updateJsonWidgetTool,
        write_html_widget: writeHtmlWidgetTool,
        update_html_widget: updateHtmlWidgetTool,
        query_media_history: queryMediaHistory,
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
