# PFIG Wellbeing — Personal Health & Body History Tracker Design Spec

**Date:** 2026-11-11
**Topic:** Post-Event Personal Health & Body Measurement History Tracker

## 1. Overview & Purpose

The 4-round company wellbeing challenge event has concluded. PFIG Wellbeing is transitioning from a fixed 4-round competition app into an ongoing, fun, self-service **Personal Health & Body Measurement Tracker** where employees can log their body metrics daily, weekly, or monthly for their own health journey.

### Core Goals
1. **Automatic Legacy Migration:** Convert existing 4-round (`m1`–`m4`) measurements into the first 4 historical log entries in each employee's timeline (`months.logs`) automatically, while retiring event-specific UI (award ceremony presentation mode, 4-round competition evaluation selectors, and public personal search).
2. **Self-Service Recording & Onboarding:** Allow any signed-in employee to record, edit, and delete their own measurement logs, update their personal goals/profile (`age`, `height`, `gender`), and allow first-time signed-in employees without an existing record to create their own profile linked to their SSO `entra_oid`.
3. **Flexible Measurement Check-In:** Require only `date` + `weight` (for easy daily scale check-ins), auto-calculate `bmi` from height, and allow optional `bodyage`, `muscle`, `fat`, `visceralFat`, `note`, and `photo`.
4. **Five Fun & Engaging Features:**
   - **Celebration Feedback Card:** Instant, witty/encouraging Thai health feedback comparing the new check-in to the previous measurement (plus confetti on milestones).
   - **Personal Goals & Progress Bar:** Customizable target weight, target fat %, target muscle %, or target body age with visual progress bars and healthy BMI range visualizer.
   - **Streaks & Achievements (Badges):** Gamified badges (`first_step`, `streak_3`, `streak_7`, `time_traveler`, `golden_bmi`, `muscle_up`, `fat_burner`, `goal_crusher`) and active check-in streak counter.
   - **Interactive SVG Trend Chart & Timeline History:** Switchable metric trend line chart (`weight`, `bmi`, `bodyage`, `muscle`, `fat`, `visceralFat`) with date range filters (`all`, `30d`, `90d`) and a rich chronological log list with edit/delete actions.
   - **Friendly Community Pulse Board:** Non-pressuring company-wide vitality stats (active check-ins this month/week, top consistency streaks, total logs recorded across PFIG) without exposing other employees' private weights.

---

## 2. Architecture & Data Model

### 2.1 Zero-Migration Hybrid JSONB Schema (`pfig_employees.months`)
To work seamlessly with the existing Supabase `public.pfig_employees` table without requiring manual SQL migrations:
- Top-level columns remain: `id, name, department, age, height, months, entra_oid, created_at`
- `months` JSONB object stores:
  ```json
  {
    "gender": "male" | "female",
    "goals": {
      "targetWeight": 65.0,
      "targetFat": 20.0,
      "targetMuscle": 34.0,
      "targetBodyage": 28
    },
    "logs": [
      {
        "id": "log-m1",
        "date": "2026-07-01",
        "label": "บันทึกเริ่มต้น #1",
        "weight": 85.5,
        "bmi": 27.92,
        "bodyage": 42,
        "muscle": 32.5,
        "fat": 28.4,
        "visceralFat": null,
        "note": "ข้อมูลจากรอบที่ 1",
        "photo": null,
        "legacyRound": "m1"
      }
    ]
  }
  ```
- **Normalization Helper (`normalizeEmployeeTimeline`):**
  - If `months.logs` is missing or empty, any existing `m1`, `m2`, `m3`, `m4` objects with valid weight/bodyage/photo are converted into chronological baseline logs (`legacyRound: "m1".."m4"`).
  - If `months.logs` exists, it is sorted chronologically by `date` (and creation order), and `m1` / latest summary mirrors are kept synchronized for backward compatibility with helper utilities.

