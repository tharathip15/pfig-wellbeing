function getConfig() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!url || !serviceKey) throw new Error("Supabase server environment variables are not configured");
  return { url, serviceKey };
}

async function request(path, options = {}) {
  const { url, serviceKey } = getConfig();
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    let response;
    try {
      response = await fetch(`${url}/rest/v1/${path}`, {
        ...options,
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: options.prefer || "return=representation",
          ...(options.headers || {}),
        },
      });
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 200 * attempt));
      continue;
    }
    const text = await response.text();
    let payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
    if (response.ok) return payload;

    const schemaCacheUnavailable = payload?.code === "PGRST205" || /schema cache/i.test(payload?.message || "");
    const temporaryUpstreamFailure = response.status >= 500;
    if ((schemaCacheUnavailable || temporaryUpstreamFailure) && attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, 200 * attempt));
      continue;
    }
    throw new Error(payload?.message || payload?.error || `Supabase request failed (${response.status})`);
  }
}

const selectFields = "id,name,department,age,height,months,entra_oid,created_at";

export function listEmployeesForAdmin() {
  return request(`pfig_employees?select=${selectFields}&order=created_at.asc`);
}

export function listEmployeesForIdentity(oid) {
  return request(`pfig_employees?select=${selectFields}&entra_oid=eq.${encodeURIComponent(oid)}&limit=1`);
}

function normalizeIdentityName(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export async function claimEmployeeByIdentity({ oid, name }) {
  const normalizedOid = optionalUuid(oid);
  const normalizedName = normalizeIdentityName(name);
  if (!normalizedName) return [];

  const unlinkedEmployees = await request("pfig_employees?select=id,name&entra_oid=is.null");
  const matches = unlinkedEmployees.filter(employee => normalizeIdentityName(employee.name) === normalizedName);
  if (matches.length !== 1) return [];

  return request(
    `pfig_employees?id=eq.${encodeURIComponent(matches[0].id)}&entra_oid=is.null&select=${selectFields}`,
    { method: "PATCH", body: JSON.stringify({ entra_oid: normalizedOid }) },
  );
}

export async function listOrClaimEmployeeForIdentity(identity) {
  let employees = await listEmployeesForIdentity(identity.oid);
  if (employees.length > 0) return employees;

  await claimEmployeeByIdentity(identity);
  employees = await listEmployeesForIdentity(identity.oid);
  return employees;
}

function optionalUuid(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).trim().toLowerCase();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized)) {
    throw new Error("entra_oid must be a valid Microsoft object id");
  }
  return normalized;
}

export function sanitizeEmployee(input, { partial = false } = {}) {
  const source = input && typeof input === "object" ? input : {};
  const result = {};
  const assign = (key, value) => {
    if (!partial || value !== undefined) result[key] = value;
  };

  assign("name", source.name === undefined ? undefined : String(source.name).trim().slice(0, 200));
  assign("department", source.department === undefined ? undefined : String(source.department).trim().slice(0, 200));
  assign("age", source.age === undefined ? undefined : Number(source.age));
  assign("height", source.height === undefined ? undefined : Number(source.height));
  assign("months", source.months === undefined ? undefined : source.months);
  assign("entra_oid", source.entra_oid === undefined ? undefined : optionalUuid(source.entra_oid));

  if (!partial && (!result.name || !result.department || !Number.isFinite(result.age) || !Number.isFinite(result.height))) {
    throw new Error("Employee name, department, age and height are required");
  }
  if (result.months !== undefined && (!result.months || typeof result.months !== "object" || Array.isArray(result.months))) {
    throw new Error("Employee months must be an object");
  }
  return result;
}

export function insertEmployee(employee) {
  return request("pfig_employees", { method: "POST", body: JSON.stringify(sanitizeEmployee(employee)) });
}

export function updateEmployee(id, employee) {
  return request(`pfig_employees?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(sanitizeEmployee(employee, { partial: true })),
  });
}

export function deleteEmployee(id) {
  return request(`pfig_employees?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
}
