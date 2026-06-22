import { tool } from "ai";
import z from "zod";
import { commands } from "../../common/commands";
import {
  addWidget,
  createCreatorWindow,
  getWidgetsDirPath,
} from "../../main/utils/widgets";
import { IWidget } from "../../types/manifest";
import { path } from "@tauri-apps/api";
import { emitTo } from "@tauri-apps/api/event";
import getTemplateCategories from "../../creator/components/TemplateEditor/categories";

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

export const askUserTool = tool({
  description:
    "Ask the user a clarifying question before proceeding. Use this to determine widget type or gather missing details.",
  inputSchema: z.object({
    question: z.string(),
    options: z.array(z.string()).optional(),
  }),
});

export const readJsonWidgetSchemaTool = tool({
  description:
    "Read the widget JSON schema and validation rules before generating a JSON widget and get required examples.",
  inputSchema: z.object({ templates: z.array(z.string()).optional() }),
  execute: async ({ templates: templateNames }) => {
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
    const { widgetsDir } = await getWidgetsDirPath();
    const widgetPath = await path.resolve(
      widgetsDir,
      widget.key,
      "manifest.json",
    );
    if (!update) {
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