### 2.2 API & Authorization (`api/employees.js` & `api/_lib/community-pulse.js`)
- **`GET /api/employees`**:
  - Requires authenticated session (`requireSession`).
  - Auto-claims unlinked employee by normalized name on first login (`listOrClaimEmployeeForIdentity`).
  - Returns `employees` (all rows for Admin `session.canEdit === true`, or only the signed-in employee's row for regular users), `personalHealthRanking`, `communityPulse` (aggregated non-sensitive community stats), and `requiresOnboarding` (`true` when `personalEmployees.length === 0`).
- **`POST /api/employees`**:
  - Requires authenticated session + CSRF (`requireCsrf`).
  - If `session.canEdit` is `true` (Admin): can create any employee row.
  - If regular user (`!session.canEdit`): can self-onboard ONLY if they do not already have a row linked to `session.oid`, and `entra_oid` is forced to `session.oid`.
- **`PATCH /api/employees?id=<id>`**:
  - Requires authenticated session + CSRF (`requireCsrf`).
  - If `session.canEdit` is `true` (Admin): can update any employee row.
  - If regular user (`!session.canEdit`): can update ONLY the row whose `entra_oid` matches `session.oid` (cannot alter `entra_oid` to another user).
- **`DELETE /api/employees?id=<id>`**:
  - Admin only (`requireAdmin` + `requireCsrf`). (Regular employees delete individual log entries via `PATCH` on their `months.logs`, not deleting their employee row).

---

## 3. Core Components & Modules

1. **`health-tracker.js` (Universal UMD + CommonJS helper module):**
   - `normalizeEmployeeTimeline(emp)`: Migrates `m1..m4` into `months.logs` if not yet migrated, sorts logs chronologically, computes BMI if missing.
   - `addOrUpdateHealthLog(emp, logInput)`: Validates and inserts/updates a log entry in `months.logs`, re-sorts, and synchronizes summary fields.
   - `deleteHealthLog(emp, logId)`: Removes a log entry by `id`.
   - `calculateStreakAndStats(logs, nowDate)`: Calculates current streak (consecutive weeks/days with check-ins), total check-ins, check-ins this month, and latest vs baseline/previous deltas.
   - `evaluateBadges(emp)`: Evaluates earned and locked badges based on logs, streak, BMI, bodyage vs real age, muscle/fat progress, and personal goals.
   - `generateCelebrationFeedback(emp, newLog, previousLog)`: Generates a fun, encouraging Thai celebration title, message, and comparison chips after saving a log.
   - `calculateGoalProgress(emp)`: Calculates percentage progress toward each configured personal goal (`targetWeight`, `targetFat`, `targetMuscle`, `targetBodyage`).
   - `buildCommunityPulse(allEmployees, nowDate)`: Server/client safe aggregator returning total tracked employees, check-ins this week/month, active streak leaders (name, department, streak count, total logs, badge count — no private weight/fat numbers), and company-wide total logs.

2. **Frontend Personal Health Hub (`index.html`, `app.js`, `style.css`):**
   - **Self-Onboarding Card:** Shown when a signed-in employee has no linked profile yet, letting them enter Name (pre-filled from SSO), Department, Age, Height, Gender, and optional first weight check-in.
   - **Personal Health Dashboard:**
     - Profile Header with Streak pill, Gender selector, Edit Profile/Goal buttons, and primary **"+ บันทึกข้อมูลร่างกาย (Check-in)"** CTA.
     - **Celebration Banner / Modal:** Pops up with confetti and witty Thai feedback when a new measurement is logged.
     - **Personal Goals & Healthy Weight Range Section:** Progress bars for personal goals + Healthy BMI weight range bar.
     - **Interactive Trend Chart Card:** SVG line chart with metric tabs (`น้ำหนัก`, `BMI`, `อายุร่างกาย`, `กล้ามเนื้อ%`, `ไขมัน%`, `ไขมันช่องท้อง`) and time range pills (`ทั้งหมด`, `90 วัน`, `30 วัน`).
     - **Badges & Achievements Showcase:** Grid of unlocked & locked badges with progress hints.
     - **Friendly Community Pulse Card:** Company activity pulse and consistency leaderboard.
     - **Measurement History Timeline:** Chronological cards showing date, label/note, metrics, deltas from previous log, photo thumbnail, and Edit / Delete buttons.

3. **Admin View:**
   - Streamlined for ongoing health tracking: shows total employees, active check-ins this month, average BMI/body-age change, employee table with latest check-in summary & log count, CSV import/export, and ability to view/manage any employee's logs.
