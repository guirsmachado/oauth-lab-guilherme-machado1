import { clearSessionCookie, readCookie } from "../_shared/cookies.js";
import { sha256Base64Url } from "../_shared/crypto.js";

function response(status, body, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      ...extraHeaders,
    },
  });
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return response(405, "Method not allowed", { Allow: "POST" });
  }
  if (!context.env.DB || !context.env.PUBLIC_BASE_URL) {
    return response(503, "Service unavailable");
  }

  const origin = context.request.headers.get("Origin");
  if (origin !== context.env.PUBLIC_BASE_URL) {
    return response(403, "Invalid origin");
  }

  const rawSession = readCookie(context.request, "__Host-session");
  if (rawSession) {
    const idHash = await sha256Base64Url(rawSession);
    await context.env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?1").bind(idHash).run();
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: context.env.PUBLIC_BASE_URL,
      "Set-Cookie": clearSessionCookie(),
      "Cache-Control": "no-store",
    },
  });
}
