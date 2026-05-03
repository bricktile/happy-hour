import type { APIRoute } from 'astro';
import { upsertUser } from '../../../lib/db';
import { createSession, setSessionCookie } from '../../../lib/auth';

export const GET: APIRoute = async ({ request, locals, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return new Response('Missing code', { status: 400 });

  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, AUTH_SECRET } = locals.runtime.env;
  const redirectUri = `${url.origin}/api/auth/callback`;

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    return new Response(`OAuth error: ${tokenData.error}`, { status: 400 });
  }

  // Fetch user profile
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'happy-hour',
    },
  });
  const ghUser = await userRes.json() as {
    id: number;
    login: string;
    name: string | null;
    avatar_url: string;
  };

  // Upsert user in D1
  const db = locals.runtime.env.DB;
  const user = await upsertUser(db, {
    github_id: ghUser.id,
    username: ghUser.login,
    display_name: ghUser.name || ghUser.login,
    avatar_url: ghUser.avatar_url,
  });

  // Set session cookie
  const token = await createSession(user.id, AUTH_SECRET);
  setSessionCookie(cookies, token);

  return new Response(null, {
    status: 302,
    headers: { Location: '/' },
  });
};
