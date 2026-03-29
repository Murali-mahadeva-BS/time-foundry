# Time Foundry — Product Vision

## Overview

A Chrome extension for individual developers to manage tasks and track focused work time using the Pomodoro technique. The app opens as a full-page Chrome extension tab (not a popup or new tab override). All data is stored locally — no accounts, no cloud sync.

**Target user:** Individual developers
**Scope:** Single-user, local-only, free

---

## Data Hierarchy

```
Project
  └── List
        └── Task
```

- Every task must belong to a project and a list.
- A project contains one or more lists; each list is a todo list.

---

## Task Management

### Task Properties
- Title
- Notes / description
- Estimated time (clock-based, e.g., 3h 30m)
- Priority: `Urgent` | `High` | `Medium` | `Low`
- Status (project-specific, see below)
- Creation date

### Task Statuses
- Each project has its own set of statuses.
- Default statuses: `Todo → In Progress → Done`
- Users can create custom statuses, freely order them within a project.
- When creating a new project, user can import statuses from an existing project.

### Filtering & Sorting
- Tasks are filterable by status (e.g., hide Done tasks).
- Filter state is persisted across sessions per project/list.
- Tasks are sortable by creation date.

### Priority
- Fixed levels: `Urgent`, `High`, `Medium`, `Low`

---

## Pomodoro Timer

- A Pomodoro session is started on a specific task.
- Only one timer runs at a time.
- Time is automatically logged to the task when a session ends.
- If a session is abandoned mid-way, partial time is still logged.

### Timer Settings (Global)
- Work session duration (default: 25 min)
- Short break duration (default: 5 min)
- Long break duration (default: 15 min)
- Long break after every N sessions (default: 4)

### Idle Detection
- If the user is inactive, the timer is automatically paused.
- Timer resumes automatically when activity is detected.
- Idle time is excluded from logged time.

### Timer Controls
- Pause, resume, skip, or extend a session mid-way.

### Notifications
- Desktop notifications fire when a session or break ends.
- Notifications work even when the extension tab is closed (via background service worker).
- Break end reminders notify the user to resume work.

---

## Estimated vs. Actual Time

- Task estimate is entered in clock time (e.g., 3 hours).
- Actual time = number of completed (or partial) Pomodoro sessions × work session duration for that task.
- Reports show the delta between estimated and actual time per task.

---

## Reporting & Analytics

Time range presets: **Day**, **Week**, **Month**

### Reports
- Time spent per task
- Total work time per day / week / month
- Estimated vs. actual time comparison per task
- Focus streaks: number of consecutive Pomodoro sessions completed without interruption
- Most productive hours of the day (heatmap or similar)

### Data Rules
- Idle time is excluded from all time calculations.
- Completed and in-progress tasks both contribute to historical report data.
- Tasks are never deleted from reports even if marked Done.

---

## UX

- Dark mode support
- Settings / preferences panel (global Pomodoro settings)
- Full-page UI (not a popup or side panel)

---

## Out of Scope (v1)

- Cloud sync or user accounts
- External integrations (GitHub, Jira, Linear, etc.)
- Mobile or web companion app
- Team / collaboration features
- Custom priority levels
- Custom date range in reports
