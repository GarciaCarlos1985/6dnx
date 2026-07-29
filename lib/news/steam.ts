import "server-only";

import { readBoundedResponseJson } from "@/lib/http/read-bounded-response";
import type { NewsArticle, NewsCategory } from "@/lib/news/types";

const STEAM_NEWS_ENDPOINT =
  "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/";
const MAX_ITEMS_PER_GAME = 5;
const MAX_SUMMARY_LENGTH = 360;
const MAX_STEAM_RESPONSE_BYTES = 512_000;
const MAX_SOURCE_URL_LENGTH = 2_048;
const SAFE_STEAM_ARTICLE_HOSTS = new Set([
  "steamcommunity.com",
  "www.steamcommunity.com",
  "store.steampowered.com",
  "steamstore-a.akamaihd.net",
]);

const trackedGames = [
  { appId: 221100, name: "DayZ" },
  { appId: 1808500, name: "ARC Raiders" },
  { appId: 730, name: "Counter-Strike 2" },
] as const;

type SteamNewsItem = {
  gid?: unknown;
  title?: unknown;
  url?: unknown;
  author?: unknown;
  contents?: unknown;
  feedlabel?: unknown;
  date?: unknown;
};

type SteamNewsResponse = {
  appnews?: {
    newsitems?: SteamNewsItem[];
  };
};

type FetchSteamNewsOptions = {
  fresh?: boolean;
};

function decodeEntities(value: string) {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
  };

  return value.replace(
    /&(amp|quot|#39|lt|gt|nbsp);/g,
    (entity) => entities[entity] ?? entity,
  );
}

function cleanText(value: string) {
  return decodeEntities(
    value
      .replace(/\[(?:\/?)[a-z]+(?:=[^\]]+)?\]/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/\\[A-Z_]+/g, " ")
      .replace(/([.!?])([A-ZÀ-Ü])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const trimmed = value.slice(0, maxLength + 1).replace(/\s+\S*$/, "").trim();
  return `${trimmed}…`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

function classify(title: string): NewsCategory {
  const normalized = title.toLowerCase();
  if (/launch|release|lançamento|chega|coming|roadmap|expansion/.test(normalized)) {
    return "release";
  }
  if (/update|patch|hotfix|version|versão|maintenance|issue/.test(normalized)) {
    return "update";
  }
  return "community";
}

function isSafeSourceUrl(value: string) {
  if (value.length > MAX_SOURCE_URL_LENGTH) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      SAFE_STEAM_ARTICLE_HOSTS.has(url.hostname)
    );
  } catch {
    return false;
  }
}

function normalizeItem(
  item: SteamNewsItem,
  game: (typeof trackedGames)[number],
): NewsArticle | null {
  if (
    typeof item.gid !== "string" ||
    item.gid.length < 1 ||
    item.gid.length > 80 ||
    typeof item.title !== "string" ||
    item.title.length > 2_000 ||
    typeof item.url !== "string" ||
    typeof item.date !== "number" ||
    !isSafeSourceUrl(item.url)
  ) {
    return null;
  }

  const publishedAt = new Date(item.date * 1000);
  if (!Number.isFinite(publishedAt.getTime())) return null;

  const title = truncate(cleanText(item.title), 220);
  const summary = truncate(
    cleanText(
      typeof item.contents === "string"
        ? item.contents.slice(0, 32_000)
        : "",
    ),
    MAX_SUMMARY_LENGTH,
  );
  if (!title || !summary) return null;

  const externalId = `steam:${game.appId}:${item.gid}`;
  const slugBase = slugify(`${game.name}-${title}`);

  return {
    id: externalId,
    externalId,
    slug: `${slugBase}-${item.gid}`,
    title,
    summary,
    gameName: game.name,
    category: classify(title),
    sourceName: `${game.name} · Steam`,
    sourceUrl: item.url,
    imageUrl: `https://cdn.akamai.steamstatic.com/steam/apps/${game.appId}/header.jpg`,
    publishedAt: publishedAt.toISOString(),
    featured: false,
  };
}

async function fetchGameNews(
  game: (typeof trackedGames)[number],
  options: FetchSteamNewsOptions,
) {
  const url = new URL(STEAM_NEWS_ENDPOINT);
  url.searchParams.set("appid", String(game.appId));
  url.searchParams.set("count", String(MAX_ITEMS_PER_GAME));
  url.searchParams.set("maxlength", String(MAX_SUMMARY_LENGTH));
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    cache: options.fresh ? "no-store" : undefined,
    next: options.fresh
      ? undefined
      : { revalidate: 86_400, tags: ["game-news"] },
    signal: AbortSignal.timeout(6_000),
  });

  if (!response.ok) {
    throw new Error(`Steam news returned ${response.status} for ${game.appId}`);
  }

  const payload = await readBoundedResponseJson<SteamNewsResponse>(
    response,
    MAX_STEAM_RESPONSE_BYTES,
  );
  const items = Array.isArray(payload.appnews?.newsitems)
    ? payload.appnews.newsitems
    : [];

  return items
    .map((item) => normalizeItem(item, game))
    .filter((item): item is NewsArticle => item !== null);
}

export async function fetchSteamNews(options: FetchSteamNewsOptions = {}) {
  const results = await Promise.allSettled(
    trackedGames.map((game) => fetchGameNews(game, options)),
  );

  const articles = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  if (articles.length === 0) {
    throw new Error("All Steam news sources failed");
  }

  return articles
    .sort(
      (left, right) =>
        Date.parse(right.publishedAt) - Date.parse(left.publishedAt),
    )
    .map((article, index) => ({ ...article, featured: index === 0 }));
}
