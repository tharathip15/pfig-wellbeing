import crypto from "node:crypto";

export const SESSION_COOKIE_NAME = "pfig_wellbeing_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function getSessionSecret() {
  const secret = String(process.env.WELLBEING_SESSION_SECRET || "");
  if (secret.length < 32) throw new Error("WELLBEING_SESSION_SECRET must contain at least 32 characters");
  return secret;
}

function sign(value) {
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

export function hasAdminRole(roles) {
  const allowed = new Set(configuredAdminRoles());
  return (Array.isArray(roles) ? roles : []).some(role => allowed.has(String(role).trim().toLowerCase()));
}

export function createSession(identity) {
  const now = Math.floor(Date.now() / 1000);
  const roles = Array.isArray(identity.roles) ? identity.roles.map(String) : [];
  const payload = {
    oid: String(identity.oid || ""),
    tid: String(identity.tid || ""),
    name: String(identity.name || "Microsoft User"),
    email: String(identity.email || ""),
    roles,
    canEdit: hasAdminRole(roles),
    csrf: crypto.randomBytes(24).toString("base64url"),
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
  return parseSessionToken(parseCookies(request)[SESSION_COOKIE_NAME]);
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
