const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");

function makeElement() {
  const children = [];
  const classSet = new Set();
  const listeners = new Map();
  return {
    style: {},
    dataset: {},
    classList: {
      add: (cls) => classSet.add(cls),
      remove: (cls) => classSet.delete(cls),
      contains: (cls) => classSet.has(cls),
    },
    addEventListener: (evt, fn) => {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(fn);
    },
    trigger: (evt, data = {}) => {
      (listeners.get(evt) || []).forEach(fn => fn(data));
    },
    appendChild: (child) => {
      children.push(child);
      return child;
    },
    removeChild: (child) => {
      const idx = children.indexOf(child);
      if (idx >= 0) children.splice(idx, 1);
      return child;
    },
    children,
    value: "",
    textContent: "",
    _innerHTML: "",
    get innerHTML() {
      if (this._innerHTML) return this._innerHTML;
      if (children.length > 0) {
        return children.map(c => c.innerHTML || c.textContent || "").join("");
      }
      return "";
    },
    set innerHTML(val) {
      this._innerHTML = val;
      children.length = 0;
    },
  };
}

function loadApp() {
  const appPath = path.join(root, "app.js");
  const code = fs.readFileSync(appPath, "utf8");
  const healthScore = require("../health-score.js");
  const healthTracker = require("../health-tracker.js");
  const elementsById = new Map();

  const sandbox = {
    console,
    setTimeout() {},
    clearTimeout() {},
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
    localStorage: {
      getItem() { return null; },
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
      querySelectorAll() { return []; },
      createElement() { return makeElement(); },
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

test("admin monitor: calculateWidgets computes company-wide employee count, total logs, avg weight, and healthy BMI rate", () => {
  const app = loadApp();

  const fixtures = [
    {
      id: "emp-1",
      name: "สมชาย ทดสอบ",
      department: "Logistics",
      age: 32,
      height: 175,
      months: {
        logs: [
          { id: "l1", date: "2026-01-10", weight: 75, bmi: 24.49, bodyage: 34 },
          { id: "l2", date: "2026-02-15", weight: 72, bmi: 23.51, bodyage: 31 },
        ],
      },
    },
    {
      id: "emp-2",
      name: "สมหญิง สมส่วน",
      department: "Finance",
      age: 28,
      height: 160,
      months: {
        logs: [
          { id: "l3", date: "2026-02-01", weight: 52, bmi: 20.31, bodyage: 26 },
        ],
      },
    },
  ];

  vm.runInContext(
    `
      employees = ${JSON.stringify(fixtures)};
      calculateWidgets();
    `,
    app
  );

  const totalEl = app.document.getElementById("stat-total-employees");
  const logsEl = app.document.getElementById("stat-total-logs");
  const weightEl = app.document.getElementById("stat-avg-weight-loss");
  const bmiEl = app.document.getElementById("stat-avg-bmi-loss");

  assert.match(totalEl.textContent, /2 คน/);
  assert.match(logsEl.textContent, /3 ครั้ง/);
  // Avg weight = (72 + 52) / 2 = 62.0 kg
  assert.match(weightEl.textContent, /62\.0 kg/);
  // Normal BMI: emp-2 is 20.31 (1 out of 2 = 50%)
  assert.match(bmiEl.textContent, /50%/);
});

test("admin monitor: renderAdminTrendChart draws SVG trend line for company weight progression", () => {
  const app = loadApp();

  const fixtures = [
    {
      id: "emp-1",
      name: "นาย ก",
      height: 170,
      months: {
        logs: [
          { date: "2026-01-15", weight: 70 },
          { date: "2026-02-15", weight: 68 },
        ],
      },
    },
  ];

  const container = app.document.getElementById("admin-trend-chart-container");

  vm.runInContext(
    `
      employees = ${JSON.stringify(fixtures)};
      renderAdminTrendChart();
    `,
    app
  );

  assert.match(container.innerHTML, /<svg/);
  assert.match(container.innerHTML, /adminTrendGrad/);
  assert.match(container.innerHTML, /70 kg/);
  assert.match(container.innerHTML, /68 kg/);
});

test("admin monitor: renderBmiDistribution categorizes employees into 4 standard BMI tiers", () => {
  const app = loadApp();

  const fixtures = [
    { id: "e1", height: 170, months: { logs: [{ weight: 60, bmi: 20.76 }] } }, // Normal
    { id: "e2", height: 170, months: { logs: [{ weight: 70, bmi: 24.22 }] } }, // Overweight
    { id: "e3", height: 170, months: { logs: [{ weight: 85, bmi: 29.41 }] } }, // Obese
    { id: "e4", height: 170, months: { logs: [{ weight: 45, bmi: 15.57 }] } }, // Underweight
  ];

  const container = app.document.getElementById("admin-bmi-distribution-container");

  vm.runInContext(
    `
      employees = ${JSON.stringify(fixtures)};
      renderBmiDistribution();
    `,
    app
  );

  assert.match(container.innerHTML, /สมส่วน/);
  assert.match(container.innerHTML, /น้ำหนักเกิน/);
  assert.match(container.innerHTML, /ภาวะอ้วน/);
  assert.match(container.innerHTML, /น้ำหนักต่ำกว่าเกณฑ์/);
  assert.match(container.innerHTML, /25%/); // Each is 1 out of 4 = 25%
});

test("admin monitor: renderDepartmentStats summarizes employee count and health metrics by department", () => {
  const app = loadApp();

  const fixtures = [
    { id: "d1", name: "เอก", department: "Sales", height: 170, months: { logs: [{ weight: 70, bmi: 24.2 }] } },
    { id: "d2", name: "โท", department: "Sales", height: 165, months: { logs: [{ weight: 55, bmi: 20.2 }] } },
    { id: "d3", name: "ตรี", department: "IT", height: 180, months: { logs: [{ weight: 72, bmi: 22.2 }] } },
  ];

  const container = app.document.getElementById("admin-department-grid");

  vm.runInContext(
    `
      employees = ${JSON.stringify(fixtures)};
      renderDepartmentStats();
    `,
    app
  );

  assert.match(container.innerHTML, /Sales/);
  assert.match(container.innerHTML, /2 คน/);
  assert.match(container.innerHTML, /IT/);
  assert.match(container.innerHTML, /1 คน/);
});

test("admin monitor: renderTable renders 7 modern columns with avatar, latest weight, progress badge, and quick action buttons", () => {
  const app = loadApp();

  const fixtures = [
    {
      id: "emp-table-1",
      name: "สมเกียรติ สุขสมบูรณ์",
      department: "Logistics",
      age: 35,
      height: 172,
      months: {
        logs: [
          { date: "2026-01-01", weight: 80, bodyage: 40, bmi: 27.04 },
          { date: "2026-02-01", weight: 76, bodyage: 37, bmi: 25.69 },
        ],
      },
    },
  ];

  const tableBody = app.document.getElementById("employee-table-body");
  const appendedRows = [];
  tableBody.appendChild = (child) => {
    appendedRows.push(child);
    return child;
  };

  vm.runInContext(
    `
      employees = ${JSON.stringify(fixtures)};
      pageSize = 'all';
      renderTable(employees);
    `,
    app
  );

  assert.equal(appendedRows.length, 1);
  const rowHtml = appendedRows[0].innerHTML || "";

  // 1. Employee name link & avatar
  assert.match(rowHtml, /td-avatar/);
  assert.match(rowHtml, /openEmployeeTrackerAsAdmin\('emp-table-1'\)/);
  assert.match(rowHtml, /สมเกียรติ สุขสมบูรณ์/);

  // 2. Department & height/age
  assert.match(rowHtml, /badge-dept/);
  assert.match(rowHtml, /Logistics/);
  assert.match(rowHtml, /35 ปี/);

  // 3. Latest measurement
  assert.match(rowHtml, /76 kg/);
  assert.match(rowHtml, /BMI 25\.69/);

  // 4. Progress badge (weight diff: -4kg)
  assert.match(rowHtml, /metric-badge-improved/);
  assert.match(rowHtml, /↓ 4/);

  // 5. Total check-in history
  assert.match(rowHtml, /2 บันทึก/);

  // 6. Action buttons
  assert.match(rowHtml, /btn-icon-tracker/);
  assert.match(rowHtml, /openEmployeeTrackerAsAdmin\('emp-table-1',\s*true\)/);
  assert.match(rowHtml, /บันทึกแทน/);
  assert.match(rowHtml, /btn-icon-view/);
  assert.match(rowHtml, /ดูโปรไฟล์/);
});
