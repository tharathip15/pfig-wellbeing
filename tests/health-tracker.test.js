const assert = require("node:assert/strict");
const test = require("node:test");

const tracker = require("../health-tracker.js");

test("normalizeEmployeeTimeline converts legacy m1..m4 rounds into chronological logs automatically", () => {
  const emp = {
    id: "emp-1",
    name: "Somchai",
    department: "IT",
    age: 35,
    height: 170,
    months: {
      gender: "male",
      m1: { weight: 80, bodyage: 42, muscle: 31, fat: 28 },
      m2: { weight: 78, bodyage: 40, muscle: 31.5, fat: 26.5 },
      m3: { weight: 76.5, bodyage: 38, muscle: 32, fat: 25 },
      m4: { weight: 75, bodyage: 35, muscle: 33, fat: 23.5 },
    },
  };

  const normalized = tracker.normalizeEmployeeTimeline(emp);
  assert.equal(Array.isArray(normalized.months.logs), true);
  assert.equal(normalized.months.logs.length, 4);
  assert.equal(normalized.months.logs[0].legacyRound, "m1");
  assert.equal(normalized.months.logs[0].weight, 80);
  assert.equal(normalized.months.logs[0].bmi, 27.68);
  assert.equal(normalized.months.logs[3].legacyRound, "m4");
  assert.equal(normalized.months.logs[3].weight, 75);
  assert.equal(normalized.months.logs[3].bodyage, 35);
});

test("addOrUpdateHealthLog requires only date and weight and auto-calculates bmi", () => {
  const emp = tracker.normalizeEmployeeTimeline({
    id: "emp-2",
    name: "Suda",
    department: "HR",
    age: 29,
    height: 160,
    months: {
      gender: "female",
      m1: { weight: 60, bodyage: 31, muscle: 26, fat: 30 },
    },
  });

  const { employee: updated, savedLog, previousLog } = tracker.addOrUpdateHealthLog(emp, {
    date: "2026-11-11",
    weight: 58.4,
    note: "ชั่งตอนเช้าหลังตื่นนอน",
  });

  assert.equal(updated.months.logs.length, 2);
  assert.equal(savedLog.weight, 58.4);
  assert.equal(savedLog.bmi, 22.81);
  assert.equal(savedLog.bodyage, null);
  assert.equal(savedLog.note, "ชั่งตอนเช้าหลังตื่นนอน");
  assert.equal(previousLog.weight, 60);
});

test("addOrUpdateHealthLog updates an existing log by id and deleteHealthLog removes it", () => {
  let emp = tracker.normalizeEmployeeTimeline({
    id: "emp-3",
    name: "Anan",
    department: "Sales",
    age: 32,
    height: 175,
    months: { gender: "male" },
  });

  const first = tracker.addOrUpdateHealthLog(emp, {
    id: "log-custom-1",
    date: "2026-11-01",
    weight: 72,
    visceralFat: 9,
  });
  emp = first.employee;
  assert.equal(emp.months.logs.length, 1);
  assert.equal(emp.months.logs[0].visceralFat, 9);

  const edited = tracker.addOrUpdateHealthLog(emp, {
    id: "log-custom-1",
    date: "2026-11-01",
    weight: 71.2,
    visceralFat: 8.5,
    bodyage: 30,
  });
  emp = edited.employee;
  assert.equal(emp.months.logs.length, 1);
  assert.equal(emp.months.logs[0].weight, 71.2);
  assert.equal(emp.months.logs[0].visceralFat, 8.5);
  assert.equal(emp.months.logs[0].bodyage, 30);

  emp = tracker.deleteHealthLog(emp, "log-custom-1");
  assert.equal(emp.months.logs.length, 0);
});

test("calculateStreakAndStats computes active check-in streak and baseline/previous diffs", () => {
  const emp = tracker.normalizeEmployeeTimeline({
    id: "emp-4",
    name: "Nida",
    department: "Finance",
    age: 34,
    height: 165,
    months: {
      gender: "female",
      logs: [
        { id: "l1", date: "2026-10-25", weight: 64.0, bmi: 23.51, bodyage: 36, muscle: 26.0, fat: 31.0 },
        { id: "l2", date: "2026-11-02", weight: 63.2, bmi: 23.21, bodyage: 35, muscle: 26.5, fat: 30.2 },
        { id: "l3", date: "2026-11-10", weight: 62.5, bmi: 22.96, bodyage: 33, muscle: 27.2, fat: 29.5 },
      ],
    },
  });

  const stats = tracker.calculateStreakAndStats(emp, "2026-11-11");
  assert.equal(stats.totalLogs, 3);
  assert.equal(stats.streakCount, 3);
  assert.equal(stats.logsThisMonth, 2);
  assert.equal(stats.latestVsBaseline.weightDiff, -1.5);
  assert.equal(stats.latestVsBaseline.bodyageDiff, -3);
  assert.equal(stats.latestVsPrevious.weightDiff, -0.7);
});

