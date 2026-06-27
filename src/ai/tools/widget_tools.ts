import { tool } from "ai";
import z from "zod";
import { commands } from "../../common/commands";
import {
  addWidget,
  createCreatorWindow,
  createWidgetWindow,
  getWidgetsDirPath,
} from "../../main/utils/widgets";
import { IWidget } from "../../types/manifest";
import { path } from "@tauri-apps/api";
import { emitTo } from "@tauri-apps/api/event";
import getTemplateCategories from "../../creator/components/TemplateEditor/categories";
import { mkdir, writeTextFile } from "@tauri-apps/plugin-fs";
import { closeWidgetWindow } from "../../common";

const GridSizeSchema = z.object({
  rows: z.union([z.literal("auto"), z.number()]).optional(),
  columns: z.union([z.literal("auto"), z.number()]).optional(),
});

const GridItemSchema = z.object({
  rowSpan: z.number().optional(),
  columnSpan: z.number().optional(),
});

const WidgetElementSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.enum(JSON_WIDGET_COMPONENT_TYPES),
    id: z.string(),
    label: z.string().optional(),
    styles: z.record(z.string(), z.any()).and(
      z.object({
        gridSize: GridSizeSchema.optional(),
        gridItem: GridItemSchema.optional(),
      }),
    ),
    data: z.record(z.string(), z.any()).optional(),
    children: z.array(WidgetElementSchema).optional(),
  }),
);

const CustomFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  description: z.string().optional(),
});

const CustomFieldsSchema = z.record(z.string(), CustomFieldSchema);

const CustomAssetSchema = z.object({
  kind: z.enum(["file", "url"]),
  path: z.string(),
  key: z.string(),
  type: z.string().optional(),
});

export const WidgetSchema = z.object({
  key: z.string(),
  label: z.string(),

  description: z.string().optional(),

  dimensions: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),

  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),

  visible: z.boolean().optional(),

  elements: z.array(WidgetElementSchema).optional(),

  url: z.string().optional(),
  file: z.string().optional(),

  widgetType: z.enum(["url", "html", "json"]),

  customFields: CustomFieldsSchema.optional(),

  customAssets: z.array(CustomAssetSchema).optional(),

  published: z.boolean().optional(),

  publishedAt: z.union([z.string(), z.number()]).optional(),

  alwaysOnTop: z.boolean().optional(),

  theme: z
    .object({
      mode: z.enum(["light", "dark", "system"]),
      color: z.enum(["blue", "green", "red", "yellow", "default"]),
    })
    .nullable()
    .optional(),

  pinned: z.boolean().optional(),
});

const JSON_WIDGET_COMPONENT_TYPES = [
  "container",
  "container-grid",
  "text",
  "image",
  "button",
  "slider",
  "toggle-play",
  "media-next",
  "media-prev",
  "media-slider",
  "media-select",
  "disk-usage",
  "progress",
  "audio-visualizer",
  "toggle-visualizer",
];

const JSON_WIDGET_SCHEMA = `interface IWidgetElement {
  type: "${JSON_WIDGET_COMPONENT_TYPES.join('" | "')}";
  id: string;
  label?: string;
  styles: CSSProperties & {
    gridSize?: { rows?: "auto" | number; columns?: "auto" | number };
    gridItem?: { rowSpan?: number; columnSpan?: number };
  };
  data?: Record<string, any>;
  children?: IWidgetElement[];
}

type TCustomFields = Record<
  string,
  { key: string; label: string; value: string; description?: string }
>;

interface ICustomAssets {
  kind: "file" | "url";
  path: string;
  key: string;
  type?: string; // e.g., "css", "js", etc.
}

// This is the main interface for a widget, which includes metadata, layout, and content.
interface IWidget {
  key: string;
  label: string;
  path: string;
  description?: string;
  dimensions?: { width: number; height: number };
  position?: { x: number; y: number };
  visible?: boolean;
  elements?: IWidgetElement[];
  url?: string;
  file?: string;
  widgetType?: "url" | "html" | "json";
  customFields?: TCustomFields;
  customAssets?: ICustomAssets[];
  published?: boolean;
  publishedAt?: string | number;
  alwaysOnTop?: boolean;
  theme?: {
    mode: "light" | "dark" | "system";
    color: string;
  } | null;
  pinned?: boolean;
}`;

