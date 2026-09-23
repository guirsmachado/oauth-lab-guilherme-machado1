const GOOGLE = "google";
const GITHUB = "github";

export function isSupportedProvider(provider) {
  return provider === GOOGLE || provider === GITHUB;
}

export function providerConfig(provider, env) {
  const base = env.PUBLIC_BASE_URL;
  if (!base) throw new Error("Missing PUBLIC_BASE_URL");

  if (provider === GOOGLE) {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new Error("Missing Google configuration");
    }
    return {
      name: GOOGLE,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      redirectUri: `${base}/oauth/callback/google`,
      scope: "openid email profile",
    };
  }

  if (provider === GITHUB) {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      throw new Error("Missing GitHub configuration");
    }
    return {
      name: GITHUB,
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      authorizationEndpoint: "https://github.com/login/oauth/authorize",
      tokenEndpoint: "https://github.com/login/oauth/access_token",
      redirectUri: `${base}/oauth/callback/github`,
    };
  }

  return null;
}

export function loginProviderConfig(provider, env) {
  const base = env.PUBLIC_BASE_URL;
  if (!base) throw new Error("Missing PUBLIC_BASE_URL");

  if (provider === GOOGLE) {
    if (!env.GOOGLE_CLIENT_ID) throw new Error("Missing GOOGLE_CLIENT_ID");
    return {
      name: GOOGLE,
      clientId: env.GOOGLE_CLIENT_ID,
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      redirectUri: `${base}/oauth/callback/google`,
      scope: "openid email profile",
    };
  }

  if (provider === GITHUB) {
    if (!env.GITHUB_CLIENT_ID) throw new Error("Missing GITHUB_CLIENT_ID");
    return {
      name: GITHUB,
      clientId: env.GITHUB_CLIENT_ID,
      authorizationEndpoint: "https://github.com/login/oauth/authorize",
      redirectUri: `${base}/oauth/callback/github`,
    };
  }

  return null;
}
