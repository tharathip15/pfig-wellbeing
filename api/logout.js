import { sendJson } from "./_lib/http.js";
import { expiredSessionCookie } from "./_lib/session.js";

export default function handler(request, response) {
  if (request.method !== "POST") return sendJson(response, 405, { ok: false, error: "Method not allowed" });
  response.setHeader("Set-Cookie", expiredSessionCookie(request));
  return sendJson(response, 200, { ok: true });
}
