let accessToken: string | null = null;

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  return decodeURIComponent(
    atob(base64 + padding)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
}

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  sessionId: string;
  type: string;
  exp: number;
  iat: number;
}

export function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = parseJwt(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now();
}

export function willExpireSoon(token: string, thresholdMs = 60_000): boolean {
  const payload = parseJwt(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now() + thresholdMs;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function hasAccessToken(): boolean {
  return accessToken !== null && !isTokenExpired(accessToken);
}
