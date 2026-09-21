# Sharing Widgets & Audio Visualizer

## Sharing widgets

!!! tip "Community Gallery — coming soon"

    A **community gallery** is launching soon: you'll be able to **upload your widgets — all three types (Visual Editor, HTML, and URL) — directly from the app**, and discover widgets shared by others. [**Join the waitlist »**](https://forms.gle/Y7ni54Eknp599nG6A)

Until the gallery ships, there's no one-click publish-to-the-world button — but a widget is just a **self-contained folder** under your app data directory, so you can share widgets today and install them through the **Add** menu.

```
<app data>/widgets/<key>/     # manifest.json + any files/ and assets
```

See [Settings & Data → Where your data lives](settings.md#where-your-data-lives) for the exact path on your OS.

### JSON (Visual Editor) widgets

- **Share:** send the widget's `manifest.json` (found in its folder).
- **Install:** in the main window, **Add → import a JSON file**, and pick the shared `manifest.json`.

### HTML widgets

- **Share:** zip and send the widget's HTML folder (the one containing `index.html`).
- **Install:** **Add → HTML**, and select the unzipped folder.

### URL widgets

- Just share the URL. The recipient adds it via **Add → URL**.

!!! warning "Portability caveats"

    - Widget **keys** must be unique in your library; importing may prompt to resolve a clash.
    - **HTML** widgets referencing absolute local paths, and **URL** widgets pointing at private pages, may not work on another machine.
    - Widget content is **not sandbox-reviewed** — only install widgets from sources you trust, especially HTML widgets (they run arbitrary JavaScript).

---

## Audio Visualizer

The **Audio Visualizer** component (`audio-visualizer`) renders live system audio as a waveform. It is available in the Visual Editor, and there are ready-made `visualizer` and `media-viz` templates to start from.

### Types

Choose a visualization style in the component's **Type** property:

| Type | Value | Description |
|---|---|---|
| **Bar** | `bar` | Soundbar-style vertical bars (default) |
| **Waveform** | `waveform` | Continuous waveform line |
| **Filled Waveform** | `waveform-filled` | Waveform line with a filled area below it |

### Properties

| Property | Default | Notes |
|---|---|---|
| Height (px) | `300` | Canvas height |
| Width (px) | `800` | Canvas width |
| Type | `bar` | See table above |
| Amplitude Multiplier | `1` | Scales the visual amplitude |
| Stroke Width (px) | `1` | Line/bar thickness |
| Stroke Color | `#fff` | Line/bar color |
| Stroke Gap | `2` | Gap between bars |
| Fill Color | `#fff` | **Filled Waveform only** — the fill color under the line |

!!! info "How it works"

    The visualizer subscribes to live system audio samples (the `audio-samples` event, emitted ~every 33 ms after audio capture starts). Continuous capture can raise CPU usage, so it runs only while a visualizer widget is active. HTML widgets can build their own visualizer using [`start_audio_capture`](commands.md) and the [`audio-samples` event](events.md#audio-samples).
