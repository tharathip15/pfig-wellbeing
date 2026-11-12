const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");

function makeElement() {
  const children = [];
  return {
    style: {},
    value: "",
    className: "",
    dataset: {},
    children,
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false;
      },
    },
    addEventListener() {},
    appendChild(child) {
      children.push(child);
    },
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
      if (this._innerHTML !== undefined && this._innerHTML !== "") {
        return this._innerHTML;
      }
      if (children.length > 0) {
        return children.map(c => c.innerHTML || c.textContent || "").join("");
      }
      return "";
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

test("admin proxy: renderTable renders clickable employee name and 'บันทึกแทน' tracker button", () => {
  const app = loadAppWithTracker();

  const employeesFixture = [
    {
      id: "emp-proxy-1",
      name: "สมชาย รักสุขภาพ",
      department: "Logistics",
      age: 32,
      height: 175,
      months: { m1: { weight: 75, bodyage: 32 } },
    },
  ];

  const tableBody = app.document.getElementById("employee-table-body");
  const appendedRows = [];
  tableBody.appendChild = (child) => {
    appendedRows.push(child);
  };

  vm.runInContext(
    `
      employees = ${JSON.stringify(employeesFixture)};
      pageSize = 'all';
      renderTable(employees);
    `,
    app
  );

  assert.equal(appendedRows.length, 1);
  const rowHtml = appendedRows[0].innerHTML || "";

  // Verify clickable employee name
  assert.match(rowHtml, /openEmployeeTrackerAsAdmin\('emp-proxy-1'\)/);
  assert.match(rowHtml, /td-name-link/);

  // Verify proxy check-in action button
  assert.match(rowHtml, /btn-icon-tracker/);
  assert.match(rowHtml, /openEmployeeTrackerAsAdmin\('emp-proxy-1',\s*true\)/);
  assert.match(rowHtml, /บันทึกแทน/);
});

test("admin proxy: showPersonalProfile renders admin banner with back and record buttons when admin views an employee", () => {
  const app = loadAppWithTracker();

  const targetEmp = {
    id: "emp-proxy-2",
    name: "วิภา มุ่งมั่น",
    department: "Sales",
    age: 29,
    height: 160,
    entra_oid: "22222222-2222-4222-8222-222222222222",
    months: {
      m1: { weight: 60, bodyage: 30 },
    },
  };

  vm.runInContext(
    `
      employees = [${JSON.stringify(targetEmp)}];
      // Admin user signed in with different OID
      wellbeingSession = { identity: { oid: "admin-oid-999", name: "Super Admin", canEdit: true } };
      showPersonalProfile("emp-proxy-2");
    `,
    app
  );

  const profileHtml = app.elementsById.get("personal-profile-display").innerHTML;
  assert.match(profileHtml, /admin-proxy-banner/);
  assert.match(profileHtml, /โหมดผู้ดูแลระบบ/);
  assert.match(profileHtml, /คุณกำลังดูและบันทึกข้อมูลแทน/);
  assert.match(profileHtml, /วิภา มุ่งมั่น/);
  assert.match(profileHtml, /switchToAdminView\(\)/);
  assert.match(profileHtml, /openCheckinModal\(\)/);
});

test("admin proxy: openCheckinModal displays proxy employee name in title and banner note", () => {
  const app = loadAppWithTracker();

  const targetEmp = {
    id: "emp-proxy-3",
    name: "กิตติพงษ์ ฟิตเนส",
    department: "Finance & Acc",
    age: 38,
    height: 172,
    entra_oid: "33333333-3333-4333-8333-333333333333",
    months: {
      m1: { weight: 80, bodyage: 40 },
    },
  };

  vm.runInContext(
    `
      employees = [${JSON.stringify(targetEmp)}];
      currentProfileEmpId = "emp-proxy-3";
      wellbeingSession = { identity: { oid: "admin-oid-999", name: "Admin HR", canEdit: true } };
      openCheckinModal();
    `,
    app
  );

  const titleEl = app.elementsById.get("checkin-modal-title");
  const noteEl = app.elementsById.get("checkin-proxy-note");

  assert.match(titleEl.textContent, /บันทึกข้อมูลร่างกายแทน:\s*กิตติพงษ์ ฟิตเนส/);
  assert.match(noteEl.textContent, /กำลังบันทึกข้อมูลในนามผู้ดูแลให้กับคุณ กิตติพงษ์ ฟิตเนส/);
  assert.equal(noteEl.style.display, "block");
});

