export function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const item = part.trim();
    if (!item) continue;
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    const key = item.slice(0, separator).trim();
    const value = item.slice(separator + 1);
    if (key === name) return value;
  }
  return null;
}

export function transactionCookie(value) {
  return `__Host-oauth-tx=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}

export function clearTransactionCookie() {
  return "__Host-oauth-tx=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export function sessionCookie(value) {
  return `__Host-session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}

export function clearSessionCookie() {
  return "__Host-session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
}
