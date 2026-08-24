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
  assert.match(source, /method === "GET" \? requireSession/);
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
