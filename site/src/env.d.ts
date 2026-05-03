/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        DB: D1Database;
        GITHUB_CLIENT_ID: string;
        GITHUB_CLIENT_SECRET: string;
        AUTH_SECRET: string;
      };
    };
    user: {
      id: number;
      username: string;
      display_name: string;
      avatar_url: string;
    } | null;
  }
}
