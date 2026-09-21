# Variables Reference

Visual-Editor (`json`) widgets support **handlebar-like variables** inside text and image components. At runtime Delta Widgets replaces each `{{...}}` token with live data.

!!! warning "Visual Editor only"

    Variables are powered by the Visual-Editor runtime. They do **not** work in [HTML](overview.md#custom-html-widgets) or [URL](overview.md#url-widgets) widgets — those must call [Tauri commands](commands.md) / [events](events.md) themselves.

---

## Syntax

```
{{namespace}}          → uses the namespace's default format
{{namespace:arg}}      → passes an argument (a key or a date format)
```

- `namespace` is one of: `time`, `date`, `datetime`, `media`, `system`, `weather`, `custom`.
- Unknown or not-yet-loaded variables render as `Loading...`; unknown args generally render `NA`.

---

## Date & time

`time`, `date`, and `datetime` all format the current date using [date-fns format tokens](https://date-fns.org/docs/format). Called with no argument, each uses a sensible default:

| Variable | Default format | Example |
|---|---|---|
| `{{time}}` | `hh:mm aa` | `09:41 PM` |
| `{{date}}` | `yyyy-MM-dd` | `2026-09-21` |
| `{{datetime}}` | `eeee, MMMM d yyyy, h:mm aa` | `Monday, September 21 2026, 9:41 PM` |

Pass your own format string:

```
{{time:HH:mm}}                 → 21:41
{{time:HH:mm:ss}}              → 21:41:07
{{date:dd/MM/yyyy}}           → 21/09/2026
{{datetime:eee, d MMM yyyy}}  → Mon, 21 Sep 2026
```

### Time zones

Append a time zone in square brackets to render in a specific zone (IANA name):

```
{{time:HH:mm:[America/New_York]}}
{{datetime:eeee h:mm aa:[Asia/Kolkata]}}
```

An invalid date or format renders `Invalid date or format`.

---

## `media`

Live "now playing" info from the system media session. Renders friendly placeholders when nothing is playing.

| Arg | Description |
|---|---|
| `title` | Track title |
| `artist` | Artist |
| `player` | Player name (falls back to player id) |
| `player_icon` | Local path to the player's icon (as an image source) |
| `status` | Playback status |
| `thumbnail` | Album/track art (as an image source; falls back to a default image) |
| `position` | Current position (ms) |
| `duration` | Total duration (ms) |
| `position_text` | Current position formatted `m:ss` / `h:mm:ss` |
| `duration_text` | Duration formatted `m:ss` / `h:mm:ss` |
| `next_enabled` | `true`/`false` — is the next control available |
| `prev_enabled` | `true`/`false` — is the previous control available |
| `play_enabled` | `true`/`false` |
| `pause_enabled` | `true`/`false` |
| `stop_enabled` | `true`/`false` |
| `shuffle_enabled` | `true`/`false` |
| `repeat_enabled` | `true`/`false` |
| `toggle_enabled` | `true`/`false` |

```
{{media:title}} — {{media:artist}}   ({{media:position_text}} / {{media:duration_text}})
```

---

## `system`

System stats. Storage sizes are human-readable (e.g. `7.6 GB`); `*_bytes` variants return raw bytes.

| Arg | Description |
|---|---|
| `hostname` | Machine hostname |
| `os` | OS name + version |
| `os_version` | OS version |
| `kernel` | Kernel version |
| `cpu_model` | CPU brand |
| `cpu_lcores` | Logical core count |
| `cpu_usage` | CPU usage, e.g. `12.3%` |
| `cpu_speed` | CPU speed, e.g. `3.20 Ghz` |
| `memory_total` / `memory_used` / `memory_available` | RAM (human-readable) |
| `memory_total_bytes` / `memory_used_bytes` / `memory_available_bytes` | RAM (bytes) |
| `swap_total` / `swap_used` / `swap_available` | Swap (human-readable) |
| `swap_total_bytes` / `swap_used_bytes` / `swap_available_bytes` | Swap (bytes) |
| `battery_charge` | Battery charge % |
| `battery_health` | Battery health % |
| `battery_model` | Battery model |
| `battery_vendor` | Battery vendor |
| `battery_cycles` | Charge cycle count |
| `battery_technology` | Battery technology |

```
CPU {{system:cpu_usage}} · RAM {{system:memory_used}}/{{system:memory_total}}
```

---

## `weather`

Current weather, refreshed hourly.

!!! note "Location & availability"

    By default the location is **auto-detected from your IP address** — no setup needed in official builds. Pinning a specific city requires a `weatherCity` field in the manifest; see [Settings & Data → Weather](settings.md#weather). If you build from source **without** a weather API key, all weather variables return `NA`.

| Arg | Description |
|---|---|
| `city` | Location name |
| `region` | Region / state |
| `country` | Country |
| `temperature_celsius` | e.g. `24.5°C` |
| `temperature_fahrenheit` | e.g. `76.1°F` |
| `humidity` | e.g. `48.0%` |
| `description` | Condition text (e.g. `Partly cloudy`) |
| `icon` | Condition icon (as an image source) |
| `precip_mm` / `precip_in` | Precipitation |
| `pressure_mb` / `pressure_in` | Pressure |
| `uv_index` | UV index |

```
{{weather:city}}: {{weather:temperature_celsius}}, {{weather:description}}
```

---

## `custom`

User-defined fields you create on the widget. `{{custom:<key>}}` renders the field's value (or `NA` if the key is missing).

```
{{custom:greeting}}
```

### Defining custom fields

In the **Creator**, open the **Custom Variables** dialog → **Fields** tab → **Add custom field**:

| Input | Required | Meaning |
|---|---|---|
| **Name** | Yes | Display label; also used to derive the key. |
| **Value** | Yes | The text substituted wherever `{{custom:<key>}}` appears. |
| **Description** | No | Helper text only. |

The **key** is auto-generated from the Name: lowercased with spaces replaced by hyphens (e.g. `My Note` → `my-note`, referenced as `{{custom:my-note}}`). Each saved field appears as a draggable token under the **Custom Fields** category.

See the [manifest reference](manifest.md#tcustomfields) for the stored shape.
