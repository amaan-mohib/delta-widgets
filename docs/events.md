# Tauri Events

Some widgets need to react to system changes (e.g., media playback). For this, Delta Widgets exposes Tauri events that you can subscribe to.

Example: Listening to `media_updated`

```ts
import { invoke, listen } from "@tauri-apps/api/core";

async function setup() {
  await listen("media_updated", (event) => {
    invoke("get_media").then(console.log);
  });
}

setup();
```

This ensures your widget updates whenever the media session changes.

Currently, you can only listen to `media_updated` which gets triggered whenever the media status changes.
