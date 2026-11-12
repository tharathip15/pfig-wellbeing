const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = readFileSync(path.join(__dirname, "..", "auth.js"), "utf8");

async function start(config, session = null, search = "") {
  const origin = "https://pfig-wellbeing.vercel.app";
  const redirects = [];
  const storage = new Map();
  const button = { disabled: true, addEventListener: (_, callback) => { button.click = callback; } };
  const error = { style: {} };
  const document = {
    getElementById: id => ({ "btn-auth-login": button, "auth-gate-error": error })[id],
    body: { classList: { add() {}, remove() {} } },
  };
  const window = {
    location: { origin, pathname: "/", search, href: origin + "/" + search, assign: url => redirects.push(url) },
    history: { replaceState() {} },
    crypto: webcrypto,
  };
  const fetch = async url => {
    if (url === "/api/config") return { ok: true, json: async () => config };
    assert.equal(url, "/api/session");
    return { ok: Boolean(session), json: async () => session };
  };
  vm.runInNewContext(source, {
    window, document, fetch, URL, URLSearchParams, TextEncoder, btoa,
    sessionStorage: { setItem: (key, value) => storage.set(key, value) },
  });
  const activeSession = await window.PfigWellbeingAuth.initialize();
  return { button, error, redirects, storage, activeSession };
}

test("sign-in prefers the same-origin PFIG SSO route without Microsoft configuration", async () => {
  const { button, redirects } = await start({ pfigSso: { enabled: true }, microsoft: { enabled: false } });
  assert.equal(button.disabled, false);
  assert.match(button.textContent, /PFIG Portal/);
  await button.click();
  assert.deepEqual(redirects, ["/api/pfig-sso?action=start"]);
});

test("the original Microsoft-only flow still sends a PKCE challenge", async () => {
  const { button, redirects, storage } = await start({ microsoft: { enabled: true, tenantId: "tenant", clientId: "client" } });
  await button.click();
  const url = new URL(redirects[0]);
  assert.equal(url.origin, "https://login.microsoftonline.com");
  assert.equal(url.searchParams.get("client_id"), "client");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(storage.size, 1);
});

test("an already signed-in Portal user is not sent through sign-in again", async () => {
  const session = { identity: { oid: "employee" } };
  const { activeSession, redirects } = await start({ pfigSso: { enabled: true } }, session, "?pfig_sso=1");
  assert.equal(activeSession, session);
  assert.deepEqual(redirects, []);
});

test("missing sign-in configuration disables the button and reports the problem", async () => {
  const { button, error, redirects } = await start({}, null, "?pfig_sso=1");
  assert.equal(button.disabled, true);
  assert.equal(error.style.display, "block");
  assert.deepEqual(redirects, []);
});
