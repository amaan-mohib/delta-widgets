# Settings & Data

Settings live in the **main window** (open it from the tray if it's hidden). This page also documents where Delta Widgets stores your data and what telemetry it sends.

---

## General

- **Launch on startup** — toggles auto-start with the OS. This is **enabled by default** on first run. When the app is launched via autostart, the main window starts hidden.

## Tray & window behavior

Delta Widgets lives in the **system tray**. Closing the main window **hides** it rather than quitting — your widgets keep running. The tray menu has:

- **Show** — reveal and focus the main window.
- **Quit** — exit the app entirely.

---

## Theme

Under **Settings → Theme**:

- **Mode** — `Light`, `Dark`, or `System` (follows your OS preference).
- **Color** — accent color: `Default`, `Blue`, `Red`, `Green`, or `Yellow`.
- **Override theme in widgets if not provided?** — when enabled, widgets without their own [theme](manifest.md#iwidget) inherit the app theme.

### Window blur (Windows only)

On Windows, windows use the **Mica** blur effect automatically (dark/light chosen from the resolved theme). There is no separate toggle. On macOS and Linux this is a no-op and a solid background is used instead.

---

## Weather

Weather variables (`{{weather:*}}`, see [Variables](variables.md#weather)) work out of the box in official builds and refresh **hourly**:

- **Location** is auto-detected from your **IP address** by default.
- **Weather data** comes from a third-party weather API. The API key is baked in at build time — if you build from source without it, weather variables return `NA`.

!!! note "Pinning a specific city"

    There is no settings UI for the weather location. To force a city, the widget's `manifest.json` must contain a [custom field](variables.md#custom) with the exact (case-sensitive) key **`weatherCity`** whose value is the city name. Because the custom-field editor lowercases keys, this override generally has to be set by editing the manifest JSON directly.

---

## Updates

Release builds include an **auto-updater**. On startup the app checks for a newer version and, if one is found, shows a desktop **notification**. You can also trigger/apply an update from **Settings → About**. The updater is disabled in development builds.

---

## Telemetry

Delta Widgets sends **anonymous usage analytics** to Mixpanel.

- **What's sent:** an event name plus an anonymous, randomly generated client id, the app version, and the OS. IP-based geolocation is explicitly disabled on the analytics request.
- **Example events:** install, updated, update clicked, widget created, widget enabled, AI model added, and AI tool usage.
- **When it's off:** analytics are **not** sent in development builds, or in any build compiled without an analytics token.

!!! warning "No in-app opt-out"

    There is currently **no settings toggle to disable telemetry**. If you need analytics fully off, build from source without an analytics token. (Data is anonymous and not tied to your identity.)

---

## Where your data lives

Everything is stored locally under the app data directory for the bundle id `com.delta-widgets.app`:

| OS | Path |
|---|---|
| **Windows** | `%APPDATA%\com.delta-widgets.app\` |
| **macOS** | `~/Library/Application Support/com.delta-widgets.app/` |
| **Linux** | `~/.config/com.delta-widgets.app/` |

Inside it:

| Path | Contents |
|---|---|
| `widgets/` | One folder per widget (`<key>/manifest.json` + assets). See the [Manifest Reference](manifest.md). |
| `store.json` | App settings (theme, autostart, AI model configs *without* keys, etc.). |
| `delta_widgets.db` | SQLite database (WAL mode) for [AI](ai-assistant.md) chats/messages and media history. |
| `.migrations.json` | Tracks which manifest migrations have run. |

!!! tip "Backup"

    To back up your widgets and settings, copy the whole app data folder above. API keys live in your OS keyring (not in these files) — see the [AI Assistant](ai-assistant.md#where-keys-are-stored) page.
