# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## How This Project Is Built

This project is built entirely by Claude Code (AI coding agent), not a human developer. When discussing effort, task scope, or complexity, frame it in terms of what Claude can accomplish autonomously in a session — not in human dev-hours or sprints.

## Project Overview

Time Foundry is a multi-platform Pomodoro timer and task manager for individual developers. All data is stored locally — no accounts, no cloud sync.

Data hierarchy: **Project → List → Task**. Each task must belong to both a project and a list. Projects own their own set of statuses (default: Todo → In Progress → Done), which can be customized per project.

### Platform targets

| Platform | Status | Location |
| -------- | ------ | -------- |
| Chrome extension (Manifest V3) | ✅ built | `apps/chrome/` |
| VS Code extension | ✅ built, untested at runtime | `apps/vscode/` |
| Web app | deferred | — |
| Mobile (Expo) | deferred | — |

## Repository Structure

```
time-foundry/                  ← monorepo root (Turborepo + pnpm workspaces)
├── packages/
│   ├── core/                  ← types, Dexie DB, timer engine, StorageAdapter interface
│   └── ui/                    ← all React components, pages, shared stores
├── apps/
│   ├── chrome/                ← Chrome Manifest V3 extension
│   └── vscode/
│       ├── extension/         ← VS Code extension host (Node.js/CommonJS)
│       └── webview/           ← React UI served in the VS Code WebviewPanel
```

## Commands

```bash
# From monorepo root
pnpm build              # build all packages + apps in dependency order
pnpm dev                # start all dev servers in parallel

# Per-package
pnpm --filter @time-foundry/core build          # compile core to dist/ (required before VS Code host)
pnpm --filter @time-foundry/chrome build        # Chrome extension → apps/chrome/dist/
pnpm --filter time-foundry build                # VS Code extension → apps/vscode/dist/

# Chrome extension dev
cd apps/chrome && pnpm dev      # Vite dev server
cd apps/chrome && pnpm watch    # watch mode for unpacked extension

# VS Code extension dev
# 1. pnpm --filter @time-foundry/core build
# 2. Open apps/vscode/ in VS Code and press F5 (Extension Development Host)
# 3. Run command: Time Foundry: Open

# Regenerate Chrome extension icons
node apps/chrome/scripts/generate-icons.mjs
```

## Architecture

### packages/core

Compiled to CommonJS (`dist/`) for the VS Code extension host. Consumed as TypeScript source by Vite builds via `resolve.alias` (bypasses the package exports entirely for browser targets).

Contains:

- **Types** (`src/types/index.ts`) — Project, List, Task, PomodoroSession, TimerState, Settings, etc.
- **Dexie DB** (`src/db/index.ts`) — `TimeFoundryDB` with projects/lists/tasks/sessions tables
- **Timer engine** (`src/timer/engine.ts`) — pure state machine functions: `computeStartTimer`, `computePauseTimer`, `computeResumeTimer`, `computeTimerEnd`, `computeSkipSession`, `computeStopTimer`, `computeExtendTimer`, `buildPendingSession`, `checkEstimateExceeded`, `DEFAULT_SETTINGS`, `DEFAULT_TIMER`
- **Storage interfaces** (`src/storage/interface.ts`) — `StorageAdapter`, `AlarmAdapter`, `NotificationAdapter`

### packages/ui

Source-only (no compilation). Bundled by each app's Vite config. Contains all shared React code.

- **`src/stores/app.store.ts`** — Dexie-based CRUD for projects/lists/tasks/sessions
- **`src/stores/ui.store.ts`** — navigation state (selected project/list/task, filters); persists filters to `localStorage` as `tf_uiFilters`
- **`src/stores/timer.store.ts`** — stub with correct interface shape; overridden per-platform via Vite alias
- **`src/stores/settings.store.ts`** — stub with correct interface shape; overridden per-platform via Vite alias
- **`src/components/`** — all React components (layout, tasks, editor, settings, projects, ui primitives)
- **`src/pages/`** — ProjectPage, TaskPage, ReportsPage, FeedbackPage
- **`src/lib/`** — `utils.ts`, `time.ts`

### Platform store override pattern

Both `timer.store` and `settings.store` in `packages/ui` are stubs. Each platform's Vite config overrides them with platform-specific implementations:

```typescript
// apps/chrome/vite.config.ts  (and apps/vscode/webview/vite.config.ts)
resolve: {
  alias: {
    '@ui/stores/timer.store':    path.resolve(__dirname, './src/timer.store.ts'),
    '@ui/stores/settings.store': path.resolve(__dirname, './src/settings.store.ts'),
  }
}
```