test("evaluateBadges unlocks achievements for streaks, body age, golden BMI, muscle gain, and goal completion", () => {
  const emp = tracker.normalizeEmployeeTimeline({
    id: "emp-5",
    name: "Korn",
    department: "IT",
    age: 35,
    height: 172,
    months: {
      gender: "male",
      goals: {
        targetWeight: 65,
        targetFat: 20,
      },
      logs: [
        { id: "l1", date: "2026-10-20", weight: 68.0, bmi: 22.99, bodyage: 37, muscle: 32.0, fat: 22.0 },
        { id: "l2", date: "2026-10-28", weight: 66.5, bmi: 22.48, bodyage: 35, muscle: 33.0, fat: 20.8 },
        { id: "l3", date: "2026-11-05", weight: 64.8, bmi: 21.9, bodyage: 33, muscle: 33.8, fat: 19.5 },
      ],
    },
  });

  const badges = tracker.evaluateBadges(emp, "2026-11-11");
  const unlockedIds = badges.filter(b => b.unlocked).map(b => b.id);
  assert.equal(unlockedIds.includes("first_step"), true);
  assert.equal(unlockedIds.includes("streak_3"), true);
  assert.equal(unlockedIds.includes("time_traveler"), true);
  assert.equal(unlockedIds.includes("golden_bmi"), true);
  assert.equal(unlockedIds.includes("muscle_up"), true);
  assert.equal(unlockedIds.includes("fat_burner"), true);
  assert.equal(unlockedIds.includes("goal_crusher"), true);
});

test("generateCelebrationFeedback creates fun encouraging Thai messages after saving a log", () => {
  const emp = { id: "emp-6", name: "Ploy", age: 30, height: 160, months: { gender: "female" } };
  const prevLog = { id: "l1", date: "2026-11-01", weight: 60.0, bmi: 23.44, bodyage: 32 };
  const newLog = { id: "l2", date: "2026-11-11", weight: 59.2, bmi: 23.13, bodyage: 29 };

  const feedback = tracker.generateCelebrationFeedback(emp, newLog, prevLog);
  assert.ok(feedback.title.length > 0);
  assert.ok(feedback.message.length > 0);
  assert.equal(Array.isArray(feedback.highlights), true);
  assert.equal(feedback.highlights.some(h => h.includes("-0.8") || h.includes("0.8 kg")), true);
  assert.equal(feedback.highlights.some(h => h.includes("อายุร่างกาย")), true);
});

test("calculateGoalProgress computes percentage progress toward personal targets", () => {
  const emp = tracker.normalizeEmployeeTimeline({
    id: "emp-7",
    name: "Ton",
    department: "Ops",
    age: 31,
    height: 170,
    months: {
      gender: "male",
      goals: {
        targetWeight: 70,
        targetFat: 20,
        targetMuscle: 35,
        targetBodyage: 28,
      },
      logs: [
        { id: "l1", date: "2026-10-01", weight: 80, bmi: 27.68, bodyage: 36, muscle: 31, fat: 28 },
        { id: "l2", date: "2026-11-11", weight: 75, bmi: 25.95, bodyage: 32, muscle: 33, fat: 24 },
      ],
    },
  });

  const goals = tracker.calculateGoalProgress(emp);
  assert.equal(goals.hasGoals, true);
  const weightGoal = goals.items.find(g => g.key === "targetWeight");
  assert.equal(weightGoal.progressPct, 50);
  assert.equal(weightGoal.achieved, false);
});

test("buildCommunityPulse summarizes company-wide activity without leaking private weights", () => {
  const allEmployees = [
    {
      id: "e1",
      name: "Alice",
      department: "Sales",
      age: 30,
      height: 165,
      months: {
        logs: [
          { id: "1", date: "2026-10-28", weight: 58 },
          { id: "2", date: "2026-11-04", weight: 57.5 },
          { id: "3", date: "2026-11-10", weight: 57.2 },
        ],
      },
    },
    {
      id: "e2",
      name: "Bob",
      department: "IT",
      age: 35,
      height: 175,
      months: {
        m1: { weight: 82, bodyage: 40 },
      },
    },
  ];

  const pulse = tracker.buildCommunityPulse(allEmployees, "2026-11-11");
  assert.equal(pulse.totalTrackedEmployees, 2);
  assert.equal(pulse.activeThisMonth, 1);
  assert.equal(pulse.activeThisWeek, 1);
  assert.equal(pulse.totalLogsCompanyWide, 4);
  assert.equal(pulse.consistencyLeaders[0].name, "Alice");
  assert.equal(pulse.consistencyLeaders[0].streakCount, 3);
  assert.equal("weight" in pulse.consistencyLeaders[0], false);
});
