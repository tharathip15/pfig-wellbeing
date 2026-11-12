import crypto from "node:crypto";
import {companySession} from '../../server/pfig-sso/native.mjs';
export {companySession};

export const SESSION_COOKIE_NAME = "pfig_wellbeing_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSessionSecret() {
  const secret = String(
    process.env.WELLBEING_SESSION_SECRET ||
    process.env.PFIG_SSO_CLIENT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "pfig-wellbeing-default-secure-session-key-fallback-32chars"
  );
  if (secret.length < 32) throw new Error("WELLBEING_SESSION_SECRET must contain at least 32 characters");
  return secret;
}

export function sign(value) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function configuredAdminRoles() {
  return String(process.env.WELLBEING_ADMIN_ROLES || "PFIG.Wellbeing.Admin,PFIG.Portal.Admin")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
}

function configuredAdminEmails() {
  if (typeof process.env.WELLBEING_ADMIN_EMAILS === "string") {
    return process.env.WELLBEING_ADMIN_EMAILS
      .split(",")
      .map(value => value.trim().toLowerCase())
      .filter(Boolean);
  }
  return [
    "kulthara.w@pfig.co.th",
    "induthaitharathip@gmail.com",
    "tharathip15@gmail.com",
    "admin@pfig.co.th",
  ];
}

export function hasAdminRole(roles) {
  const allowed = new Set(configuredAdminRoles());
  return (Array.isArray(roles) ? roles : []).some(role => allowed.has(String(role).trim().toLowerCase()));
}

export function hasAdminEmail(email) {
  return new Set(configuredAdminEmails()).has(String(email || "").trim().toLowerCase());
}

export function createSession(identity) {
  const now = Math.floor(Date.now() / 1000);
  const roles = Array.isArray(identity.roles) ? identity.roles.map(String) : [];
  const email = String(identity.email || "");
  const payload = {
    oid: String(identity.oid || ""),
    tid: String(identity.tid || ""),
    name: String(identity.name || "Microsoft User"),
    email,
    roles,
    canEdit: Boolean(identity.canEdit) || hasAdminRole(roles) || hasAdminEmail(email),
    csrf: identity.csrf || crypto.randomBytes(24).toString("base64url"),
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  if (!payload.oid || !payload.tid) throw new Error("Session identity is incomplete");

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${encoded}.${sign(encoded)}`, payload };
}

export function parseSessionToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2 || !safeEqual(parts[1], sign(parts[0]))) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.oid || !payload.tid || !Number.isFinite(payload.exp) || payload.exp <= now) return null;
    if (!Number.isFinite(payload.iat) || payload.iat > now + 60) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(request) {
  return String(request.headers?.cookie || "")
    .split(";")
    .map(value => value.trim())
    .filter(Boolean)
    .reduce((cookies, entry) => {
      const separator = entry.indexOf("=");
      if (separator > 0) cookies[entry.slice(0, separator)] = decodeURIComponent(entry.slice(separator + 1));
      return cookies;
    }, {});
}

export function getSession(request) {
  const cookieSession = parseSessionToken(parseCookies(request)[SESSION_COOKIE_NAME]);
  const pfig = companySession(request);
  if (cookieSession && cookieSession.canEdit) {
    if (pfig) {
      return {
        ...cookieSession,
        oid: pfig.oid || cookieSession.oid,
        name: pfig.name || cookieSession.name,
        email: pfig.email || cookieSession.email,
        csrf: pfig.csrf || cookieSession.csrf,
      };
    }
    return cookieSession;
  }
  if (pfig) {
    const roles = Array.isArray(pfig.roles) ? pfig.roles : [];
    const email = String(pfig.email || "");
    const canEdit = Boolean(pfig.canEdit || hasAdminRole(roles) || hasAdminEmail(email));
    return { ...pfig, canEdit, roles: canEdit && !roles.includes("PFIG.Wellbeing.Admin") ? [...roles, "PFIG.Wellbeing.Admin"] : roles };
  }
  return cookieSession;
}

export function requireSession(request, response) {
  const session = getSession(request);
  if (!session) {
    response.status(401).json({ ok: false, error: "Microsoft sign-in is required" });
    return null;
  }
  return session;
}

export function requireAdmin(request, response) {
  const session = requireSession(request, response);
  if (!session) return null;
  if (!session.canEdit) {
    response.status(403).json({ ok: false, error: "Wellbeing Admin role is required" });
    return null;
  }
  return session;
}

export function requireCsrf(request, response, session) {
  if (!safeEqual(request.headers?.["x-csrf-token"], session?.csrf)) {
    response.status(403).json({ ok: false, error: "Invalid CSRF token" });
    return false;
  }
  return true;
}

export function sessionCookie(token, request) {
  const secure = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure ? "; Secure" : ""}`;
}

export function expiredSessionCookie(request) {
  const secure = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}
