function getConfig() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (!url || !serviceKey) throw new Error("Supabase server environment variables are not configured");
  return { url, serviceKey };
}

async function request(path, options = {}) {
  const { url, serviceKey } = getConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(payload?.message || payload?.error || "Supabase request failed");
  return payload;
}

const selectFields = "id,name,department,age,height,months,entra_oid,created_at";

export function listEmployeesForAdmin() {
  return request(`pfig_employees?select=${selectFields}&order=created_at.asc`);
}

export function listEmployeesForIdentity(oid) {
  return request(`pfig_employees?select=${selectFields}&entra_oid=eq.${encodeURIComponent(oid)}&limit=1`);
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
