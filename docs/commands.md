# Tauri Commands

Delta Widgets uses Tauri's `invoke` API to bridge the frontend (UI) with Rust backend logic.
Here's a list of available commands, their purpose, and usage examples.

!!! note

    To use

    ```js
    import { invoke } from "@tauri-apps/api/core";
    ```

    your app must be built using a frontend bundler (like Vite or Webpack).

    If you're running in a raw browser (before build), use:

    ```js
    window.__TAURI__.invoke("command_name", args)
    ```

## Command Reference

| Command           | Description                            | Parameters                  | Returns                                 |
| ----------------- | -------------------------------------- | --------------------------- | --------------------------------------- |
| `get_system_info` | Get system info like CPU, RAM, uptime. | _None_                      | Promise<[SystemInfo](#systeminfo)\>     |
| `get_media`       | Fetch currently playing media details. | _None_                      | Promise<[MediaObject[]](#mediaobject)\> |
| `media_action`    | Fetch currently playing media details. | [MediaAction](#mediaaction) | Promise<void\>                          |

### SystemInfo

| Parameter        | Type   | Description                                          |
| ---------------- | ------ | ---------------------------------------------------- |
| `total_memory`   | Number | Total memory available in bytes                      |
| `used_memory`    | Number | Used memory in bytes                                 |
| `total_swap`     | Number | Total swap memory in bytes                           |
| `used_swap`      | Number | Used swap memory in bytes                            |
| `os_version`     | String | Operating system version                             |
| `os_name`        | String | Operating system name                                |
| `kernel_version` | String | Kernel version                                       |
| `hostname`       | String | System hostname                                      |
| `disks`          | Array  | List of disk information                             |
| `batteries`      | Array  | List of battery information                          |
| `cpus`           | Array  | List of CPU information                              |
| `cpu`            | Object | CPU summary containing count, speed, usage and brand |
| `networks`       | Array  | List of network interfaces                           |

### MediaObject

| Parameter             | Type                                                 | Description                              |
| --------------------- | ---------------------------------------------------- | ---------------------------------------- |
| `title`               | String                                               | Title of the media                       |
| `artist`              | String                                               | Artist name                              |
| `thumbnail`           | Number[]                                             | Binary data of the media thumbnail       |
| `playback_info`       | [MediaPlaybackInfo](#mediaplaybackinfo)?             | Optional playback information            |
| `player`              | [MediaPlayerInfo](#mediaplayerinfo)?                 | Optional media player information        |
| `player_id`           | String                                               | Unique identifier for the player         |
| `timeline_properties` | [MediaTimelineProperties](#mediatimelineproperties)? | Optional timeline properties             |
| `is_current_session`  | bool                                                 | Indicates if this is the current session |

#### MediaPlaybackInfo

| Parameter    | Type                                            | Description                    |
| ------------ | ----------------------------------------------- | ------------------------------ |
| `controls`   | [MediaPlaybackControls](#mediaplaybackcontrols) | Playback control states        |
| `status`     | String                                          | Current playback status        |
| `is_shuffle` | bool                                            | Whether shuffle mode is active |

#### MediaPlaybackControls

| Parameter         | Type | Description                           |
| ----------------- | ---- | ------------------------------------- |
| `play_enabled`    | bool | Whether play control is enabled       |
| `pause_enabled`   | bool | Whether pause control is enabled      |
| `stop_enabled`    | bool | Whether stop control is enabled       |
| `next_enabled`    | bool | Whether next track control is enabled |
| `prev_enabled`    | bool | Whether prev track control is enabled |
| `toggle_enabled`  | bool | Whether toggle control is enabled     |
| `shuffle_enabled` | bool | Whether shuffle control is enabled    |
| `repeat_enabled`  | bool | Whether repeat control is enabled     |

#### MediaTimelineProperties

| Parameter    | Type | Description                      |
| ------------ | ---- | -------------------------------- |
| `start_time` | u128 | Start time of the media          |
| `end_time`   | u128 | End time of the media            |
| `position`   | u128 | Current position in the timeline |

#### MediaPlayerInfo

| Parameter | Type     | Description                    |
| --------- | -------- | ------------------------------ |
| `name`    | String   | Name of the media player       |
| `icon`    | Number[] | Binary data of the player icon |

### MediaAction

| Parameter   | Type                                                            | Description                                                                             |
| ----------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `player_id` | String                                                          | Unique identifier for the player                                                        |
| `action`    | "play" \| "pause" \| "toggle" \| "next" \| "prev" \| "position" | The media action to perform                                                             |
| `position`  | Option<Number\>                                                 | Optional position parameter for seeking, but required if using `"position"` as `action` |

!!! info

    Binary data needs to be converted to base64 to use it as an image. Example:

    ```js
    const src = `data:image/png;base64,${Buffer.from(thumbnail).toString(
      "base64"
    )}`;
    ```

## Best Practices

### Tauri Global Window Object

While `window.__TAURI__` is technically available in HTML Widgets, you should not rely on `window.__TAURI__` inside HTML widgets.

#### Why?

- HTML widgets run in a raw WebView — they don’t have the same runtime guarantees as the main Delta Widgets environment.
- `window.__TAURI__` can break or disappear if your page reloads, redirects, or changes context.

---

### Recommended approach

If your widget needs to talk to the backend (e.g., fetch system info, control media, run commands), you should bundle your widget with a frontend build tool instead of shipping raw HTML/JS files.

This ensures the Tauri APIs (`@tauri-apps/api`) are available during runtime.

---

#### Option 1: Use a Framework (Recommended)

Use a modern frontend framework and build your widget as a static output folder:

React (Vite example):

```bash
npm create vite@latest my-widget -- --template react
cd my-widget
npm install
```

Then in your code:

```tsx
import { invoke } from "@tauri-apps/api/core";

function App() {
  async function getInfo() {
    const info = await invoke("get_system_info");
    console.log(info);
  }

  return <button onClick={getInfo}>Get Info</button>;
}
```

Finally, build it:

```bash
npm run build
```

The output (`dist/`) can be dropped into Delta Widgets as your widget folder.

Vue / Svelte / Solid → same flow, just scaffold with your framework’s CLI (`npm create vue@latest`, `npm create svelte@latest`, etc.).

---

#### Option 2: Use a Bundler Only

If you prefer plain JavaScript/TypeScript but still want Tauri commands:

```bash
npm init vite@latest my-widget -- --template vanilla-ts
cd my-widget
npm install
```

Now you can import:

```js
import { invoke } from "@tauri-apps/api/core";

invoke("get_system_info").then(console.log);
```

And again, `npm run build` → drop `dist/` into Delta Widgets.

---

#### Option 3: Raw HTML Widgets

If you just want quick prototypes or static displays:

- Use `window.__TAURI__.invoke("command_name")` directly.
- No build step required.
- Limited to globals exposed by Tauri.

Example:

```html
<!DOCTYPE html>
<html>
  <body>
    <button onclick="getInfo()">Get Info</button>
    <script>
      async function getInfo() {
        const info = await window.__TAURI__.invoke("get_system_info");
        console.log(info);
      }
    </script>
  </body>
</html>
```

---

### Rule of Thumb

- Use raw HTML widgets for static UI or quick experiments.
- Use a bundled framework when you need `@tauri-apps/api` and more advanced features.
