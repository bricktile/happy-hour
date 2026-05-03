export interface User {
  id: number;
  github_id: number | null;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Article {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  body_markdown: string;
  body_html: string;
  published_at: string;
  updated_at: string;
}

export interface ArticleWithTags extends Article {
  tags: Tag[];
  author_username: string;
  author_avatar: string | null;
}

export interface ArticleListItem {
  id: number;
  title: string;
  slug: string;
  published_at: string;
  author_username: string;
  author_avatar: string | null;
  tags: Tag[];
}

export interface CheckIn {
  id: number;
  user_id: number;
  date: string;
}

export interface UserStats {
  username: string;
  totalNotes: number;
  totalCheckInDays: number;
  currentStreak: number;
  longestStreak: number;
  firstCheckIn: string;
  lastCheckIn: string;
  checkInDates: string[];
}
