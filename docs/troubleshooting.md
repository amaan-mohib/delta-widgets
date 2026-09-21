# Troubleshooting & FAQ

## The app "disappeared" after I closed the window

That's expected. Closing the **main window hides** it — the app keeps running in the **system tray** so your widgets stay on screen. Click the tray icon and choose **Show**, or **Quit** to exit fully.

## My widget isn't on the desktop

- Make sure it's **enabled**: in the main window, find the widget under **Installed** and toggle it on (this sets `visible`).
- If it's still under **Drafts**, it hasn't been **published** yet — open it and click **Publish**.
- Widgets with `visible: true` are spawned on startup; toggling visibility off closes the window.

## `{{...}}` variables aren't working

- Variables only work in **Visual Editor (`json`) widgets** — not [HTML](overview.md#custom-html-widgets) or [URL](overview.md#url-widgets) widgets.
- `Loading...` means the value isn't available yet or the namespace is unknown.
- `NA` means the argument is unknown or that data isn't available (e.g. no battery, nothing playing).
- Check your token against the [Variables Reference](variables.md) — namespaces and args are case-sensitive.

## Media info shows "No media playing" or doesn't update

- Media metadata comes from the **system media session** (Windows). Start something in a media app.
- In **HTML widgets** you must call `start_media_listener_cmd` yourself and then read `get_media` on the [`media_updated`](events.md#media_updated) event — nothing is injected for you.

## The audio visualizer is blank

- The visualizer needs live **audio capture**; it runs while a visualizer widget is active. Make sure audio is actually playing on the default output device.
- In HTML widgets, start capture with `start_audio_capture` and read the [`audio-samples`](events.md#audio-samples) event.

## Weather shows `NA`

- Weather needs a build with a weather API key. Official releases include one; a **source build without the key** returns `NA`.
- Location is auto-detected from your IP and refreshes hourly. To pin a city you must set a `weatherCity` field in the manifest — see [Settings → Weather](settings.md#weather).

## `window.__TAURI__` is undefined in my HTML widget

- It's populated **asynchronously** — access it after it becomes available, not at the top of the script.
- It's **lost on page reloads/redirects**. Avoid navigating away inside the widget. For robust access, prefer the bundler-based approaches in [Commands → Best Practices](commands.md#best-practices).

## I can't drag my URL widget

- URL widgets are draggable via their **titlebar**. If you **pinned** the widget, the titlebar is removed and dragging is disabled — unpin it to move the widget again.

## The AI assistant won't save my model

- The **test connection** must succeed before a model is saved. Check the model id, API key, and base URL.
- **Ollama** needs a local server running (default `http://localhost:11434`) and no API key.
- Keys are stored in your OS **keyring** — see [AI Assistant](ai-assistant.md#where-keys-are-stored).

## Something works on Windows but not macOS/Linux

Delta Widgets primarily targets **Windows**. System media, audio capture, media-player icons, and window blur (Mica) are Windows-specific and are limited or unavailable on other platforms.

## Updates aren't installing

Release builds check for updates on startup and notify you. You can also check from **Settings → About**. The updater is disabled in development builds.
