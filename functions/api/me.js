import { readCookie } from "../_shared/cookies.js";
import { sha256Base64Url } from "../_shared/crypto.js";

function noStoreJson(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return noStoreJson({ error: "service_unavailable" }, 503);

  const rawSession = readCookie(request, "__Host-session");
  if (!rawSession) return noStoreJson({ error: "unauthorized" }, 401);

  const idHash = await sha256Base64Url(rawSession);
  const now = Math.floor(Date.now() / 1000);

  const session = await env.DB.prepare(
    `SELECT issuer, subject, email, display_name, expires_at
     FROM sessions
     WHERE id_hash = ?1 AND expires_at > ?2`
  )
    .bind(idHash, now)
    .first();

  if (!session) return noStoreJson({ error: "unauthorized" }, 401);

  return noStoreJson({
    issuer: session.issuer,
    subject: session.subject,
    email: session.email ?? null,
    displayName: session.display_name ?? null,
  });
}
