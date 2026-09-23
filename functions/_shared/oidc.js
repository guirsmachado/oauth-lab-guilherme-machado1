import { base64UrlDecode } from "./crypto.js";

const decoder = new TextDecoder();
const DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration";

function decodeJsonPart(part) {
  try {
    return JSON.parse(decoder.decode(base64UrlDecode(part)));
  } catch {
    throw new Error("Invalid JWT encoding");
  }
}

function validAudience(payload, expectedClientId) {
  if (typeof payload.aud === "string") return payload.aud === expectedClientId;
  if (Array.isArray(payload.aud) && payload.aud.includes(expectedClientId)) {
    if (payload.aud.length > 1) return payload.azp === expectedClientId;
    return true;
  }
  return false;
}

export async function verifyGoogleIdToken(idToken, clientId, expectedNonce) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJsonPart(encodedHeader);
  const payload = decodeJsonPart(encodedPayload);

  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw new Error("Invalid Google JWT header");
  }

  const discoveryResponse = await fetch(DISCOVERY_URL);
  if (!discoveryResponse.ok) throw new Error("OIDC discovery failed");
  const discovery = await discoveryResponse.json();

  if (typeof discovery.issuer !== "string" || typeof discovery.jwks_uri !== "string") {
    throw new Error("Invalid OIDC discovery document");
  }

  const jwksResponse = await fetch(discovery.jwks_uri);
  if (!jwksResponse.ok) throw new Error("JWKS fetch failed");
  const jwks = await jwksResponse.json();
  const jwk = Array.isArray(jwks.keys)
    ? jwks.keys.find((key) => key.kid === header.kid && key.kty === "RSA")
    : null;
  if (!jwk) throw new Error("Signing key not found");

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signatureOk = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    publicKey,
    base64UrlDecode(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );
  if (!signatureOk) throw new Error("Invalid Google JWT signature");

  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== discovery.issuer) throw new Error("Invalid issuer");
  if (!validAudience(payload, clientId)) throw new Error("Invalid audience");
  if (!Number.isInteger(payload.exp) || payload.exp <= now) throw new Error("Expired token");
  if (!Number.isInteger(payload.iat) || payload.iat > now + 300) throw new Error("Invalid issued-at time");
  if (typeof payload.nonce !== "string" || payload.nonce !== expectedNonce) {
    throw new Error("Invalid nonce");
  }
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("Invalid subject");
  }

  return {
    issuer: payload.iss,
    subject: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
    displayName:
      typeof payload.name === "string" && payload.name.length > 0
        ? payload.name
        : typeof payload.email === "string"
          ? payload.email
          : payload.sub,
  };
}
