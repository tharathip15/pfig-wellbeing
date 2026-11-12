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

test("forms use aligned controls and concise Thai labels without emoji clutter", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  const app = loadAppWithTracker();

  // Check CSS form alignment rules prevent uneven input boxes when labels vary in length
  assert.match(css, /\.form-control\s*\{[^}]*min-height:\s*42px/m);
  assert.match(css, /\.form-control\s*\{[^}]*width:\s*100%/m);
  assert.match(css, /\.checkin-optional-section/);

  // Check-in modal optional body metrics should not use narrow 4-col .month-record-grid
  const checkinModalMatch = html.match(/id="checkin-modal"[\s\S]*?<\/form>/);
  assert.ok(checkinModalMatch, "checkin-modal form should exist");
  assert.doesNotMatch(checkinModalMatch[0], /class="month-record-grid"/);

  // Form labels in check-in and onboarding forms should not start with decorative emojis
  const labelMatches = [...checkinModalMatch[0].matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g)].map(m => m[1].trim());
  assert.ok(labelMatches.length >= 8);
  for (const labelText of labelMatches) {
    assert.doesNotMatch(labelText, /^[📅⚖️📊🏷️🧬💪📉🫀💬📸🎯📏🎂👤🏢⚧️]/u, `Label "${labelText}" should not start with an emoji`);
  }

  vm.runInContext(`renderSelfOnboardingCard();`, app);
  const onboardHtml = app.elementsById.get("personal-profile-display").innerHTML;
  const onboardLabels = [...onboardHtml.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/g)].map(m => m[1].trim());
  assert.ok(onboardLabels.length >= 6);
  for (const labelText of onboardLabels) {
    assert.doesNotMatch(labelText, /^[📅⚖️📊🏷️🧬💪📉🫀💬📸🎯📏🎂👤🏢⚧️]/u, `Onboarding label "${labelText}" should not start with an emoji`);
  }
});

test("renderSelfOnboardingCard displays unlinked candidates box when unlinked records exist", () => {
  const app = loadAppWithTracker();

  vm.runInContext(
    `
      wellbeingSession = { identity: { oid: "88888888-8888-4888-8888-888888888888", name: "Somchai SSO", canEdit: false } };
      wellbeingUnlinkedCandidates = [
        { id: "old-10", name: "สมชาย ใจดี", department: "Sales" },
        { id: "old-11", name: "สมชาย รักสงบ", department: "IT" }
      ];
      renderSelfOnboardingCard();
    `,
    app
  );

  const html = app.elementsById.get("personal-profile-display").innerHTML;
  assert.match(html, /tracker-claim-box/);
  assert.match(html, /เคยมีข้อมูลในระบบเดิมแล้วใช่ไหม/);
  assert.match(html, /claim-employee-select/);
  assert.match(html, /สมชาย ใจดี \(Sales\)/);
  assert.match(html, /สมชาย รักสงบ \(IT\)/);
  assert.match(html, /handleClaimExistingRecord/);
});

test("showPersonalProfile renders mobile sticky action bar and collapsible details", () => {
  const app = loadAppWithTracker();

  const employeeFixture = {
    id: "emp-mobile-1",
    name: "Araya Mobile",
    department: "Finance",
    age: 28,
    height: 165,
    entra_oid: "77777777-7777-4777-8777-777777777777",
    months: {
      gender: "female",
      m1: { weight: 55, bodyage: 26 },
    },
  };

  vm.runInContext(
    `
      employees = [${JSON.stringify(employeeFixture)}];
      wellbeingSession = { identity: { oid: "77777777-7777-4777-8777-777777777777", name: "Araya Mobile", canEdit: false } };
      showPersonalProfile("emp-mobile-1");
    `,
    app
  );

  const profileHtml = app.elementsById.get("personal-profile-display").innerHTML;
  assert.match(profileHtml, /tracker-mobile-bar/);
  assert.match(profileHtml, /collapsible-card/);
});


