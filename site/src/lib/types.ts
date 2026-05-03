export interface NoteMeta {
  date: string;
  author: string;
  title: string;
  slug: string;
  filename: string;
  body: string;
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
