const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

process.env.WELLBEING_SESSION_SECRET = "test-only-session-secret-that-is-at-least-32-characters";
const sessionModulePromise = import("../api/_lib/session.js");

test("signed wellbeing sessions preserve oid and admin roles", async () => {
  const sessionModule = await sessionModulePromise;
  const { token, payload } = sessionModule.createSession({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: "22222222-2222-4222-8222-222222222222",
    name: "PFIG Admin",
    email: "admin@example.test",
    roles: ["PFIG.Wellbeing.Admin"],
  });
  const parsed = sessionModule.parseSessionToken(token);
  assert.equal(parsed.oid, payload.oid);
  assert.equal(parsed.canEdit, true);
  assert.equal(parsed.email, "admin@example.test");
});

test("configured admin emails grant edit access case-insensitively", async () => {
  const sessionModule = await sessionModulePromise;
  const previousAdminEmails = process.env.WELLBEING_ADMIN_EMAILS;
  process.env.WELLBEING_ADMIN_EMAILS = "first.admin@pfig.co.th, kulthara.w@pfig.co.th";

  try {
    const { payload } = sessionModule.createSession({
      oid: "33333333-3333-4333-8333-333333333333",
      tid: "22222222-2222-4222-8222-222222222222",
      name: "Kulthara",
      email: "Kulthara.W@PFIG.CO.TH",
      roles: [],
    });

    assert.equal(payload.canEdit, true);
  } finally {
    if (previousAdminEmails === undefined) delete process.env.WELLBEING_ADMIN_EMAILS;
    else process.env.WELLBEING_ADMIN_EMAILS = previousAdminEmails;
  }
});

test("unlisted emails without an admin role remain read-only", async () => {
  const sessionModule = await sessionModulePromise;
  const previousAdminEmails = process.env.WELLBEING_ADMIN_EMAILS;
  process.env.WELLBEING_ADMIN_EMAILS = "kulthara.w@pfig.co.th";

  try {
    const { payload } = sessionModule.createSession({
      oid: "44444444-4444-4444-8444-444444444444",
      tid: "22222222-2222-4222-8222-222222222222",
      name: "Employee",
      email: "employee@pfig.co.th",
      roles: [],
    });

    assert.equal(payload.canEdit, false);
  } finally {
    if (previousAdminEmails === undefined) delete process.env.WELLBEING_ADMIN_EMAILS;
    else process.env.WELLBEING_ADMIN_EMAILS = previousAdminEmails;
  }
});

test("tampered wellbeing sessions are rejected", async () => {
  const sessionModule = await sessionModulePromise;
  const { token } = sessionModule.createSession({
    oid: "11111111-1111-4111-8111-111111111111",
    tid: "22222222-2222-4222-8222-222222222222",
    roles: [],
  });
  assert.equal(sessionModule.parseSessionToken(`${token}x`), null);
});

test("employee API requires a session, auto-links personal reads, and protects writes", () => {
  const source = readFileSync(path.join(__dirname, "..", "api", "employees.js"), "utf8");
  assert.match(source, /requireSession\(request, response\)/);
  assert.match(source, /requireAdmin\(request, response\)/);
  assert.match(source, /requireCsrf\(request, response, session\)/);
  assert.match(source, /listOrClaimEmployeeForIdentity\(\{ oid: session\.oid, name: session\.name \}\)/);
});

test("database cutover removes direct anonymous table access", () => {
  const source = readFileSync(path.join(__dirname, "..", "supabase", "migrations", "202607220001_entra_identity_cutover.sql"), "utf8");
  assert.match(source, /add column if not exists entra_oid uuid/i);
  assert.match(source, /revoke all on table public\.pfig_employees from anon, authenticated/i);
  assert.doesNotMatch(source, /grant .* to anon/i);
});

test("browser code no longer embeds a Supabase key or a PIN constant", () => {
  const appSource = readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const authSource = readFileSync(path.join(__dirname, "..", "auth.js"), "utf8");
  assert.doesNotMatch(appSource, /const\s+SUPABASE_ANON_KEY/);
  assert.doesNotMatch(appSource, /const\s+ADMIN_PIN/);
  assert.match(appSource, /wellbeingApiRequest\('\/api\/employees'/);
  assert.match(authSource, /prompt: "none", silent: true/);
  assert.match(authSource, /\/api\/login-sso/);
});

test("GitHub Pages redirects to the Vercel app before SSO initialization", () => {
  const indexSource = readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const redirectPosition = indexSource.indexOf('location.hostname === "tharathip15.github.io"');
  const authPosition = indexSource.indexOf('<script src="auth.js"></script>');

  assert.notEqual(redirectPosition, -1);
  assert.match(indexSource, /location\.replace\("https:\/\/pfig-wellbeing\.vercel\.app\/"\)/);
  assert.ok(redirectPosition < authPosition);
});

test("admin-verify API rejects invalid PIN and accepts valid PIN with session elevation", async () => {
  const adminVerifyModule = await import("../api/admin-verify.js");
  const handler = adminVerifyModule.default;

  // Test 1: Reject invalid PIN
  let resStatus = null;
  let resJson = null;
  const mockReqWrong = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { pin: "9999" },
  };
  const mockResWrong = {
    status(code) {
      resStatus = code;
      return this;
    },
    json(data) {
      resJson = data;
      return this;
    },
    setHeader() {},
  };
  await handler(mockReqWrong, mockResWrong);
  assert.equal(resStatus, 401);
  assert.equal(resJson.ok, false);

  // Test 2: Accept PIN 1504 and issue admin session
  let setCookieHeader = null;
  const mockReqValid = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { pin: "1504" },
  };
  const mockResValid = {
    status(code) {
      resStatus = code;
      return this;
    },
    json(data) {
      resJson = data;
      return this;
    },
    setHeader(key, val) {
      if (key === "Set-Cookie") setCookieHeader = val;
    },
  };
  await handler(mockReqValid, mockResValid);
  assert.equal(resStatus, 200);
  assert.equal(resJson.ok, true);
  assert.equal(resJson.canEdit, true);
  assert.equal(resJson.identity.canEdit, true);
  assert.ok(setCookieHeader, "Must set session cookie");
  assert.match(setCookieHeader, /pfig_wellbeing_session=/);
});
