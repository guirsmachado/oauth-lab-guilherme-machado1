import {
  clearTransactionCookie,
  readCookie,
  sessionCookie,
} from "../../_shared/cookies.js";
import { randomBase64Url, sha256Base64Url } from "../../_shared/crypto.js";
import { isSupportedProvider, providerConfig } from "../../_shared/providers.js";
import { verifyGoogleIdToken } from "../../_shared/oidc.js";

function noStoreResponse(status, message, clearTx = false) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8",
  });
  if (clearTx) headers.append("Set-Cookie", clearTransactionCookie());
  return new Response(message, { status, headers });
}

async function exchangeGoogleCode(config, code, codeVerifier) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error("Google token exchange failed");
  const data = await response.json();
  if (typeof data.id_token !== "string") throw new Error("Google id_token missing");
  return data.id_token;
}

async function exchangeGitHubCode(config, code, codeVerifier) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!response.ok) throw new Error("GitHub token exchange failed");
  const data = await response.json();
  if (typeof data.access_token !== "string") throw new Error("GitHub access_token missing");
  if (String(data.token_type || "").toLowerCase() !== "bearer") {
    throw new Error("Unexpected GitHub token type");
  }
  return data.access_token;
}

async function githubIdentityAndRevoke(config, accessToken) {
  let userResponse;
  let userData = null;

  try {
    userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
        "User-Agent": "oauth-pages-lab",
      },
    });
    if (userResponse.ok) userData = await userResponse.json();
  } finally {
    const basic = btoa(`${config.clientId}:${config.clientSecret}`);
    const revokeResponse = await fetch(
      `https://api.github.com/applications/${encodeURIComponent(config.clientId)}/grant`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${basic}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2026-03-10",
          "User-Agent": "oauth-pages-lab",
        },
        body: JSON.stringify({ access_token: accessToken }),
      }
    );
    if (revokeResponse.status !== 204) throw new Error("GitHub authorization revocation failed");
  }

  if (!userResponse || userResponse.status !== 200 || !userData) {
    throw new Error("GitHub profile lookup failed");
  }
  if (!Number.isInteger(userData.id)) throw new Error("Invalid GitHub user id");

  return {
    issuer: "https://github.com",
    subject: String(userData.id),
    email: typeof userData.email === "string" ? userData.email : null,
    displayName:
      typeof userData.name === "string" && userData.name.length > 0
        ? userData.name
        : typeof userData.login === "string" && userData.login.length > 0
          ? userData.login
          : String(userData.id),
  };
}

export async function onRequestGet(context) {
  const provider = context.params.provider;
  if (!isSupportedProvider(provider)) return noStoreResponse(404, "Not found");
  if (!context.env.DB) return noStoreResponse(503, "Service unavailable");

  const url = new URL(context.request.url);
  const providerError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const rawTransaction = readCookie(context.request, "__Host-oauth-tx");

  if (providerError || !code || !state || !rawTransaction) {
    return noStoreResponse(400, "Authentication response rejected", Boolean(rawTransaction));
  }

  const now = Math.floor(Date.now() / 1000);
  const txIdHash = await sha256Base64Url(rawTransaction);
  const transaction = await context.env.DB.prepare(
    `SELECT provider, state_hash, nonce, code_verifier, expires_at
     FROM oauth_transactions
     WHERE id_hash = ?1 AND expires_at > ?2`
  )
    .bind(txIdHash, now)
    .first();

  if (!transaction) {
    return noStoreResponse(400, "Authentication transaction rejected", true);
  }

  const submittedStateHash = await sha256Base64Url(state);
  if (transaction.provider !== provider || transaction.state_hash !== submittedStateHash) {
    await context.env.DB.prepare("DELETE FROM oauth_transactions WHERE id_hash = ?1")
      .bind(txIdHash)
      .run();
    return noStoreResponse(400, "Authentication transaction rejected", true);
  }

  // A transação é de uso único e é removida antes da troca do código.
  await context.env.DB.prepare("DELETE FROM oauth_transactions WHERE id_hash = ?1")
    .bind(txIdHash)
    .run();

  try {
    const config = providerConfig(provider, context.env);
    let identity;

    if (provider === "google") {
      if (typeof transaction.nonce !== "string" || transaction.nonce.length === 0) {
        throw new Error("Missing nonce");
      }
      const idToken = await exchangeGoogleCode(config, code, transaction.code_verifier);
      identity = await verifyGoogleIdToken(idToken, config.clientId, transaction.nonce);
    } else {
      const accessToken = await exchangeGitHubCode(config, code, transaction.code_verifier);
      identity = await githubIdentityAndRevoke(config, accessToken);
    }

    const rawSession = randomBase64Url(32);
    const sessionIdHash = await sha256Base64Url(rawSession);
    const expiresAt = now + 28800;

    await context.env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?1").bind(now).run();
    await context.env.DB.prepare(
      `INSERT INTO sessions
       (id_hash, issuer, subject, email, display_name, expires_at, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
      .bind(
        sessionIdHash,
        identity.issuer,
        identity.subject,
        identity.email,
        identity.displayName,
        expiresAt,
        now
      )
      .run();

    const headers = new Headers({
      Location: context.env.PUBLIC_BASE_URL,
      "Cache-Control": "no-store",
    });
    headers.append("Set-Cookie", clearTransactionCookie());
    headers.append("Set-Cookie", sessionCookie(rawSession));

    return new Response(null, { status: 302, headers });
  } catch {
    return noStoreResponse(400, "Authentication failed", true);
  }
}