const validationRules = `Validation rules:
- Every component must have a unique "id"
- "children" only valid on container/grid types
- "data.text" required for text type
- Example dynamic variables: {{time}}, {{time:HH:mm:ss}}, {{system:cpu_usage}}, {{system:ram_used}}, {{media:title}}, {{media:artist}}`;

const templates = [
  "battery",
  "cpu",
  "datetime",
  "disks",
  "media",
  "media-viz",
  "ram",
  "visualizer",
  "weather",
];

const tauriCommands = `Available Tauri commands via window.__TAURI__.core.invoke():
## Command Reference

| Command                    | Description                                                                   | Parameters                  | Returns                                 |
| -------------------------- | ----------------------------------------------------------------------------- | --------------------------- | --------------------------------------- |
| \`get_system_info\`          | Returns current system information such as CPU usage, memory usage, etc.      | _None_                      | Promise<[SystemInfo](#systeminfo)\>     |
| \`start_media_listener_cmd\` | Starts the system media session listener required for \`media_updated\` events. | _None_                      | Promise<void\>                          |
| \`stop_media_listener_cmd\`  | Stops the active system media session listener.                               | _None_                      | Promise<void\>                          |
| \`get_media\`                | Returns metadata for all currently available media sessions.                  | _None_                      | Promise<[MediaObject[]](#mediaobject)\> |
| \`media_action\`             | Perform action on the currently playing media.                                | [MediaAction](#mediaaction) | Promise<void\>                          |
| \`start_audio_capture\`      | Starts capturing live system audio samples for waveform visualization.        | _None_                      | Promise<void\>                          |
| \`stop_audio_capture\`       | Stops the active system audio capture stream.                                 | _None_                      | Promise<void\>                          |
| \`get_current_device_cmd\`   | Returns the ID of the current audio output device.                            | _None_                      | Promise<String\>                        |

Use \`start_media_listener_cmd\` to begin monitoring system media metadata. Once started, the application will emit a \`media_updated\` event whenever information about the currently playing media changes (such as title, artist, album art, or playback state).

To receive live system audio waveform samples, call \`start_audio_capture\`. This starts an audio capture stream that emits \`audio-samples\` events approximately every 33 ms.

Because continuous audio capture can increase CPU usage, it is recommended to call \`stop_audio_capture\` when audio sample updates are no longer needed.

### SystemInfo

| Parameter        | Type   | Description                                          |
| ---------------- | ------ | ---------------------------------------------------- |
| \`total_memory\`   | Number | Total memory available in bytes                      |
| \`used_memory\`    | Number | Used memory in bytes                                 |
| \`total_swap\`     | Number | Total swap memory in bytes                           |
| \`used_swap\`      | Number | Used swap memory in bytes                            |
| \`os_version\`     | String | Operating system version                             |
| \`os_name\`        | String | Operating system name                                |
| \`kernel_version\` | String | Kernel version                                       |
| \`hostname\`       | String | System hostname                                      |
| \`disks\`          | Array  | List of disk information                             |
| \`batteries\`      | Array  | List of battery information                          |
| \`cpus\`           | Array  | List of CPU information                              |
| \`cpu\`            | Object | CPU summary containing count, speed, usage and brand |
| \`networks\`       | Array  | List of network interfaces                           |

### MediaObject

| Parameter             | Type                                                 | Description                              |
| --------------------- | ---------------------------------------------------- | ---------------------------------------- |
| \`title\`               | String                                               | Title of the media                       |
| \`artist\`              | String                                               | Artist name                              |
| \`thumbnail\`           | Number[]                                             | Binary data of the media thumbnail       |
| \`playback_info\`       | [MediaPlaybackInfo](#mediaplaybackinfo)?             | Optional playback information            |
| \`player\`              | [MediaPlayerInfo](#mediaplayerinfo)?                 | Optional media player information        |
| \`player_id\`           | String                                               | Unique identifier for the player         |
| \`timeline_properties\` | [MediaTimelineProperties](#mediatimelineproperties)? | Optional timeline properties             |
| \`is_current_session\`  | bool                                                 | Indicates if this is the current session |

#### MediaPlaybackInfo

| Parameter    | Type                                            | Description                    |
| ------------ | ----------------------------------------------- | ------------------------------ |
| \`controls\`   | [MediaPlaybackControls](#mediaplaybackcontrols) | Playback control states        |
| \`status\`     | String                                          | Current playback status        |
| \`is_shuffle\` | bool                                            | Whether shuffle mode is active |

#### MediaPlaybackControls

| Parameter         | Type | Description                           |
| ----------------- | ---- | ------------------------------------- |
| \`play_enabled\`    | bool | Whether play control is enabled       |
| \`pause_enabled\`   | bool | Whether pause control is enabled      |
| \`stop_enabled\`    | bool | Whether stop control is enabled       |
| \`next_enabled\`    | bool | Whether next track control is enabled |
| \`prev_enabled\`    | bool | Whether prev track control is enabled |
| \`toggle_enabled\`  | bool | Whether toggle control is enabled     |
| \`shuffle_enabled\` | bool | Whether shuffle control is enabled    |
| \`repeat_enabled\`  | bool | Whether repeat control is enabled     |

#### MediaTimelineProperties

| Parameter    | Type | Description                      |
| ------------ | ---- | -------------------------------- |
| \`start_time\` | u128 | Start time of the media          |
| \`end_time\`   | u128 | End time of the media            |
| \`position\`   | u128 | Current position in the timeline |

#### MediaPlayerInfo

| Parameter | Type   | Description                                    |
| --------- | ------ | ---------------------------------------------- |
| \`name\`    | String | Name of the media player                       |
| \`icon\`    | String | Local file path to the media player icon image |

!!! info

    The \`icon\` field returns a local filesystem path. To use it as an image source inside a Tauri application, convert it using \`convertFileSrc\`.

    \`\`\`js
    import { convertFileSrc } from "@tauri-apps/api/core";

    const src = convertFileSrc(icon);
    \`\`\`

### MediaAction

| Parameter   | Type                                                            | Description                                                                             |
| ----------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| \`playerId\` | String                                                          | Unique identifier for the player                                                        |
| \`action\`    | "play" \| "pause" \| "toggle" \| "next" \| "prev" \| "position" | The media action to perform                                                             |
| \`position\`  | Option<Number\>                                                 | Optional position parameter for seeking, but required if using \`"position"\` as \`action\` |
`;

