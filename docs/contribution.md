# Contributing & Architecture

Thanks for your interest in improving Delta Widgets! For the contribution process (issues, branches, pull requests, code of conduct), see [CONTRIBUTING.md](https://github.com/amaan-mohib/delta-widgets/blob/main/CONTRIBUTING.md). This page is an orientation to the codebase for new contributors.

## Tech stack

Delta Widgets is built with **Tauri v2** (Rust backend) + **React 18** + **TypeScript** (Vite), using **Microsoft Fluent UI** for components and **Zustand** for state. It primarily targets **Windows**; some macOS support exists.

## Dev setup

```bash
npm install
npm run tauri dev      # Full app: Rust + Vite HMR (port 1420) — the primary dev loop
npm run dev            # Frontend only (Vite); Rust not compiled
npm run tauri build    # Production bundle (installers + updater artifacts)
npm run build          # Frontend typecheck + build (tsc && vite build)
```

- **Typecheck = `npm run build`** (`tsc` runs first). There is currently no separate lint step or automated test suite.
- Release builds are size-optimized (LTO, `panic = "abort"`) and therefore slow.
- Update-distribution helpers: `npm run gen:latest`, `serve:update`, `test:update` build and serve `latest.json` locally to exercise the auto-updater.
- `npm run bump` keeps the versions in `package.json`, `tauri.conf.json`, and `Cargo.toml` in sync.

## Multi-window / multi-entry architecture

Vite has **four HTML entry points** (`vite.config.ts` → `rollupOptions.input`), each a fully independent React app with its own `main.tsx` and stores:

| Entry HTML | Source dir | Tauri window label | Purpose |
|---|---|---|---|
| `index.html` | `src/main` | `main` | Library/management window, settings, add-widget. Closing **hides** it (app lives in the tray). |
| `creator-index.html` | `src/creator` | `creator` | Visual drag-and-drop editor. |
| `widget-index.html` | `src/widget` | `widget-<key>` | Runtime that renders a `json` widget. |
| `ai-index.html` | `src/ai` | assistant | Optional [AI assistant](ai-assistant.md). |

Windows are created from Rust in `src-tauri/src/commands/widget.rs`. Cross-window data is passed via **injected init scripts** (e.g. `window.__INITIAL_STATE__`, `window.__INITIAL_WIDGET_STATE__`), not props or routing.

`html` widgets don't load a Vite bundle — they're served by a **local HTTP server** (`src-tauri/src/plugins/localhost.rs`). `url` widgets load the remote page directly.

## Rust ↔ TypeScript bridge

All `invoke` calls are centralized and typed in **`src/common/commands.ts`**. Rust commands live in `src-tauri/src/commands/*.rs`, registered in `src-tauri/src/lib.rs`'s `invoke_handler!`.

**Adding a command = three edits:**

1. Implement it in a `commands/*.rs` module.
2. Register it in `lib.rs`.
3. Add a typed wrapper in `src/common/commands.ts`.

App bootstrap is `lib.rs::run` → `setup::init::init_app` (updater, tray, autostart, widgets, DB).

## The manifest is the source of truth

A widget is a folder containing a `manifest.json`, typed as `IWidget`. See the [Manifest Reference](manifest.md). The Creator's central store is `src/creator/stores/useManifestStore.ts`; it derives a flat `elementMap` from the recursive `elements` tree, auto-saves (debounced) to disk, and maintains an undo/redo history.

## Two migration systems (don't confuse them)

1. **Manifest migrations** — `src-tauri/src/migrations/*.rs` implementing the `Migration` trait. They transform every installed widget's `manifest.json`, or seed/remove template widgets. Run on startup, tracked in `.migrations.json`. Scaffold with:

    ```bash
    npm run create:migration <name>
    ```

    This generates the `.rs` file **and** rebuilds `migrations/mod.rs::all_migrations()` in chronological order. The generated `up()` panics until you implement it.

2. **SQLite migrations** — `src-tauri/migrations/*.sql` (sqlx), for the local DB (`chats`, `messages`, `media_history`) backing the AI assistant and media history.

Bundled widget templates live in `src-tauri/widget_templates/` and are embedded into the binary (`include_dir!`), then copied to the widgets directory on first run.
