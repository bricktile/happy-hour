import fs from 'node:fs';
import path from 'node:path';
import { parseNote } from './parser';
import type { NoteMeta, UserStats } from './types';

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../');

const USER_DIRS = fs.readdirSync(REPO_ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('.') && !['site', '.bin'].includes(d.name))
  .map(d => d.name);

export function loadAllNotes(): NoteMeta[] {
  const notes: NoteMeta[] = [];
  for (const dir of USER_DIRS) {
    const dirPath = path.join(REPO_ROOT, dir);
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8');
      notes.push(parseNote(raw, file, dir));
    }
  }
  return notes;
}

function parseDate(d: string): Date | null {
  if (!/^\d{8}$/.test(d)) return null;
  const y = parseInt(d.slice(0, 4));
  const m = parseInt(d.slice(4, 6)) - 1;
  const day = parseInt(d.slice(6, 8));
  return new Date(y, m, day);
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function computeStreaks(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...dates].sort();
  let longest = 1;
  let currentRun = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = parseDate(sorted[i - 1]);
    const curr = parseDate(sorted[i]);
    if (!prev || !curr) continue;

    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      currentRun++;
    } else if (diff > 1) {
      currentRun = 1;
    }
    longest = Math.max(longest, currentRun);
  }

  const lastDate = parseDate(sorted[sorted.length - 1]);
  let current = 0;
  if (lastDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) {
      current = 1;
      for (let i = sorted.length - 2; i >= 0; i--) {
        const prev = parseDate(sorted[i]);
        const next = parseDate(sorted[i + 1]);
        if (!prev || !next) break;
        const d = (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (d === 1) current++;
        else break;
      }
    }
  }

  return { current, longest };
}

export function computeUserStats(username: string, notes: NoteMeta[]): UserStats {
  const userNotes = notes.filter(n => n.author === username);
  const dates = [...new Set(userNotes.map(n => n.date).filter(Boolean))];
  const sortedDates = [...dates].sort();
  const { current, longest } = computeStreaks(dates);

  return {
    username,
    totalNotes: userNotes.length,
    totalCheckInDays: dates.length,
    currentStreak: current,
    longestStreak: longest,
    firstCheckIn: sortedDates[0] || '',
    lastCheckIn: sortedDates[sortedDates.length - 1] || '',
    checkInDates: sortedDates,
  };
}

export function getAllUserStats(notes: NoteMeta[]): UserStats[] {
  const users = [...new Set(notes.map(n => n.author))];
  return users.map(u => computeUserStats(u, notes));
}
