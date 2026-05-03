/**
 * Migration script: reads existing markdown files and generates SQL
 * to insert into D1.
 *
 * Run: npx tsx src/scripts/migrate.ts > migration_data.sql
 * Then: wrangler d1 execute happy-hour --file=./migration_data.sql
 */

import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../');
const USER_DIRS = fs.readdirSync(REPO_ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('.') && !['site', '.bin'].includes(d.name))
  .map(d => d.name);

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

const lines: string[] = [];
const usernames = new Set<string>();

// Insert users
for (const dir of USER_DIRS) {
  usernames.add(dir);
  lines.push(
    `INSERT OR IGNORE INTO users (github_id, username, display_name) VALUES (0, '${escapeSql(dir)}', '${escapeSql(dir)}');`
  );
}

// Insert articles and check_ins
for (const dir of USER_DIRS) {
  const dirPath = path.join(REPO_ROOT, dir);
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    const slug = file.replace('.md', '');

    // Parse frontmatter
    const fileLines = raw.split('\n');
    const frontmatter: Record<string, string> = {};
    let i = 0;
    while (i < fileLines.length && /^- \w+:/.test(fileLines[i])) {
      const match = fileLines[i].match(/^- (\w+):\s*(.*)/);
      if (match) frontmatter[match[1]] = match[2].trim();
      i++;
    }
    while (i < fileLines.length && fileLines[i].trim() === '') i++;
    const body = fileLines.slice(i).join('\n');

    const date = frontmatter.date || (/^\d{8}/.test(slug) ? slug : '');
    const titleMatch = body.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : slug;

    // Simple markdown to HTML (just escape, real rendering happens on read)
    const bodyHtml = `<p>${escapeSql(body).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;

    let publishedAt = '';
    if (date && date.length === 8) {
      publishedAt = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T00:00:00`;
    }

    lines.push(
      `INSERT OR IGNORE INTO articles (user_id, title, slug, body_markdown, body_html, published_at) VALUES ((SELECT id FROM users WHERE username = '${escapeSql(dir)}'), '${escapeSql(title)}', '${escapeSql(slug)}', '${escapeSql(body)}', '${escapeSql(bodyHtml)}', '${publishedAt || "datetime('now')"}');`
    );

    // Insert check_in for date-based files
    if (date && date.length === 8) {
      const checkInDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
      lines.push(
        `INSERT OR IGNORE INTO check_ins (user_id, date) VALUES ((SELECT id FROM users WHERE username = '${escapeSql(dir)}'), '${checkInDate}');`
      );
    }
  }
}

// Wrap in a transaction
console.log('BEGIN TRANSACTION;');
for (const line of lines) {
  console.log(line);
}
console.log('COMMIT;');