const tauriEvents = `Available Tauri events via window.__TAURI__.event.listen():
### \`media_updated\`

To listen for changes in the currently playing system media, first invoke \`start_media_listener_cmd\`. Once the listener is active, the application emits the \`media_updated\` event whenever media metadata or playback status changes.

The \`media_updated\` event acts as a notification trigger. To retrieve the latest media information, call \`get_media\` inside the event listener.

### \`audio-samples\`

After starting system audio capture with \`start_audio_capture\`, the application begins emitting the \`audio-samples\` event at roughly 33 ms intervals.

Each \`audio-samples\` event returns an array of approximately 256 numeric sample values representing the current system audio waveform.`;

export const readWidgetSchemaTool = tool({
  description:
    "Read widget schema and context before generating a widget. For JSON widgets returns schema, validation rules, dynamic variables, and examples. For HTML widgets returns available Tauri commands and events.",
  inputSchema: z.object({
    templates: z.array(z.string()).optional(),
    widgetType: z.enum(["json", "html"]),
  }),
  execute: async ({ templates: templateNames, widgetType }) => {
    if (widgetType === "html") {
      return {
        tauriCommands,
        tauriEvents,
        nextTool: `write_html_widget if creating or update_html_widget if updating a HTML widget`,
      };
    }

    if (!templateNames) {
      templateNames = ["media", "datetime", "weather", "cpu"];
    }
    if (templateNames.length === 0) {
      throw new Error(
        `No template names provided. Available templates are: ${templates.join()}`,
      );
    }
    if (templateNames.some((name) => !templates.includes(name))) {
      throw new Error(
        `Invalid template name. Available templates are: ${templates.join()}`,
      );
    }
    const examples = await Promise.all(
      templateNames.map(async (template) => {
        const response = await fetch(`/templates/${template}/manifest.json`);
        return await response.json();
      }),
    );
    const categories = getTemplateCategories({});
    const availableDynamicVariables = categories
      .map((i) =>
        i.templates.map((t) => ({
          value: t.value,
          description: t.description,
        })),
      )
      .flat();
    return {
      schema: JSON_WIDGET_SCHEMA,
      validationRules,
      examples,
      availableDynamicVariables,
      nextTool: `write_json_widget if creating or update_json_widget if updating a JSON widget`,
    };
  },
});

