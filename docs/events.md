# Tauri Events

Some widgets need to react to system changes (e.g., media playback, system audio samples). For this, Delta Widgets exposes Tauri events that you can subscribe to. Widgets can also emit widget-management events to the main window.

### `media_updated`

To listen for changes in the currently playing system media, first invoke `start_media_listener_cmd`. Once the listener is active, the application emits the `media_updated` event whenever media metadata or playback status changes.

The `media_updated` event acts as a notification trigger. To retrieve the latest media information, call `get_media` inside the event listener.

#### Example: Listening to `media_updated`

```ts
import { invoke, listen } from "@tauri-apps/api/core";
// or const {event: { listen }, core: { invoke }} = window.__TAURI__;

async function setup() {
  // Start media listener
  await invoke("start_media_listener_cmd");

  // Get initial media metadata
  console.log(await invoke("get_media"));

  // Listen for subsequent media updates
  await listen("media_updated", async () => {
    console.log(await invoke("get_media"));
  });
}

setup();
```

### `duplicate-widget`

Emit `duplicate-widget` to the main window with an installed widget's key as the payload. The application creates and opens a copy of that widget.

```ts
import { emitTo } from "@tauri-apps/api/event";
// or const {event: { emitTo }} = window.__TAURI__;

await emitTo("main", "duplicate-widget", "weather");
```

### `close-widget`

Emit `close-widget` to the main window with the installed widget's key. Set the optional `toggleVisibility` field to `true` to mark the widget as not visible before closing it.

```ts
import { emitTo } from "@tauri-apps/api/event";
// or const {event: { emitTo}} = window.__TAURI__;

await emitTo("main", "close-widget", {
  key: "weather",
  toggleVisibility: true,
});
```

This ensures your widget updates whenever the media session changes.

### `audio-samples`

After starting system audio capture with `start_audio_capture`, the application begins emitting the `audio-samples` event at roughly 33 ms intervals.

Each `audio-samples` event returns an array of approximately 256 numeric sample values representing the current system audio waveform.

#### Example: Listening to `audio-samples`

```ts
import { invoke, listen } from "@tauri-apps/api/core";
// or const {event: { listen }, core: { invoke }} = window.__TAURI__;

async function setup() {
  // Start capturing system audio
  await invoke("start_audio_capture");

  // Receive waveform samples continuously
  await listen<number[]>("audio-samples", (event) => {
    console.log(event.payload);
  });
}

setup();
```
