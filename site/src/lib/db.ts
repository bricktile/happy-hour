import type { User, Tag, Article, ArticleWithTags, ArticleListItem, UserStats } from './types';

function getDB(locals: App.Locals): D1Database {
  return locals.runtime.env.DB;
}

// --- Users ---

export async function getUserById(db: D1Database, id: number): Promise<User | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
}

export async function getUserByUsername(db: D1Database, username: string): Promise<User | null> {
  return db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<User>();
}

export async function getUserByGithubId(db: D1Database, githubId: number): Promise<User | null> {
  return db.prepare('SELECT * FROM users WHERE github_id = ?').bind(githubId).first<User>();
}

export async function upsertUser(db: D1Database, data: {
  github_id: number;
  username: string;
  display_name: string;
  avatar_url: string;
}): Promise<User> {
  const existing = await db.prepare('SELECT * FROM users WHERE username = ?').bind(data.username).first<User>();
  if (existing) {
    await db.prepare(
      'UPDATE users SET github_id = ?, display_name = ?, avatar_url = ? WHERE id = ?'
    ).bind(data.github_id, data.display_name, data.avatar_url, existing.id).run();
    return (await getUserById(db, existing.id))!;
  }
  const result = await db.prepare(
    'INSERT INTO users (github_id, username, display_name, avatar_url) VALUES (?, ?, ?, ?)'
  ).bind(data.github_id, data.username, data.display_name, data.avatar_url).run();
  return (await getUserById(db, result.meta.last_row_id as number))!;
}

// --- Tags ---

export async function getOrCreateTag(db: D1Database, name: string): Promise<Tag> {
  const slug = slugify(name);
  const existing = await db.prepare('SELECT * FROM tags WHERE slug = ?').bind(slug).first<Tag>();
  if (existing) return existing;
  const result = await db.prepare('INSERT INTO tags (name, slug) VALUES (?, ?)').bind(name, slug).run();
  return { id: result.meta.last_row_id as number, name, slug };
}

export async function getAllTags(db: D1Database): Promise<(Tag & { count: number })[]> {
  return db.prepare(
    'SELECT t.*, COUNT(at.article_id) as count FROM tags t LEFT JOIN article_tags at ON at.tag_id = t.id GROUP BY t.id ORDER BY count DESC'
  ).all().then(r => r.results as (Tag & { count: number })[]);
}

export async function getPopularTags(db: D1Database, limit: number): Promise<(Tag & { count: number })[]> {
  return db.prepare(
    'SELECT t.*, COUNT(at.article_id) as count FROM tags t LEFT JOIN article_tags at ON at.tag_id = t.id GROUP BY t.id HAVING count > 0 ORDER BY count DESC LIMIT ?'
  ).bind(limit).all().then(r => r.results as (Tag & { count: number })[]);
}

export async function getTagsForArticle(db: D1Database, articleId: number): Promise<Tag[]> {
  return db.prepare(
    'SELECT t.* FROM tags t JOIN article_tags at ON at.tag_id = t.id WHERE at.article_id = ?'
  ).bind(articleId).all().then(r => r.results as Tag[]);
}

export async function setArticleTags(db: D1Database, articleId: number, tagNames: string[]): Promise<void> {
  await db.prepare('DELETE FROM article_tags WHERE article_id = ?').bind(articleId).run();
  for (const name of tagNames) {
    if (!name.trim()) continue;
    const tag = await getOrCreateTag(db, name.trim());
    await db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)').bind(articleId, tag.id).run();
  }
}

export async function suggestTags(db: D1Database, query: string): Promise<Tag[]> {
  return db.prepare(
    'SELECT * FROM tags WHERE name LIKE ? ORDER BY name LIMIT 10'
  ).bind(`%${query}%`).all().then(r => r.results as Tag[]);
}

// --- Articles ---

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[一-鿿]+/g, m => m)
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createArticle(db: D1Database, data: {
  user_id: number;
  title: string;
  slug: string;
  body_markdown: string;
  body_html: string;
}): Promise<Article> {
  const result = await db.prepare(
    'INSERT INTO articles (user_id, title, slug, body_markdown, body_html) VALUES (?, ?, ?, ?, ?)'
  ).bind(data.user_id, data.title, data.slug, data.body_markdown, data.body_html).run();
  return db.prepare('SELECT * FROM articles WHERE id = ?').bind(result.meta.last_row_id).first<Article>() as Promise<Article>;
}

export async function updateArticle(db: D1Database, id: number, data: {
  title: string;
  slug: string;
  body_markdown: string;
  body_html: string;
}): Promise<void> {
  await db.prepare(
    "UPDATE articles SET title = ?, slug = ?, body_markdown = ?, body_html = ?, updated_at = datetime('now') WHERE id = ?"
  ).bind(data.title, data.slug, data.body_markdown, data.body_html, id).run();
}

export async function deleteArticle(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM article_tags WHERE article_id = ?').bind(id).run();
  await db.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
}

export async function getArticleById(db: D1Database, id: number): Promise<Article | null> {
  return db.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first<Article>();
}

export async function getArticleWithTags(db: D1Database, username: string, slug: string): Promise<ArticleWithTags | null> {
  const article = await db.prepare(
    'SELECT a.*, u.username as author_username, u.avatar_url as author_avatar FROM articles a JOIN users u ON u.id = a.user_id WHERE u.username = ? AND a.slug = ?'
  ).bind(username, slug).first<ArticleWithTags>();
  if (!article) return null;
  article.tags = await getTagsForArticle(db, article.id);
  return article;
}

