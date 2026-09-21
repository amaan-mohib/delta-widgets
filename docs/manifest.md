# Widget Manifest Reference

Every widget is a folder that contains a `manifest.json` file. **The manifest is the source of truth** for a widget — its type, size, position, theme, and (for Visual-Editor widgets) its entire layout tree.

You normally never edit this file by hand — the Visual Editor and the app write it for you. This page documents its shape for advanced users, HTML/URL widget authors, and anyone hand-editing or generating manifests.

Widgets live under your app data directory (see [Settings & Data](settings.md#where-your-data-lives)):

```
<app data>/widgets/<key>/manifest.json
```

---

## `IWidget`

```ts
interface IWidget {
  key: string;                 // unique folder key for the widget
  label: string;               // display name
  path: string;                // absolute path to this manifest.json
  description?: string;

  dimensions?: { width: number; height: number };
  position?: { x: number; y: number };
  visible?: boolean;           // if true, a window is spawned on startup

  elements?: IWidgetElement[]; // json widgets only — the layout tree
  url?: string;                // url widgets only
  file?: string;               // html widgets only — folder holding index.html

  widgetType?: "url" | "html" | "json";

  customFields?: TCustomFields;    // {{custom:...}} variables (json widgets)
  customAssets?: ICustomAssets[];  // extra css/js/files copied into the widget

  published?: boolean;             // false ⇒ shows under "Drafts"
  publishedAt?: string | number;

  alwaysOnTop?: boolean;
  pinned?: boolean;                // url widgets: hides the drag titlebar
  theme?: {
    mode: "light" | "dark" | "system";
    color: string;                 // "blue" | "green" | "red" | "yellow" | "default"
  } | null;
}
```

### Field notes

| Field | Meaning |
|---|---|
| `key` | Unique identifier; also the folder name under `widgets/`. Must be unique across all installed widgets. |
| `visible` | On startup the app spawns a window for every widget with `visible: true`. Toggling a widget on/off in the main window flips this. |
| `widgetType` | Selects the runtime: `json` (Visual Editor), `html` (local folder), or `url` (embedded page). |
| `published` / `publishedAt` | Publishing copies the manifest into the widgets dir and sets these. Unpublished widgets appear under **Drafts**. |
| `elements` | Present only for `json` widgets — the recursive layout tree (below). Must be absent for `html`/`url`. |
| `file` | Present only for `html` widgets — the folder containing `index.html`. |
| `url` | Present only for `url` widgets — the page to embed. |
| `pinned` | For `url` widgets, removes the draggable titlebar (you can no longer drag the widget). |
| `alwaysOnTop` | Keeps the widget window above other windows. |
| `theme` | Optional per-widget theme override (`null` = inherit). |

### Type constraints

The three widget types are mutually exclusive about their content:

- **`json`** — must have `elements`; must **not** have `file` or `url`.
- **`html`** — must have `file`; must **not** have `elements` or `url`.
- **`url`** — carries `url`.

---

## `IWidgetElement`

`json` widgets store their layout as a **recursive tree** of elements. `children` is only meaningful on container types.

```ts
interface IWidgetElement {
  type: string;
  id: string;                  // must be unique within the widget
  label?: string;
  styles: CSSProperties & {
    gridSize?: { rows?: "auto" | number; columns?: "auto" | number };
    gridItem?: { rowSpan?: number; columnSpan?: number };
  };
  data?: Record<string, any>;  // component-specific config (e.g. data.text)
  children?: IWidgetElement[]; // only valid on container/grid types
}
```

### Component `type` values

| `type` | Component |
|---|---|
| `container` | Flex container |
| `container-grid` | Grid container (use `styles.gridSize` / `styles.gridItem`) |
| `text` | Text (supports [dynamic variables](variables.md); `data.text` required) |
| `image` | Image (local file, URL, or variable) |
| `button` | Button |
| `slider` | Slider |
| `progress` | Progress bar |
| `disk-usage` | Disk usage indicator |
| `media-next` / `media-prev` | Media next / previous controls |
| `media-slider` | Media position slider |
| `media-select` | Media session selector |
| `toggle-play` | Play/pause toggle |
| `audio-visualizer` | [Audio visualizer](sharing.md#audio-visualizer) |
| `toggle-visualizer` | Audio visualizer toggle |

### Rules

- Every element needs a **unique `id`**.
- `children` is only valid on `container` / `container-grid` types.
- `text` elements require `data.text`.

---

## `TCustomFields`

User-defined `{{custom:<key>}}` variables (see [Variables](variables.md#custom)). A map keyed by the field key:

```ts
type TCustomFields = Record<
  string,
  { key: string; label: string; value: string; description?: string }
>;
```

## `ICustomAssets`

Extra files (CSS/JS/images) copied into the widget folder and made available to it:

```ts
interface ICustomAssets {
  kind: "file" | "url";
  path: string;
  key: string;
  type?: string; // e.g. "css", "js"
}
```