- **Chrome** — timer store sends `chrome.runtime.sendMessage`; settings store reads/writes `chrome.storage.local`
- **VS Code webview** — timer store sends postMessage to extension host via `vscode-bridge.ts`; settings store uses `localStorage`

### apps/chrome

Two execution contexts:

1. **Background service worker** ([apps/chrome/src/background.ts](apps/chrome/src/background.ts)) — owns the Pomodoro timer. Uses `chrome.alarms`, `chrome.idle`, `chrome.storage.local`. Writes completed sessions to `pendingSessions`.

2. **Foreground React app** ([apps/chrome/src/App.tsx](apps/chrome/src/App.tsx)) — on mount, calls `syncPendingSessions()` to drain `chrome.storage.local` → Dexie. Polls background timer state every 5 s and ticks locally every 1 s.

The `@` alias resolves to `apps/chrome/src/`. `@ui` resolves to `packages/ui/src/`. `@time-foundry/core` resolves to `packages/core/src/index.ts` (TS source, not compiled dist).

`@crxjs/vite-plugin` handles extension packaging: processes `manifest.json`, compiles the service worker, outputs to `apps/chrome/dist/`.

### apps/vscode

Two sub-projects compiled separately:

**Extension host** (`apps/vscode/extension/`) — Node.js/CommonJS, compiled by `tsc -p extension/tsconfig.json`:

- `extension.ts` — `activate()`: creates `TimerHost` + `WebviewPanel`, registers `timeFoundry.open` command, status bar item showing live countdown
- `timer-host.ts` — uses `setTimeout` (no `chrome.alarms`); calls `packages/core` engine functions; emits state changes to listeners
- `storage-service.ts` — implements `StorageAdapter` using `context.globalState`
- `webview-panel.ts` — manages `vscode.WebviewPanel`; handles `READY` (sends timer state + pending sessions), `CLEAR_PENDING_SESSIONS`, and timer commands from webview

**Webview** (`apps/vscode/webview/`) — React/Vite, compiled by `vite build --config webview/vite.config.ts`, output to `apps/vscode/dist/webview/`:

- `vscode-bridge.ts` — wraps `acquireVsCodeApi()`, exports `onTimerStateChange`, `sendToHost`, `notifyReady`
- `timer-store.ts` — Zustand store; on `init()` subscribes to host state and calls `notifyReady()`
- `settings.store.ts` — localStorage-based settings; applies theme to `document.documentElement`
- `App.tsx` — mounts AppShell; syncs pending sessions via `PENDING_SESSIONS` postMessage event

Timer state flow: host → webview on every tick (1 s interval via `onStateChange` listener).
Pending sessions flow: webview sends READY → host sends PENDING_SESSIONS → webview writes to Dexie → webview sends CLEAR_PENDING_SESSIONS.

### UI Structure

```text
AppShell  (packages/ui/src/components/layout/AppShell.tsx)
├── Sidebar          (project/list tree + nav to Reports/Settings/Feedback)
├── main content     (switches on selectedView / selectedTaskId)
│   ├── ProjectPage  (task table per list)
│   ├── TaskPage     (task detail + RichTextEditor notes)
│   ├── ReportsPage  (recharts: estimate vs actual, productive hours, task breakdown)
│   ├── SettingsPanel
│   └── FeedbackPage
└── PomodoroBar      (always visible at bottom; timer controls)
```

Routing is state-driven (no router library). `AppShell` reads `selectedView`, `selectedProjectId`, and `selectedTaskId` from `useUIStore`. `selectedTaskId` takes priority over everything else.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite` plugin). Color themes are CSS class-based (`theme-sky`, `theme-deepsea`, `theme-foundry`, etc.) applied to `document.documentElement`. The `custom` theme writes `--primary`, `--ring`, `--primary-foreground` CSS custom properties directly. Component primitives are shadcn/ui-style wrappers around Radix UI in `packages/ui/src/components/ui/`.

### Notes Editor

`RichTextEditor` ([packages/ui/src/components/editor/RichTextEditor.tsx](packages/ui/src/components/editor/RichTextEditor.tsx)) is TipTap-based and supports:

- markdown paste parsing via `markdown-it`
- toolbar: heading level, bold/italic/strike, lists, blockquote, hr, link, code block, undo/redo
- table insert/delete from toolbar; contextual row/column controls on hovered cells
- pasted image embedding as base64
