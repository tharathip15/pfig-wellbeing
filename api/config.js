import { sendJson } from "./_lib/http.js";

export default function handler(request, response) {
  if (request.method !== "GET") return sendJson(response, 405, { ok: false, error: "Method not allowed" });
  return sendJson(response, 200, {
    ok: true,
    microsoft: {
      enabled: Boolean(process.env.MICROSOFT_TENANT_ID && process.env.MICROSOFT_CLIENT_ID),
      tenantId: process.env.MICROSOFT_TENANT_ID || "",
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
    },
  });
}