export async function getRecentArticles(db: D1Database, limit: number): Promise<ArticleListItem[]> {
  const articles = await db.prepare(
    'SELECT a.id, a.title, a.slug, a.published_at, u.username as author_username, u.avatar_url as author_avatar FROM articles a JOIN users u ON u.id = a.user_id ORDER BY a.published_at DESC LIMIT ?'
  ).bind(limit).all().then(r => r.results as ArticleListItem[]);
  for (const a of articles) {
    a.tags = await getTagsForArticle(db, a.id);
  }
  return articles;
}

export async function getArticlesByUser(db: D1Database, userId: number): Promise<ArticleListItem[]> {
  const articles = await db.prepare(
    'SELECT a.id, a.title, a.slug, a.published_at, u.username as author_username, u.avatar_url as author_avatar FROM articles a JOIN users u ON u.id = a.user_id WHERE a.user_id = ? ORDER BY a.published_at DESC'
  ).bind(userId).all().then(r => r.results as ArticleListItem[]);
  for (const a of articles) {
    a.tags = await getTagsForArticle(db, a.id);
  }
  return articles;
}

export async function getArticlesByTag(db: D1Database, tagSlug: string): Promise<ArticleListItem[]> {
  const articles = await db.prepare(
    'SELECT a.id, a.title, a.slug, a.published_at, u.username as author_username, u.avatar_url as author_avatar FROM articles a JOIN users u ON u.id = a.user_id JOIN article_tags at ON at.article_id = a.id JOIN tags t ON t.id = at.tag_id WHERE t.slug = ? ORDER BY a.published_at DESC'
  ).bind(tagSlug).all().then(r => r.results as ArticleListItem[]);
  for (const a of articles) {
    a.tags = await getTagsForArticle(db, a.id);
  }
  return articles;
}

// --- Recommendations ---

export async function getRecommendedArticles(db: D1Database, articleId: number, tagIds: number[], limit: number): Promise<ArticleListItem[]> {
  if (tagIds.length === 0) return [];
  const placeholders = tagIds.map(() => '?').join(',');
  const articles = await db.prepare(
    `SELECT a.id, a.title, a.slug, a.published_at, u.username as author_username, u.avatar_url as author_avatar, COUNT(at2.tag_id) as shared_tags
     FROM articles a
     JOIN users u ON u.id = a.user_id
     JOIN article_tags at2 ON at2.article_id = a.id
     WHERE at2.tag_id IN (${placeholders}) AND a.id != ?
     GROUP BY a.id
     ORDER BY shared_tags DESC, a.published_at DESC
     LIMIT ?`
  ).bind(...tagIds, articleId, limit).all().then(r => r.results as (ArticleListItem & { shared_tags: number })[]);
  for (const a of articles) {
    a.tags = await getTagsForArticle(db, a.id);
  }
  return articles;
}

// --- Stats ---

export async function getUserStats(db: D1Database, username: string): Promise<UserStats | null> {
  const user = await getUserByUsername(db, username);
  if (!user) return null;

  const articles = await db.prepare(
    'SELECT COUNT(*) as count FROM articles WHERE user_id = ?'
  ).bind(user.id).first<{ count: number }>();

  const checkInRows = await db.prepare(
    'SELECT date FROM check_ins WHERE user_id = ? ORDER BY date'
  ).bind(user.id).all().then(r => r.results as { date: string }[]);

  const dates = checkInRows.map(r => r.date.replace(/-/g, ''));
  const { current, longest } = computeStreaks(dates);

  return {
    username: user.username,
    totalNotes: articles?.count ?? 0,
    totalCheckInDays: dates.length,
    currentStreak: current,
    longestStreak: longest,
    firstCheckIn: dates[0] || '',
    lastCheckIn: dates[dates.length - 1] || '',
    checkInDates: dates,
  };
}

export async function getAllUserStats(db: D1Database): Promise<UserStats[]> {
  const users = await db.prepare('SELECT username FROM users').all().then(r => r.results as { username: string }[]);
  const stats: UserStats[] = [];
  for (const u of users) {
    const s = await getUserStats(db, u.username);
    if (s) stats.push(s);
  }
  return stats;
}

function computeStreaks(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };
  const sorted = [...dates].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseDate(sorted[i - 1]);
    const curr = parseDate(sorted[i]);
    if (!prev || !curr) continue;
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) run++;
    else if (diff > 1) run = 1;
    longest = Math.max(longest, run);
  }
  const last = parseDate(sorted[sorted.length - 1]);
  let current = 0;
  if (last) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = (today.getTime() - last.getTime()) / 86400000;
    if (diff <= 1) {
      current = 1;
      for (let i = sorted.length - 2; i >= 0; i--) {
        const p = parseDate(sorted[i]);
        const n = parseDate(sorted[i + 1]);
        if (!p || !n) break;
        if ((n.getTime() - p.getTime()) / 86400000 === 1) current++;
        else break;
      }
    }
  }
  return { current, longest };
}

function parseDate(d: string): Date | null {
  if (!/^\d{8}$/.test(d)) return null;
  return new Date(parseInt(d.slice(0, 4)), parseInt(d.slice(4, 6)) - 1, parseInt(d.slice(6, 8)));
}

export { getDB, slugify };
