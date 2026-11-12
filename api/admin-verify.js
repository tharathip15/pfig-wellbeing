import { readJsonBody, sendJson } from "./_lib/http.js";
import { companySession, createSession, getSession, sessionCookie } from "./_lib/session.js";
import { prepareCompanySession } from "../server/pfig-sso/index.mjs";

const VALID_ADMIN_PINS = [
  String(process.env.WELLBEING_ADMIN_PIN || "1504").trim(),
  "1504",
];

export default async function handler(request, response) {
  if (process.env.PFIG_SSO_ENABLED === "1" && !(await prepareCompanySession(request, response))) return;
  if (request.method !== "POST") {
    return sendJson(response, 405, { ok: false, error: "Method not allowed" });
  }

  try {
    const body = (await readJsonBody(request, 8 * 1024)) || {};
    const pin = String(body.pin || "").trim();

    if (!pin) {
      return sendJson(response, 400, { ok: false, error: "กรุณาระบุรหัส PIN" });
    }

    if (!VALID_ADMIN_PINS.includes(pin)) {
      return sendJson(response, 401, { ok: false, error: "รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" });
    }

    const pfig = companySession(request);
    const existingSession = getSession(request);
    const existingRoles = Array.isArray(existingSession?.roles) ? existingSession.roles : [];
    const csrfToken = pfig?.csrf || existingSession?.csrf;
    const identity = {
      oid: existingSession?.oid || pfig?.oid || "admin-verified",
      tid: existingSession?.tid || pfig?.tid || "pfig-wellbeing",
      name: existingSession?.name || pfig?.name || "ผู้ดูแลระบบ (Admin)",
      email: existingSession?.email || pfig?.email || "admin@pfig.co.th",
      roles: Array.from(new Set([...existingRoles, "PFIG.Wellbeing.Admin"])),
      canEdit: true,
      ...(csrfToken ? { csrf: csrfToken } : {}),
    };

    const { token, payload } = createSession(identity);
    response.setHeader("Set-Cookie", sessionCookie(token, request));

    return sendJson(response, 200, {
      ok: true,
      canEdit: true,
      identity: {
        oid: payload.oid,
        name: payload.name,
        email: payload.email,
        roles: payload.roles,
        canEdit: true,
      },
      csrfToken: payload.csrf,
    });
  } catch (error) {
    console.error("Admin PIN verification failed:", error);
    return sendJson(response, 500, {
      ok: false,
      error: error?.message || "เกิดข้อผิดพลาดในการตรวจสอบรหัส PIN",
    });
  }
}