test("admin proxy: saveForm preserves existing logs and goals when saving basic employee data", async () => {
  const app = loadAppWithTracker();

  const existingLogs = [
    { id: "log-1", date: "2026-01-10", weight: 70, bmi: 22.8 },
    { id: "log-2", date: "2026-02-10", weight: 68.5, bmi: 22.3 },
  ];
  const existingGoals = { targetWeight: 65, targetFat: 18 };

  const targetEmp = {
    id: "emp-proxy-4",
    name: "ชาตรี ตัวอย่าง",
    department: "Corporate",
    age: 40,
    height: 175,
    months: {
      m1: { weight: 72, bodyage: 41 },
      logs: existingLogs,
      goals: existingGoals,
    },
  };

  let capturedPayload = null;
  app.wellbeingApiRequest = async (path, options = {}) => {
    if (options && options.body) {
      capturedPayload = JSON.parse(options.body);
    }
    return { ok: true, employees: [] };
  };

  // Mock form element values
  app.document.getElementById("form-emp-id").value = "emp-proxy-4";
  app.document.getElementById("form-name").value = "ชาตรี ตัวอย่าง (อัปเดตชื่อ)";
  app.document.getElementById("form-department").value = "Corporate";
  app.document.getElementById("form-entra-oid").value = "";
  app.document.getElementById("form-age").value = "41";
  app.document.getElementById("form-height").value = "175";
  app.document.getElementById("form-m1-weight").value = "72";
  app.document.getElementById("form-m1-bodyage").value = "41";
  app.document.getElementById("form-m1-muscle").value = "";
  app.document.getElementById("form-m1-fat").value = "";
  app.document.getElementById("form-m1-photo-data").value = "";
  app.document.getElementById("form-m2-weight").value = "";
  app.document.getElementById("form-m2-bodyage").value = "";
  app.document.getElementById("form-m2-muscle").value = "";
  app.document.getElementById("form-m2-fat").value = "";
  app.document.getElementById("form-m2-photo-data").value = "";
  app.document.getElementById("form-m3-weight").value = "";
  app.document.getElementById("form-m3-bodyage").value = "";
  app.document.getElementById("form-m3-muscle").value = "";
  app.document.getElementById("form-m3-fat").value = "";
  app.document.getElementById("form-m3-photo-data").value = "";
  app.document.getElementById("form-m4-weight").value = "";
  app.document.getElementById("form-m4-bodyage").value = "";
  app.document.getElementById("form-m4-muscle").value = "";
  app.document.getElementById("form-m4-fat").value = "";
  app.document.getElementById("form-m4-photo-data").value = "";

  await vm.runInContext(
    `
      employees = [${JSON.stringify(targetEmp)}];
      modalMode = 'edit';
      saveForm();
    `,
    app
  );

  assert.ok(capturedPayload, "saveForm should have sent a payload");
  assert.equal(capturedPayload.name, "ชาตรี ตัวอย่าง (อัปเดตชื่อ)");
  assert.equal(capturedPayload.age, 41);
  // Logs and goals must not be lost!
  assert.deepEqual(capturedPayload.months.logs, existingLogs);
  assert.deepEqual(capturedPayload.months.goals, existingGoals);
});

test("admin proxy: openEmployeeTrackerAsAdmin switches view and populates quick-select dropdown", () => {
  const app = loadAppWithTracker();

  const emps = [
    { id: "e1", name: "กมล สุขภาพดี", department: "IT", age: 30, height: 170, months: { m1: { weight: 65, bodyage: 28 } } },
    { id: "e2", name: "จิราพร วิ่งไว", department: "HR", age: 26, height: 158, months: { m1: { weight: 52, bodyage: 24 } } }
  ];

  let checkinModalOpened = false;
  app.window.openCheckinModal = () => {
    checkinModalOpened = true;
  };

  // Replace setTimeout to immediately execute
  app.window.setTimeout = (fn) => {
    fn();
    return 1;
  };

  vm.runInContext(
    `
      employees = ${JSON.stringify(emps)};
      wellbeingSession = { identity: { oid: "admin-master", name: "Admin Master", canEdit: true } };
      openEmployeeTrackerAsAdmin("e2", true);
    `,
    app
  );

  const currentViewVal = vm.runInContext("currentView", app);
  const currentProfileEmpIdVal = vm.runInContext("currentProfileEmpId", app);
  assert.equal(currentViewVal, "personal");
  assert.equal(currentProfileEmpIdVal, "e2");
  assert.equal(checkinModalOpened, true);

  const quickSelect = app.document.getElementById("personal-admin-quick-select");
  assert.match(quickSelect.innerHTML, /จิราพร วิ่งไว/);
  assert.match(quickSelect.innerHTML, /กมล สุขภาพดี/);
});

test("admin switcher button and search card are hidden for non-admin employees and visible for admins", () => {
  const app = loadAppWithTracker();
  const emps = [
    {
      id: "user-1",
      name: "สมชาย รักสุขภาพ",
      department: "Sales",
      age: 30,
      height: 172,
      months: { m1: { weight: 68, bodyage: 30 } },
    },
  ];

  // Case 1: Non-admin session
  vm.runInContext(
    `
      employees = ${JSON.stringify(emps)};
      wellbeingSession = { identity: { oid: "user-1", name: "สมชาย รักสุขภาพ", canEdit: false } };
      switchToPersonalView();
    `,
    app
  );

  const toggleBtn = app.document.getElementById("btn-toggle-view");
  const searchCard = app.document.getElementById("personal-search-card");
  assert.equal(toggleBtn.style.display, "none", "Admin toggle button must be hidden for non-admin");
  assert.equal(searchCard.style.display, "none", "Employee search card must be hidden for non-admin");

  // Case 2: Admin session
  vm.runInContext(
    `
      wellbeingSession = { identity: { oid: "admin-oid", name: "Admin", canEdit: true } };
      switchToPersonalView();
    `,
    app
  );

  assert.equal(toggleBtn.style.display, "inline-flex", "Admin toggle button must be visible for admin");
  assert.equal(searchCard.style.display, "block", "Employee search card must be visible for admin");
});





