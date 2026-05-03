import type { APIRoute } from 'astro';
import { getDB, createArticle, setArticleTags, slugify } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json() as {
    title: string;
    body_markdown: string;
    tags: string[];
  };

  if (!body.title?.trim() || !body.body_markdown?.trim()) {
    return new Response(JSON.stringify({ error: 'Title and body are required' }), { status: 400 });
  }

  const db = getDB(locals);
  const slug = slugify(body.title);
  const body_html = renderMarkdown(body.body_markdown);

  const article = await createArticle(db, {
    user_id: locals.user.id,
    title: body.title.trim(),
    slug,
    body_markdown: body.body_markdown,
    body_html,
  });

  if (body.tags?.length) {
    await setArticleTags(db, article.id, body.tags);
  }

  // Auto check-in for today
  const today = new Date().toISOString().slice(0, 10);
  await db.prepare('INSERT OR IGNORE INTO check_ins (user_id, date) VALUES (?, ?)').bind(locals.user.id, today).run();

  return new Response(JSON.stringify({ id: article.id, slug: article.slug }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
