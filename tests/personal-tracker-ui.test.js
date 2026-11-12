const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");

function makeElement() {
  return {
    style: {},
    value: "",
    className: "",
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      },
    },
    addEventListener() {},
    appendChild() {},
    remove() {},
    querySelector() {
      return makeElement();
    },
    querySelectorAll() {
      return [];
    },
    set textContent(value) {
      this._textContent = value;
    },
    get textContent() {
      return this._textContent || "";
    },
    set innerHTML(value) {
      this._innerHTML = value;
    },
    get innerHTML() {
      return this._innerHTML || "";
    },
  };
}

function loadAppWithTracker() {
  const appPath = path.join(root, "app.js");
  const code = fs.readFileSync(appPath, "utf8");
  const healthScore = require("../health-score.js");
  const healthTracker = require("../health-tracker.js");
  const elementsById = new Map();

  const sandbox = {
    console,
    setTimeout() {},
    clearTimeout() {},
    requestAnimationFrame() {
      return 1;
    },
    cancelAnimationFrame() {},
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
    },
    document: {
      body: makeElement(),
      addEventListener() {},
      getElementById(id) {
        if (!elementsById.has(id)) {
          elementsById.set(id, makeElement());
        }
        return elementsById.get(id);
      },
      querySelectorAll() {
        return [];
      },
      createElement() {
        return makeElement();
      },
    },
    window: {},
    PfigHealthScore: healthScore,
    PfigHealthTracker: healthTracker,
    elementsById,
  };
  sandbox.window = sandbox;
  sandbox.window.PfigHealthScore = healthScore;
  sandbox.window.PfigHealthTracker = healthTracker;

  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: appPath });
  return sandbox;
}

test("index.html includes health-tracker.js and new check-in, goal, onboarding, and celebration modals without duplicate IDs", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(html, /<script src="health-tracker\.js"><\/script>/);

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual(duplicates, []);

  for (const requiredId of [
    "checkin-modal",
    "checkin-form",
    "checkin-date",
    "checkin-weight",
    "checkin-bodyage",
    "checkin-muscle",
    "checkin-fat",
    "checkin-visceral-fat",
    "checkin-note",
    "goal-modal",
    "goal-form",
    "goal-target-weight",
    "goal-target-fat",
    "goal-target-muscle",
    "goal-target-bodyage",
    "celebration-modal",
  ]) {
    assert.equal(ids.includes(requiredId), true, `Missing #${requiredId} in index.html`);
  }
});

test("showPersonalProfile renders converted m1..m4 history timeline, trend chart, personal goals, badges, and community pulse", () => {
  const app = loadAppWithTracker();

  const employeeFixture = {
    id: "emp-fun-1",
    name: "Somchai Fit",
    department: "Sales",
    age: 35,
    height: 170,
    entra_oid: "11111111-1111-4111-8111-111111111111",
    months: {
      gender: "male",
      goals: {
        targetWeight: 70,
        targetFat: 20,
      },
      m1: { weight: 78, bodyage: 40, muscle: 31, fat: 26 },
      m2: { weight: 76, bodyage: 38, muscle: 32, fat: 24.5 },
      m3: { weight: 74, bodyage: 36, muscle: 33, fat: 23 },
      m4: { weight: 72, bodyage: 34, muscle: 33.8, fat: 21.5 },
    },
  };

  vm.runInContext(
    `
      employees = [${JSON.stringify(employeeFixture)}];
      wellbeingSession = { identity: { oid: "11111111-1111-4111-8111-111111111111", name: "Somchai Fit", canEdit: false } };
      wellbeingCommunityPulse = {
        totalTrackedEmployees: 18,
        activeThisMonth: 12,
        activeThisWeek: 7,
        totalLogsCompanyWide: 64,
        totalUnlockedBadges: 42,
        consistencyLeaders: [
          { id: "emp-fun-1", name: "Somchai Fit", department: "Sales", streakCount: 4, totalLogs: 4, unlockedBadges: 6 }
        ]
      };
      showPersonalProfile("emp-fun-1");
    `,
    app
  );

  const profileHtml = app.elementsById.get("personal-profile-display").innerHTML;

  // Quick check-in and goal triggers
  assert.match(profileHtml, /openCheckinModal\(\)/);
  assert.match(profileHtml, /openGoalModal\(\)/);

  // Streak & Badges section
  assert.match(profileHtml, /tracker-badges-grid/);
  assert.match(profileHtml, /ก้าวแรกเพื่อตัวเอง/);
  assert.match(profileHtml, /โกงอายุสำเร็จ/);

  // Interactive SVG Trend Chart
  assert.match(profileHtml, /tracker-trend-card/);
  assert.match(profileHtml, /<svg/);

  // Personal Goals section
  assert.match(profileHtml, /tracker-goals-card/);
  assert.match(profileHtml, /เป้าหมายน้ำหนัก/);

  // Community Pulse section
  assert.match(profileHtml, /tracker-community-card/);
  assert.match(profileHtml, /บอร์ดชุมชนคนรักสุขภาพ/);

  // Timeline History with converted m1..m4 entries
  assert.match(profileHtml, /tracker-timeline-list/);
  assert.match(profileHtml, /บันทึกเริ่มต้น #1/);
  assert.match(profileHtml, /บันทึกเริ่มต้น #4/);
});

test("renderSelfOnboardingCard renders self-registration form for new signed-in employees", () => {
  const app = loadAppWithTracker();
  assert.equal(typeof app.renderSelfOnboardingCard, "function");

  vm.runInContext(
    `
      wellbeingSession = { identity: { oid: "99999999-9999-4999-8999-999999999999", name: "Newcomer PFIG", canEdit: false } };
      renderSelfOnboardingCard();
    `,
    app
  );

  const html = app.elementsById.get("personal-profile-display").innerHTML;
  assert.match(html, /สร้างสมุดบันทึกสุขภาพส่วนตัวของคุณ/);
  assert.match(html, /Newcomer PFIG/);
  assert.match(html, /onboarding-form/);
});
