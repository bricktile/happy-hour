import type { APIRoute } from 'astro';
import { getDB, getArticleById, updateArticle, deleteArticle, setArticleTags, slugify } from '../../../lib/db';
import { renderMarkdown } from '../../../lib/markdown';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const id = parseInt(params.id!);
  const db = getDB(locals);
  const article = await getArticleById(db, id);

  if (!article || article.user_id !== locals.user.id) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  const body = await request.json() as {
    title: string;
    body_markdown: string;
    tags: string[];
  };

  const newSlug = slugify(body.title);
  const body_html = renderMarkdown(body.body_markdown);

  await updateArticle(db, id, {
    title: body.title.trim(),
    slug: newSlug,
    body_markdown: body.body_markdown,
    body_html,
  });

  await setArticleTags(db, id, body.tags || []);

  return new Response(JSON.stringify({ id, slug: newSlug }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const id = parseInt(params.id!);
  const db = getDB(locals);
  const article = await getArticleById(db, id);

  if (!article || article.user_id !== locals.user.id) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  await deleteArticle(db, id);

  return new Response(null, { status: 204 });
};
