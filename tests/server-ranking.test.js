const assert = require("node:assert/strict");
const test = require("node:test");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

function employee(id, name, months, department = "Sales") {
  return { id, name, department, age: 30, height: 170, months };
}

test("computes a personal health rank against all final measurement participants without returning their records", async () => {
  const { getPersonalHealthRanking } = await import("../api/_lib/health-ranking.js");
  const employees = [
    employee("winner", "Winner", { gender: "female", m1: { weight: 55, bmi: 19.03, bodyage: 30, muscle: 28, fat: 20 }, m4: { weight: 55, bmi: 19.03, bodyage: 30, muscle: 28, fat: 20 } }),
    employee("self", "Signed In Person", { gender: "female", m1: { weight: 70, bmi: 24.22, bodyage: 40, muscle: 20, fat: 35 }, m2: { weight: 65, bodyage: 38 }, m3: { weight: 64, bodyage: 36 }, m4: { weight: 63.5, bmi: 21.97, bodyage: 35, muscle: 20.8, fat: 33 } }),
    employee("waiting", "Waiting", { gender: "male", m1: { weight: 90, bmi: 31.14, bodyage: 45, muscle: 30, fat: 30 }, m2: { weight: 80, bmi: 27.68, bodyage: 40, muscle: 32, fat: 28 }, m3: { weight: 78, bodyage: 39 } }),
    employee("last", "Last", { gender: "male", m1: { weight: 75, bmi: 25.95, bodyage: 40, muscle: 33, fat: 20 }, m4: { weight: 80, bmi: 27.68, bodyage: 42, muscle: 32, fat: 25 } }),
  ];

  const result = getPersonalHealthRanking(employees, "self");

  assert.deepEqual(result, {
    hasRank: true,
    rank: 2,
    totalParticipants: 3,
    totalScore: 60,
  });
  assert.deepEqual(Object.keys(result).sort(), ["hasRank", "rank", "totalParticipants", "totalScore"]);
});

test("returns a non-ranked result for an employee without complete final measurement data", async () => {
  const { getPersonalHealthRanking } = await import("../api/_lib/health-ranking.js");
  const employees = [
    employee("self", "Signed In Person", { gender: "male", m1: { weight: 80, bmi: 27.68, bodyage: 40, muscle: 30, fat: 30 }, m2: { weight: 75, bodyage: 35 }, m3: { weight: 74, bodyage: 34 } }),
  ];
  assert.deepEqual(getPersonalHealthRanking(employees, "self"), {
    hasRank: false,
    rank: null,
    totalParticipants: 0,
    totalScore: null,
  });
});

test("employee API returns only the signed-in row plus its global health ranking", async () => {
  process.env.WELLBEING_SESSION_SECRET = "server-ranking-test-secret-at-least-32-characters";
  const { createSession, SESSION_COOKIE_NAME } = await import("../api/_lib/session.js");
  const { default: handler } = await import("../api/employees.js");
  const oid = "44444444-4444-4444-8444-444444444444";
  const signedIn = employee("self", "Signed In Person", { gender: "female", m1: { weight: 70, bmi: 24.22, bodyage: 40, muscle: 20, fat: 35 }, m4: { weight: 63.5, bmi: 21.97, bodyage: 35, muscle: 20.8, fat: 33 } });
  signedIn.entra_oid = oid;
  const winner = employee("winner", "Winner", { gender: "female", m1: { weight: 55, bmi: 19.03, bodyage: 30, muscle: 28, fat: 20 }, m4: { weight: 55, bmi: 19.03, bodyage: 30, muscle: 28, fat: 20 } });
  const last = employee("last", "Last", { gender: "male", m1: { weight: 75, bmi: 25.95, bodyage: 40, muscle: 33, fat: 20 }, m4: { weight: 80, bmi: 27.68, bodyage: 42, muscle: 32, fat: 25 } });

  const originalFetch = global.fetch;
  const responses = [[signedIn], [winner, signedIn, last]];
  global.fetch = async () => new Response(JSON.stringify(responses.shift()), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  const { token } = createSession({
    oid,
    tid: "55555555-5555-4555-8555-555555555555",
    name: "Signed In Person",
    roles: [],
  });
  const reply = {
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

  try {
    await handler({ method: "GET", headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` } }, reply);
    assert.equal(reply.statusCode, 200);
    assert.deepEqual(reply.body.employees.map(item => item.id), ["self"]);
    assert.deepEqual(reply.body.personalHealthRanking, {
      hasRank: true,
      rank: 2,
      totalParticipants: 3,
      totalScore: 60,
    });
    assert.doesNotMatch(JSON.stringify(reply.body), /Winner|Last/);
  } finally {
    global.fetch = originalFetch;
  }
});
