import { verifyMicrosoftIdToken } from "./_lib/entra.js";
import { readJsonBody, sendJson } from "./_lib/http.js";
import { createSession, sessionCookie } from "./_lib/session.js";

export default async function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, 405, { ok: false, error: "Method not allowed" });

  try {
    const { idToken, nonce } = await readJsonBody(request, 64 * 1024) || {};
    if (!idToken || !nonce) return sendJson(response, 400, { ok: false, error: "idToken and nonce are required" });

    const claims = await verifyMicrosoftIdToken(idToken, nonce);
    const { token, payload } = createSession({
      oid: claims.oid,
      tid: claims.tid,
      name: claims.name,
      email: claims.email || claims.preferred_username || claims.upn,
      roles: claims.roles,
    });
    response.setHeader("Set-Cookie", sessionCookie(token, request));
    return sendJson(response, 200, {
      ok: true,
      identity: {
        oid: payload.oid,
        name: payload.name,
        email: payload.email,
        roles: payload.roles,
        canEdit: payload.canEdit,
      },
      csrfToken: payload.csrf,
    });
  } catch (error) {
    console.error("Wellbeing SSO login failed:", error);
    return sendJson(response, 401, { ok: false, error: "Microsoft identity token validation failed" });
  }
}
