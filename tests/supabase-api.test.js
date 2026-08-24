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
