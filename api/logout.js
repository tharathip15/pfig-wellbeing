import { sendJson } from "./_lib/http.js";
import {prepareCompanySession} from '../server/pfig-sso/index.mjs';
import { expiredSessionCookie } from "./_lib/session.js";

export default async function handler(request, response) {
  if(process.env.PFIG_SSO_ENABLED==='1'&&!await prepareCompanySession(request,response))return;
  if (request.method !== "POST") return sendJson(response, 405, { ok: false, error: "Method not allowed" });
  response.setHeader("Set-Cookie", expiredSessionCookie(request));
  return sendJson(response, 200, { ok: true });
}
