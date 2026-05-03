import type { NoteMeta } from './types';

export function parseNote(raw: string, filename: string, dirName: string): NoteMeta {
  const lines = raw.split('\n');
  const frontmatter: Record<string, string> = {};
  let bodyStart = 0;

  let i = 0;
  while (i < lines.length && /^- \w+:/.test(lines[i])) {
    const match = lines[i].match(/^- (\w+):\s*(.*)/);
    if (match) frontmatter[match[1]] = match[2].trim();
    i++;
  }

  while (i < lines.length && lines[i].trim() === '') i++;
  bodyStart = i;

  const body = lines.slice(bodyStart).join('\n');

  let date = frontmatter.date || '';
  if (!date && /^\d{8}/.test(filename)) {
    date = filename.replace('.md', '');
  }

  const author = frontmatter.author || dirName;

  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filename.replace('.md', '');

  const slug = filename.replace('.md', '');

  return { date, author, title, slug, filename, body };
}
