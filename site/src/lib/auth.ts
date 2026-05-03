const SESSION_COOKIE = 'hh_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

function base64url(data: ArrayBuffer | Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return base64url(sig);
}

export async function createSession(userId: number, secret: string): Promise<string> {
  const exp = Date.now() + SESSION_DURATION;
  const payload = JSON.stringify({ userId, exp });
  const payloadB64 = base64url(payload);
  const sig = await hmacSign(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function getSession(cookies: { get: (name: string) => { value: string } | undefined }, secret: string): Promise<{ userId: number } | null> {
  const cookie = cookies.get(SESSION_COOKIE);
  if (!cookie) return null;
  const [payloadB64, sig] = cookie.value.split('.');
  if (!payloadB64 || !sig) return null;
  const expectedSig = await hmacSign(secret, payloadB64);
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)));
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function setSessionCookie(cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void }, token: string): void {
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
  });
}

export function clearSessionCookie(cookies: { delete: (name: string, opts: Record<string, unknown>) => void }): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
