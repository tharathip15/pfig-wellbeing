import crypto from "node:crypto";

const JWKS_CACHE_MS = 60 * 60 * 1000;
let cachedSigningKeys = null;
let signingKeysFetchedAt = 0;

function getConfig() {
  const tenantId = String(process.env.MICROSOFT_TENANT_ID || "").trim();
  const clientId = String(process.env.MICROSOFT_CLIENT_ID || "").trim();
  if (!tenantId || !clientId) throw new Error("Microsoft SSO is not configured");
  return { tenantId, clientId };
}

export async function verifyMicrosoftIdToken(token, expectedNonce) {
  const { tenantId, clientId } = getConfig();
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT token format");

  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported Microsoft token signature");

  let signingKey = (await getMicrosoftSigningKeys(tenantId)).find(key => key.kid === header.kid);
  if (!signingKey) {
    signingKey = (await getMicrosoftSigningKeys(tenantId, true)).find(key => key.kid === header.kid);
  }
  if (!signingKey) throw new Error("Microsoft signing key not found");

  const publicKey = crypto.createPublicKey({ key: signingKey, format: "jwk" });
  const signatureValid = crypto.verify(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`),
    publicKey,
    Buffer.from(parts[2], "base64url"),
  );
  if (!signatureValid) throw new Error("Invalid Microsoft token signature");

  const now = Math.floor(Date.now() / 1000);
  const allowedIssuers = new Set([
    `https://login.microsoftonline.com/${tenantId}/v2.0`,
    `https://sts.windows.net/${tenantId}/`,
  ]);
  const validAudience = payload.aud === clientId
    || (Array.isArray(payload.aud) && payload.aud.includes(clientId));

  if (payload.tid !== tenantId || !allowedIssuers.has(payload.iss) || !validAudience) {
    throw new Error("Microsoft token tenant, issuer or audience mismatch");
  }
  if (!Number.isFinite(payload.exp) || payload.exp <= now) throw new Error("Microsoft token expired");
  if (Number.isFinite(payload.nbf) && payload.nbf > now + 60) throw new Error("Microsoft token not active");
  if (!expectedNonce || payload.nonce !== expectedNonce) throw new Error("Microsoft token nonce mismatch");
  if (!payload.oid) throw new Error("Microsoft token is missing the object id");

  return payload;
}

async function getMicrosoftSigningKeys(tenantId, forceRefresh = false) {
  const cacheFresh = cachedSigningKeys && Date.now() - signingKeysFetchedAt < JWKS_CACHE_MS;
  if (!forceRefresh && cacheFresh) return cachedSigningKeys;

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`);
  if (!response.ok) throw new Error("Unable to load Microsoft signing keys");
  const data = await response.json();
  if (!Array.isArray(data.keys)) throw new Error("Invalid Microsoft signing keys response");

  cachedSigningKeys = data.keys;
  signingKeysFetchedAt = Date.now();
  return cachedSigningKeys;
}
