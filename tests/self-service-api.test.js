const assert = require("node:assert/strict");
const test = require("node:test");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.WELLBEING_SESSION_SECRET = "self-service-api-test-secret-at-least-32-chars";

function createMockReply() {
  return {
    statusCode: 0,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("GET /api/employees includes communityPulse and requiresOnboarding when employee has no profile", async () => {
  const { createSession, SESSION_COOKIE_NAME } = await import("../api/_lib/session.js");
  const { default: handler } = await import("../api/employees.js");
  const oid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  const originalFetch = global.fetch;
  const responses = [
    [], // listEmployeesForIdentity (1st attempt)
    [], // unlinkedEmployees in claimEmployeeByIdentity
    [], // listEmployeesForIdentity (after claim attempt)
    [
      {
        id: "emp-1",
        name: "Active Colleague",
        department: "Sales",
        age: 30,
        height: 165,
        months: {
          logs: [
            { id: "1", date: "2026-10-25", weight: 60 },
            { id: "2", date: "2026-11-01", weight: 59.5 },
            { id: "3", date: "2026-11-10", weight: 59.0 },
          ],
        },
      },
    ], // listEmployeesForAdmin
  ];
  global.fetch = async () => new Response(JSON.stringify(responses.shift() ?? []), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  const { token } = createSession({
    oid,
    tid: "55555555-5555-4555-8555-555555555555",
    name: "Brand New Employee",
    roles: [],
  });
  const reply = createMockReply();

  try {
    await handler({ method: "GET", headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` } }, reply);
    assert.equal(reply.statusCode, 200);
    assert.equal(reply.body.requiresIdentityLink, true);
    assert.equal(reply.body.requiresOnboarding, true);
    assert.ok(reply.body.communityPulse);
    assert.equal(reply.body.communityPulse.totalTrackedEmployees, 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test("POST /api/employees allows a signed-in non-admin employee to self-onboard once", async () => {
  const { createSession, SESSION_COOKIE_NAME } = await import("../api/_lib/session.js");
  const { default: handler } = await import("../api/employees.js");
  const oid = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  const originalFetch = global.fetch;
  let postBodySent = null;
  const responses = [
    [], // listEmployeesForIdentity
    [], // unlinkedEmployees
  ];
  global.fetch = async (url, options = {}) => {
    if (options.method === "POST") {
      postBodySent = JSON.parse(options.body);
      return new Response(JSON.stringify([{ id: "new-self", ...postBodySent }]), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(responses.shift() ?? []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const { token, payload } = createSession({
    oid,
    tid: "55555555-5555-4555-8555-555555555555",
    name: "New Self User",
    roles: [],
  });
  const reply = createMockReply();

  try {
    await handler({
      method: "POST",
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
        "x-csrf-token": payload.csrf,
      },
      body: {
        name: "New Self User",
        department: "Marketing",
        age: 27,
        height: 168,
        months: {
          gender: "female",
          logs: [{ id: "l1", date: "2026-11-11", weight: 54.5 }],
        },
      },
    }, reply);

    assert.equal(reply.statusCode, 201);
    assert.equal(postBodySent.entra_oid, oid);
    assert.equal(reply.body.employees[0].id, "new-self");
  } finally {
    global.fetch = originalFetch;
  }
});

test("PATCH /api/employees allows a signed-in employee to update their own record but rejects updating others", async () => {
  const { createSession, SESSION_COOKIE_NAME } = await import("../api/_lib/session.js");
  const { default: handler } = await import("../api/employees.js");
  const oid = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

  const originalFetch = global.fetch;
  let patchBodySent = null;
  global.fetch = async (url, options = {}) => {
    if (options.method === "PATCH") {
      patchBodySent = JSON.parse(options.body);
      return new Response(JSON.stringify([{ id: "emp-own", entra_oid: oid, ...patchBodySent }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify([{
      id: "emp-own",
      name: "Own User",
      department: "IT",
      age: 30,
      height: 172,
      entra_oid: oid,
      months: { gender: "male", logs: [] },
    }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const { token, payload } = createSession({
    oid,
    tid: "55555555-5555-4555-8555-555555555555",
    name: "Own User",
    roles: [],
  });

  try {
    // 1. Updating own record succeeds
    const ownReply = createMockReply();
    await handler({
      method: "PATCH",
      query: { id: "emp-own" },
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
        "x-csrf-token": payload.csrf,
      },
      body: {
        months: {
          gender: "male",
          goals: { targetWeight: 68 },
          logs: [{ id: "l1", date: "2026-11-11", weight: 70.2 }],
        },
      },
    }, ownReply);

    assert.equal(ownReply.statusCode, 200);
    assert.equal(patchBodySent.months.logs.length, 1);

    // 2. Updating someone else's record is forbidden (403)
    const otherReply = createMockReply();
    await handler({
      method: "PATCH",
      query: { id: "emp-other" },
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
        "x-csrf-token": payload.csrf,
      },
      body: {
        months: { gender: "male", logs: [] },
      },
    }, otherReply);

    assert.equal(otherReply.statusCode, 403);
  } finally {
    global.fetch = originalFetch;
  }
});
