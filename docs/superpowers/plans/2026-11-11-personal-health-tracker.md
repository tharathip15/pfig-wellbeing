# Personal Health & Body History Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform PFIG Wellbeing from a 4-round competition event app into a fun, self-service personal health and body measurement history tracker with automatic `m1`–`m4` timeline migration, daily/weekly/monthly check-ins, interactive trend charts, personal goals, streaks/badges, celebration feedback, and a friendly community pulse board.

**Architecture:** Store chronological `logs` and personal `goals` inside the existing `pfig_employees.months` JSONB column, automatically migrating legacy `m1`–`m4` rounds into initial timeline entries on read/write. Upgrade `/api/employees` so signed-in employees can self-onboard and update their own record (verified by `session.oid`) and receive anonymized `communityPulse` data alongside their profile.

**Tech Stack:** Vanilla JavaScript (ES6+ / CommonJS UMD modules for shared logic), HTML5, CSS3, Vercel Serverless Functions (`api/`), Supabase REST API, Node.js built-in test runner (`node --test`).

**Spec:** `docs/superpowers/specs/2026-11-11-personal-health-tracker-design.md`

## Global Constraints

- Preserve SSO authentication (`auth.js`, `/api/login-sso`, `/api/pfig-sso`, `/api/session`) and light/dark theme tokens in `style.css`.
- Automatically migrate legacy `m1`–`m4` data into `months.logs` without losing existing measurements.
- Require only `date` and `weight` when logging a measurement; `bodyage`, `muscle`, `fat`, `visceralFat`, `note`, and `photo` are optional, and `bmi` is auto-calculated from employee `height`.
- Enforce strict ownership in `/api/employees`: non-admin users may only create or update their own record (`entra_oid === session.oid`).

---

### Task 1: Core Health Tracker Engine (`health-tracker.js`)

**Files:**
- Create: `health-tracker.js`
- Test: `tests/health-tracker.test.js`

**Interfaces:**
- Produces: `PfigHealthTracker` UMD/CommonJS module with:
  - `normalizeEmployeeTimeline(emp)`
  - `addOrUpdateHealthLog(emp, logInput)`
  - `deleteHealthLog(emp, logId)`
  - `calculateStreakAndStats(logs, nowDate)`
  - `evaluateBadges(emp)`
  - `generateCelebrationFeedback(emp, newLog, previousLog)`
  - `calculateGoalProgress(emp)`
  - `buildCommunityPulse(allEmployees, nowDate)`

- [ ] **Step 1: Write the failing test in `tests/health-tracker.test.js`**
- [ ] **Step 2: Run `node --test tests/health-tracker.test.js` to verify it fails**
- [ ] **Step 3: Implement `health-tracker.js`**
- [ ] **Step 4: Run `node --test tests/health-tracker.test.js` to verify it passes**

---

### Task 2: Self-Service Employee API & Community Pulse (`api/employees.js`)

**Files:**
- Modify: `api/employees.js`
- Test: `tests/self-service-api.test.js`
- Modify: `tests/auth-api.test.js`

**Interfaces:**
- Consumes: `buildCommunityPulse` from `health-tracker.js`
- Produces:
  - `GET /api/employees` returning `{ ok, mode, employees, personalHealthRanking, communityPulse, requiresIdentityLink, requiresOnboarding }`
  - `POST /api/employees` allowing signed-in employee self-onboarding (`entra_oid = session.oid`) or admin employee creation
  - `PATCH /api/employees?id=<id>` allowing signed-in employee to update their own record (`entra_oid === session.oid`) or admin to update any record

- [ ] **Step 1: Write the failing test in `tests/self-service-api.test.js`**
- [ ] **Step 2: Run `node --test tests/self-service-api.test.js` to verify it fails**
- [ ] **Step 3: Update `api/employees.js` and `tests/auth-api.test.js`**
- [ ] **Step 4: Run `node --test tests/self-service-api.test.js tests/auth-api.test.js` to verify they pass**

---

### Task 3: Personal Health Tracker UI, Check-In Modal, Trend Chart, Goals, Badges & Community Board (`index.html`, `app.js`, `style.css`)

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `style.css`
- Test: `tests/personal-tracker-ui.test.js`

**Interfaces:**
- Consumes: `window.PfigHealthTracker` from `health-tracker.js` and `/api/employees`
- Produces:
  - Self-onboarding card for new signed-in employees
  - Quick Check-In modal (`#checkin-modal`) requiring `date` + `weight` with optional `bodyage`, `muscle`, `fat`, `visceralFat`, `note`, `photo`
  - Personal Goal modal (`#goal-modal`) & Goal Progress visualizer
  - Celebration banner/modal (`#celebration-modal`) with confetti and witty Thai feedback
  - Interactive SVG Trend Chart with metric & date range filters
  - Badges & Achievements grid
  - Friendly Community Pulse section
  - Chronological measurement history timeline with Edit/Delete actions

- [ ] **Step 1: Write the failing test in `tests/personal-tracker-ui.test.js`**
- [ ] **Step 2: Run `node --test tests/personal-tracker-ui.test.js` to verify it fails**
- [ ] **Step 3: Implement UI updates in `index.html`, `app.js`, and `style.css`**
- [ ] **Step 4: Run `npm test` to verify all tests pass**
