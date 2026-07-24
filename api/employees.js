import { readJsonBody, sendJson } from "./_lib/http.js";
import { requireAdmin, requireCsrf, requireSession } from "./_lib/session.js";
import {
  deleteEmployee,
  insertEmployee,
  listEmployeesForAdmin,
  listEmployeesForIdentity,
  updateEmployee,
} from "./_lib/supabase.js";

export default async function handler(request, response) {
  const method = String(request.method || "GET").toUpperCase();
  const session = method === "GET" ? requireSession(request, response) : requireAdmin(request, response);
  if (!session) return;
  if (method !== "GET" && !requireCsrf(request, response, session)) return;

  try {
    if (method === "GET") {
      const employees = session.canEdit
        ? await listEmployeesForAdmin()
        : await listEmployeesForIdentity(session.oid);
      return sendJson(response, 200, {
        ok: true,
        mode: session.canEdit ? "admin" : "personal",
        employees,
        requiresIdentityLink: !session.canEdit && employees.length === 0,
      });
    }

    if (method === "POST") {
      const employee = await readJsonBody(request);
      return sendJson(response, 201, { ok: true, employees: await insertEmployee(employee) });
    }

    const id = String(request.query?.id || "").trim();
    if (!id) return sendJson(response, 400, { ok: false, error: "Employee id is required" });

    if (method === "PATCH") {
      const employee = await readJsonBody(request);
      return sendJson(response, 200, { ok: true, employees: await updateEmployee(id, employee) });
    }
    if (method === "DELETE") {
      return sendJson(response, 200, { ok: true, employees: await deleteEmployee(id) });
    }
    return sendJson(response, 405, { ok: false, error: "Method not allowed" });
  } catch (error) {
    console.error("Wellbeing employee API failed:", error);
    return sendJson(response, 500, { ok: false, error: "Unable to access employee wellbeing data" });
  }
}
