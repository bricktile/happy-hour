import { defineMiddleware } from 'astro:middleware';
import { getSession } from './lib/auth';
import { getUserById } from './lib/db';

export const onRequest = defineMiddleware(async (context, next) => {
  const { locals, cookies } = context;
  const secret = locals.runtime.env.AUTH_SECRET;

  locals.user = null;

  if (secret) {
    const session = await getSession(cookies, secret);
    if (session) {
      const db = locals.runtime.env.DB;
      const user = await getUserById(db, session.userId);
      if (user) {
        locals.user = {
          id: user.id,
          username: user.username,
          display_name: user.display_name || user.username,
          avatar_url: user.avatar_url || '',
        };
      }
    }
  }

  return next();
});