const validateWidget = async (
  widget: z.infer<typeof WidgetSchema>,
  update?: boolean,
) => {
  let errors: any[] = [];
  try {
    if (typeof widget === "string") {
      widget = JSON.parse(widget);
    }
    WidgetSchema.parse(widget);

    if (widget.widgetType === "json") {
      if (!widget.elements || widget.elements.length === 0) {
        errors.push("A JSON widget must have elements");
      }
      if (widget.file || widget.url) {
        errors.push("A JSON widget cannot have a file or url field");
      }
    }
    if (widget.widgetType === "html") {
      if (!widget.file) {
        errors.push("An HTML widget must have file field");
      }
      if (widget.elements || widget.url) {
        errors.push("An HTML widget cannot have an elements or url field");
      }
    }

    if (!update) {
      const { widgetsDir } = await getWidgetsDirPath();
      const widgetPath = await path.resolve(
        widgetsDir,
        widget.key,
        "manifest.json",
      );
      const existingKeys = await commands.getExistingKeysCmd({
        currentFolder: widgetPath,
      });
      if (widget.key in existingKeys) {
        errors.push(
          `Widget key exists, please create another key which should not be any of these values: [${Object.keys(existingKeys).join()}]`,
        );
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      for (const issue of error.issues) {
        errors.push(issue);
      }
    } else {
      console.log(error);
      errors.push((error as any).message || "Unknown error");
    }
  }
  return errors;
};

export const writeJsonWidgetTool = tool({
  description: `Validates and saves a widget JSON file. Call read_widget_schema first. Returns validation errors and schema if invalid so you can correct and retry.`,
  inputSchema: z.object({
    widget: WidgetSchema,
  }),
  execute: async ({ widget }, { experimental_context }) => {
    const context = experimental_context as { chatId?: string };
    const currentChatId = context?.chatId;

    if (!currentChatId) {
      throw new Error("Chat id now defined in tool context");
    }

    const errors = await validateWidget(widget);
    let errorObj = {
      success: false,
      errors,
      widget,
      schema: JSON_WIDGET_SCHEMA,
    };
    if (errors.length) {
      return errorObj;
    }
    widget.visible = false;
    const addedWidget = await addWidget("json", {
      manifest: widget as IWidget,
      label: widget.label,
    });
    if (!addedWidget) {
      errorObj.errors.push(
        "Something went wrong while creating widget, try again.",
      );
      return errorObj;
    }
    await commands.updateChatWidgetKeys({
      chatId: currentChatId,
      key: widget.key,
    });
    await commands.closeWidgetWindow({ label: "creator" });
    // do not put in drafts, will be directly published.
    await createCreatorWindow(addedWidget.path);
    await emitTo("main", "creator-close", {});

    return { success: true };
  },
});

export const updateJsonWidgetTool = tool({
  description: `Updates an existing widget JSON file. Call read_widget_schema first if unsure about the schema. Returns validation errors if invalid so you can correct and retry.`,
  inputSchema: z.object({
    widget: WidgetSchema,
  }),
  execute: async ({ widget }, { experimental_context }) => {
    const context = experimental_context as { chatId?: string };
    const currentChatId = context?.chatId;

    if (!currentChatId) {
      throw new Error("Chat id now defined in tool context");
    }

    const chat = await commands
      .getChatById({ id: currentChatId })
      .catch(console.error);
    if (!chat) {
      throw new Error("Chat not found");
    }
    const chatWidgetKeys = chat.data?.widgetKeys || [];
    if (!chatWidgetKeys.includes(widget.key)) {
      return {
        success: false,
        errors: [`Widget key "${widget.key}" was not created in this chat.`],
      };
    }

    const errors = await validateWidget(widget, true);
    let errorObj = {
      success: false,
      errors,
      widget,
      schema: JSON_WIDGET_SCHEMA,
    };
    if (errors.length) {
      return errorObj;
    }

    const { widgetsDir } = await getWidgetsDirPath();
    const widgetPath = await path.resolve(
      widgetsDir,
      widget.key,
      "manifest.json",
    );
    const updatedWidget = await addWidget("json", {
      manifest: widget as IWidget,
      label: widget.label,
      existingManifestPath: widgetPath,
    });
    if (!updatedWidget) {
      errorObj.errors.push(
        "Something went wrong while updating widget, try again.",
      );
      return errorObj;
    }
    await commands.closeWidgetWindow({ label: "creator" });
    await createCreatorWindow(updatedWidget.path);
    await emitTo("main", "creator-close", {});

    return { success: true };
  },
});

export const writeHtmlWidgetTool = tool({
  description: `Creates a self-contained HTML widget. All CSS must be in <style> and JS in <script> tags — no external files.
Call read_widget_schema first to get available Tauri commands and types.
Note: window.__TAURI__ is available but fragile — avoid page reloads or redirects inside the widget.`,
  inputSchema: z.object({
    label: z.string(),
    html: z
      .string()
      .describe(
        "Complete HTML file with all CSS in <style> and JS in <script> tags inline.",
      ),
    dimensions: z.object({ height: z.number(), width: z.number() }),
  }),
  execute: async ({ label, html, dimensions }, { experimental_context }) => {
    const context = experimental_context as { chatId?: string };
    if (!context?.chatId)
      throw new Error("Chat id not defined in tool context");

    const { widgetsDir } = await getWidgetsDirPath();
    const key = label.toLowerCase().replace(/\s+/g, "-");
    const widgetDir = await path.resolve(widgetsDir, key);
    const manifestPath = await path.resolve(widgetDir, "manifest.json");
    const htmlFileFolder = await path.resolve(widgetDir, "files");
    const htmlFilePath = await path.resolve(htmlFileFolder, "index.html");

    const widget: z.infer<typeof WidgetSchema> = {
      key,
      label,
      file: htmlFileFolder,
      position: { x: 30, y: 30 },
      dimensions,
      widgetType: "html",
      visible: true,
    };

    await mkdir(htmlFileFolder, { recursive: true });
    await writeTextFile(htmlFilePath, html);

    const errors = await validateWidget(widget);
    let errorObj = {
      success: false,
      errors,
      widget,
      schema: JSON_WIDGET_SCHEMA,
    };
    if (errors.length) {
      return errorObj;
    }

    await writeTextFile(manifestPath, JSON.stringify(widget));

    await commands.updateChatWidgetKeys({ chatId: context.chatId, key });
    await createWidgetWindow(manifestPath, false, false);
    await emitTo("main", "creator-close", {});

    return { success: true, widgetKey: key };
  },
});

export const updateHtmlWidgetTool = tool({
  description: `Update a self-contained HTML widget. All CSS must be in <style> and JS in <script> tags — no external files.
Call read_widget_schema first to get available Tauri commands and types.
Note: window.__TAURI__ is available but fragile — avoid page reloads or redirects inside the widget.`,
  inputSchema: z.object({
    key: z.string(),
    html: z
      .string()
      .describe(
        "Complete HTML file with all CSS in <style> and JS in <script> tags inline.",
      ),
  }),
  execute: async ({ key, html }, { experimental_context }) => {
    const context = experimental_context as { chatId?: string };
    if (!context?.chatId)
      throw new Error("Chat id not defined in tool context");

    const chat = await commands
      .getChatById({ id: context.chatId })
      .catch(console.error);
    if (!chat) {
      throw new Error("Chat not found");
    }
    const chatWidgetKeys = chat.data?.widgetKeys || [];
    if (!chatWidgetKeys.includes(key)) {
      return {
        success: false,
        errors: [`Widget key "${key}" was not created in this chat.`],
      };
    }

    const { widgetsDir } = await getWidgetsDirPath();

    const widgetDir = await path.resolve(widgetsDir, key);
    const manifestPath = await path.resolve(widgetDir, "manifest.json");
    const htmlFileFolder = await path.resolve(widgetDir, "files");
    const htmlFilePath = await path.resolve(htmlFileFolder, "index.html");
    await writeTextFile(htmlFilePath, html);

    await closeWidgetWindow(`widget-${key}`, true, manifestPath);
    await createWidgetWindow(manifestPath, false, true);
    await emitTo("main", "creator-close", {});

    return { success: true };
  },
});

export const queryMediaHistory = tool({
  description: `
Query the user's media playback history.

Media history includes ALL system media:
music, videos, podcasts, streams, browser tabs,
advertisements, audiobooks, etc.

Do not assume every result is a song.

Current datetime:
${new Date().toISOString()}
`,
  inputSchema: z.object({
    intent: z.enum(["history", "top_media", "top_artists", "stats"]),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    limit: z.number().optional(),
  }),
  execute: async (input) => {
    return commands.queryMediaHistory({
      input: {
        intent: input.intent,
        start_time: input.startTime,
        end_time: input.endTime,
        limit: input.limit,
      },
    });
  },
});
