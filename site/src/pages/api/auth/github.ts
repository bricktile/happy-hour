import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  const clientId = locals.runtime.env.GITHUB_CLIENT_ID;
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user',
  });

  return new Response(null, {
    status: 302,
    headers: { Location: `https://github.com/login/oauth/authorize?${params}` },
  });
};
