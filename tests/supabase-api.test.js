const assert = require("node:assert/strict");
const test = require("node:test");

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

test("employee reads recover when the Supabase schema cache is temporarily unavailable", async () => {
  const originalFetch = global.fetch;
  let attempt = 0;
  global.fetch = async () => {
    attempt += 1;
    if (attempt === 1) {
      return new Response(JSON.stringify({
        code: "PGRST205",
        message: "Could not find the table 'public.pfig_employees' in the schema cache",
      }), { status: 404, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify([{ id: "employee-1", name: "Test Person" }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const { listEmployeesForAdmin } = await import("../api/_lib/supabase.js");
    const employees = await listEmployeesForAdmin();
    assert.deepEqual(employees, [{ id: "employee-1", name: "Test Person" }]);
    assert.equal(attempt, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test("employee reads recover from a temporary Supabase network failure", async () => {
  const originalFetch = global.fetch;
  let attempt = 0;
  global.fetch = async () => {
    attempt += 1;
    if (attempt === 1) throw new TypeError("fetch failed");
    return new Response(JSON.stringify([{ id: "employee-2", name: "Another Person" }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const { listEmployeesForAdmin } = await import("../api/_lib/supabase.js");
    const employees = await listEmployeesForAdmin();
    assert.deepEqual(employees, [{ id: "employee-2", name: "Another Person" }]);
    assert.equal(attempt, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test("employee reads recover when Supabase temporarily returns an HTML error page", async () => {
  const originalFetch = global.fetch;
  let attempt = 0;
  global.fetch = async () => {
    attempt += 1;
    if (attempt === 1) {
      return new Response("<!DOCTYPE html><title>Service unavailable</title>", {
        status: 503,
        headers: { "Content-Type": "text/html" },
      });
    }
    return new Response(JSON.stringify([{ id: "employee-3", name: "Recovered Person" }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const { listEmployeesForAdmin } = await import("../api/_lib/supabase.js");
    const employees = await listEmployeesForAdmin();
    assert.deepEqual(employees, [{ id: "employee-3", name: "Recovered Person" }]);
    assert.equal(attempt, 2);
  } finally {
    global.fetch = originalFetch;
  }
});

test("claims one uniquely named unlinked employee for a verified Microsoft identity", async () => {
  const originalFetch = global.fetch;
  let requestNumber = 0;
  global.fetch = async (url, options = {}) => {
    requestNumber += 1;
    if (requestNumber === 1) {
      return new Response(JSON.stringify([
        { id: "employee-4", name: "  SOMCHAI   JAIDEE " },
        { id: "employee-5", name: "Different Person" },
      ]), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    assert.match(String(url), /id=eq\.employee-4/);
    assert.match(String(url), /entra_oid=is\.null/);
    assert.equal(options.method, "PATCH");
    assert.deepEqual(JSON.parse(options.body), {
      entra_oid: "11111111-1111-4111-8111-111111111111",
    });
    return new Response(JSON.stringify([{
      id: "employee-4",
      name: "SOMCHAI JAIDEE",
      entra_oid: "11111111-1111-4111-8111-111111111111",
    }]), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    const { claimEmployeeByIdentity } = await import("../api/_lib/supabase.js");
    const employees = await claimEmployeeByIdentity({
      oid: "11111111-1111-4111-8111-111111111111",
      name: "somchai jaidee",
    });
    assert.equal(employees[0].id, "employee-4");
    assert.equal(employees[0].entra_oid, "11111111-1111-4111-8111-111111111111");
  } finally {
    global.fetch = originalFetch;
  }
});

test("does not claim an employee when the normalized Microsoft name is ambiguous", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify([
    { id: "employee-6", name: "Somsak Dee" },
    { id: "employee-7", name: " SOMSAK  DEE " },
  ]), { status: 200, headers: { "Content-Type": "application/json" } });

  try {
    const { claimEmployeeByIdentity } = await import("../api/_lib/supabase.js");
    const employees = await claimEmployeeByIdentity({
      oid: "22222222-2222-4222-8222-222222222222",
      name: "somsak dee",
    });
    assert.deepEqual(employees, []);
  } finally {
    global.fetch = originalFetch;
  }
});

test("personal employee loading retries by OID after a successful first-login claim", async () => {
  const originalFetch = global.fetch;
  const responses = [
    [],
    [{ id: "employee-8", name: "New User" }],
    [{ id: "employee-8", name: "New User", entra_oid: "33333333-3333-4333-8333-333333333333" }],
    [{ id: "employee-8", name: "New User", entra_oid: "33333333-3333-4333-8333-333333333333" }],
  ];
  global.fetch = async () => new Response(JSON.stringify(responses.shift()), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  try {
    const { listOrClaimEmployeeForIdentity } = await import("../api/_lib/supabase.js");
    const employees = await listOrClaimEmployeeForIdentity({
      oid: "33333333-3333-4333-8333-333333333333",
      name: "new user",
    });
    assert.equal(employees.length, 1);
    assert.equal(employees[0].id, "employee-8");
    assert.equal(responses.length, 0);
  } finally {
    global.fetch = originalFetch;
  }
});
