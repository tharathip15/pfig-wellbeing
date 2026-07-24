import { sendJson } from "./_lib/http.js";
import { getSession } from "./_lib/session.js";

export default function handler(request, response) {
  if (request.method !== "GET") return sendJson(response, 405, { ok: false, error: "Method not allowed" });
  const session = getSession(request);
  if (!session) return sendJson(response, 401, { ok: false, error: "Microsoft sign-in is required" });
  return sendJson(response, 200, {
    ok: true,
    identity: {
      oid: session.oid,
      name: session.name,
      email: session.email,
      roles: session.roles,
      canEdit: session.canEdit,
    },
    csrfToken: session.csrf,
  });
}
