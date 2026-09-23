import { randomBase64Url, sha256Base64Url, pkceChallenge } from "../../_shared/crypto.js";
import { transactionCookie } from "../../_shared/cookies.js";
import { isSupportedProvider, loginProviderConfig } from "../../_shared/providers.js";

function noStore(status, message) {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function onRequestGet(context) {
  const provider = context.params.provider;
  if (!isSupportedProvider(provider)) return noStore(404, "Not found");
  if (!context.env.DB) return noStore(503, "Service unavailable");

  try {
    const config = loginProviderConfig(provider, context.env);
    const transactionId = randomBase64Url(32);
    const state = randomBase64Url(32);
    const codeVerifier = randomBase64Url(32);
    const nonce = provider === "google" ? randomBase64Url(32) : null;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 600;

    const [idHash, stateHash, codeChallenge] = await Promise.all([
      sha256Base64Url(transactionId),
      sha256Base64Url(state),
      pkceChallenge(codeVerifier),
    ]);

    await context.env.DB.prepare("DELETE FROM oauth_transactions WHERE expires_at <= ?1")
      .bind(now)
      .run();

    await context.env.DB.prepare(
      `INSERT INTO oauth_transactions
       (id_hash, provider, state_hash, nonce, code_verifier, expires_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
    )
      .bind(idHash, provider, stateHash, nonce, codeVerifier, expiresAt)
      .run();

    const authorizationUrl = new URL(config.authorizationEndpoint);
    authorizationUrl.searchParams.set("client_id", config.clientId);
    authorizationUrl.searchParams.set("redirect_uri", config.redirectUri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("code_challenge", codeChallenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");

    if (provider === "google") {
      authorizationUrl.searchParams.set("scope", config.scope);
      authorizationUrl.searchParams.set("nonce", nonce);
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: authorizationUrl.toString(),
        "Set-Cookie": transactionCookie(transactionId),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return noStore(500, "Unable to start login");
  }
}
