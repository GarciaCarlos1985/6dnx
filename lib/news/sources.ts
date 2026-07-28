import "server-only";

import { fetchOfficialAiNews } from "@/lib/news/official-rss";
import { fetchSteamNews } from "@/lib/news/steam";
import type { NewsArticle } from "@/lib/news/types";

type FetchNewsOptions = {
  fresh?: boolean;
};

export async function fetchOfficialNews(options: FetchNewsOptions = {}) {
  const results = await Promise.allSettled([
    fetchSteamNews(options),
    fetchOfficialAiNews(options),
  ]);
  const seen = new Set<string>();
  const articles: NewsArticle[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const article of result.value) {
      if (seen.has(article.externalId)) continue;
      seen.add(article.externalId);
      articles.push(article);
    }
  }

  if (articles.length === 0) {
    throw new Error("All official news sources failed");
  }

  return articles
    .sort(
      (left, right) =>
        Date.parse(right.publishedAt) - Date.parse(left.publishedAt),
    )
    .map((article, index) => ({ ...article, featured: index === 0 }));
}
