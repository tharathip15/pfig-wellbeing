import { readJsonBody, sendJson } from "./_lib/http.js";
import { getPersonalHealthRanking } from "./_lib/health-ranking.js";
import { requireAdmin, requireCsrf, requireSession } from "./_lib/session.js";
import { prepareCompanySession } from "../server/pfig-sso/index.mjs";
import {
  claimUnlinkedEmployee,
  deleteEmployee,
  insertEmployee,
  listEmployeesForAdmin,
  listOrClaimEmployeeForIdentity,
  updateEmployee,
} from "./_lib/supabase.js";
import healthTracker from "../health-tracker.js";

const { buildCommunityPulse, normalizeEmployeeTimeline } = healthTracker;

export default async function handler(request, response) {
  if (process.env.PFIG_SSO_ENABLED === "1" && !await prepareCompanySession(request, response)) return;
  const method = String(request.method || "GET").toUpperCase();
  const session = method === "DELETE" ? requireAdmin(request, response) : requireSession(request, response);
  if (!session) return;
  if (method !== "GET" && !requireCsrf(request, response, session)) return;

  try {
    if (method === "GET") {
      const personalEmployees = await listOrClaimEmployeeForIdentity({ oid: session.oid, name: session.name });
      const allEmployees = await listEmployeesForAdmin();
      const rawEmployees = session.canEdit ? allEmployees : personalEmployees;
      const employees = rawEmployees.map(emp => normalizeEmployeeTimeline(emp));
      const personalHealthRanking = personalEmployees.length > 0
        ? getPersonalHealthRanking(allEmployees, personalEmployees[0].id, "auto")
        : null;
      const communityPulse = buildCommunityPulse(allEmployees);
      // Only names/departments of records nobody has claimed yet, so staff can reconnect their old history.
      const unlinkedCandidates = !session.canEdit && personalEmployees.length === 0
        ? allEmployees
            .filter(emp => !emp.entra_oid)
            .map(emp => ({ id: emp.id, name: emp.name, department: emp.department }))
        : [];
      return sendJson(response, 200, {
        unlinkedCandidates,
        ok: true,
        mode: session.canEdit ? "admin" : "personal",
        employees,
        personalHealthRanking,
        communityPulse,
        requiresIdentityLink: personalEmployees.length === 0,
        requiresOnboarding: personalEmployees.length === 0,
      });
    }

    if (method === "POST") {
      const employee = await readJsonBody(request);
      if (!session.canEdit) {
        const existing = await listOrClaimEmployeeForIdentity({ oid: session.oid, name: session.name });
        if (existing.length > 0) {
          return sendJson(response, 409, { ok: false, error: "Profile already exists for this account" });
        }
        const created = await insertEmployee({ ...employee, entra_oid: session.oid });
        return sendJson(response, 201, { ok: true, employees: created.map(emp => normalizeEmployeeTimeline(emp)) });
      }
      const created = await insertEmployee(employee);
      return sendJson(response, 201, { ok: true, employees: created.map(emp => normalizeEmployeeTimeline(emp)) });
    }

    const id = String(request.query?.id || "").trim();
    if (!id) return sendJson(response, 400, { ok: false, error: "Employee id is required" });

    if (method === "PATCH") {
      const employee = await readJsonBody(request);
      if (!session.canEdit && String(request.query?.claim || "") === "1") {
        const personalEmployees = await listOrClaimEmployeeForIdentity({ oid: session.oid, name: session.name });
        if (personalEmployees.length > 0) {
          return sendJson(response, 409, { ok: false, error: "This account is already linked to a profile" });
        }
        const claimed = await claimUnlinkedEmployee(id, session.oid);
        if (claimed.length === 0) {
          return sendJson(response, 409, { ok: false, error: "This record is already linked to another account" });
        }
        console.info("Wellbeing record claimed", { employeeId: id, oid: session.oid });
        return sendJson(response, 200, { ok: true, employees: claimed.map(emp => normalizeEmployeeTimeline(emp)) });
      }
      if (!session.canEdit) {
        const personalEmployees = await listOrClaimEmployeeForIdentity({ oid: session.oid, name: session.name });
        const ownsRecord = personalEmployees.some(emp => String(emp.id) === id);
        if (!ownsRecord) {
          return sendJson(response, 403, { ok: false, error: "You can only update your own health record" });
        }
        const safePayload = { ...employee };
        delete safePayload.entra_oid;
        const updated = await updateEmployee(id, safePayload);
        return sendJson(response, 200, { ok: true, employees: updated.map(emp => normalizeEmployeeTimeline(emp)) });
      }
      const updated = await updateEmployee(id, employee);
      return sendJson(response, 200, { ok: true, employees: updated.map(emp => normalizeEmployeeTimeline(emp)) });
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
