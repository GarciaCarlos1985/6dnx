import "server-only";

import { readBoundedResponseJson } from "@/lib/http/read-bounded-response";
import { fetchOfficialNews } from "@/lib/news/sources";
import { seedNews } from "@/lib/news/seed";
import {
  newsCategories,
  type NewsArticle,
  type NewsCategory,
} from "@/lib/news/types";

const MAX_PUBLIC_ITEMS = 24;
const MAX_EXTERNAL_ID_LENGTH = 200;
const MAX_SLUG_LENGTH = 180;
const MAX_SOURCE_URL_LENGTH = 2_048;
const MAX_SUPABASE_READ_BYTES = 512_000;
const MAX_SUPABASE_RPC_BYTES = 64_000;
const SAFE_SOURCE_HOSTS = new Set([
  "blog.google",
  "openai.com",
  "www.openai.com",
  "steamcommunity.com",
  "www.steamcommunity.com",
  "store.steampowered.com",
  "steamstore-a.akamaihd.net",
]);
const SAFE_IMAGE_HOSTS = new Set([
  "blog.google",
  "cdn.akamai.steamstatic.com",
  "storage.googleapis.com",
]);

type NewsRow = {
  id: unknown;
  external_id: unknown;
  slug: unknown;
  title: unknown;
  summary: unknown;
  game_name: unknown;
  category: unknown;
  source_name: unknown;
  source_url: unknown;
  image_url: unknown;
  published_at: unknown;
  is_featured: unknown;
};

type SupabaseConfig = {
  url: string;
  apiKey: string;
  usesLegacyJwt: boolean;
};

function supabaseConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const apiKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  return url && apiKey
    ? { url, apiKey, usesLegacyJwt: apiKey.startsWith("eyJ") }
    : null;
}

function supabaseHeaders(
  config: SupabaseConfig,
  additional: HeadersInit = {},
): HeadersInit {
  return {
    apikey: config.apiKey,
    ...(config.usesLegacyJwt
      ? { authorization: `Bearer ${config.apiKey}` }
      : {}),
    ...additional,
  };
}

function isCategory(value: unknown): value is NewsCategory {
  return newsCategories.includes(value as NewsCategory);
}

function boundedString(
  value: unknown,
  minimum: number,
  maximum: number,
) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length >= minimum && normalized.length <= maximum
    ? normalized
    : null;
}

function safeHttpsUrl(
  value: unknown,
  allowedHosts: ReadonlySet<string>,
  allowEmpty = false,
) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  if (allowEmpty && normalized === "") return "";
  if (normalized.length > MAX_SOURCE_URL_LENGTH) return null;

  try {
    const url = new URL(normalized);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      allowedHosts.has(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function fromRow(row: NewsRow): NewsArticle | null {
  const id = boundedString(row.id, 1, 80);
  const externalId = boundedString(
    row.external_id,
    1,
    MAX_EXTERNAL_ID_LENGTH,
  );
  const slug = boundedString(row.slug, 1, MAX_SLUG_LENGTH);
  const title = boundedString(row.title, 3, 220);
  const summary = boundedString(row.summary, 10, 800);
  const gameName = boundedString(row.game_name, 2, 80);
  const sourceName = boundedString(row.source_name, 2, 120);
  const sourceUrl = safeHttpsUrl(row.source_url, SAFE_SOURCE_HOSTS);
  const imageUrl = safeHttpsUrl(row.image_url, SAFE_IMAGE_HOSTS, true);
  const publishedAt =
    typeof row.published_at === "string"
      ? new Date(row.published_at)
      : new Date(NaN);

  if (
    !id ||
    !externalId ||
    !slug ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    !title ||
    !summary ||
    !gameName ||
    !isCategory(row.category) ||
    !sourceName ||
    sourceUrl === null ||
    imageUrl === null ||
    !Number.isFinite(publishedAt.getTime())
  ) {
    return null;
  }

  return {
    id,
    externalId,
    slug,
    title,
    summary,
    gameName,
    category: row.category,
    sourceName,
    sourceUrl,
    imageUrl,
    publishedAt: publishedAt.toISOString(),
    featured: row.is_featured === true,
  };
}

async function readFromSupabase(limit: number) {
  const config = supabaseConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    select:
      "id,external_id,slug,title,summary,game_name,category,source_name,source_url,image_url,published_at,is_featured",
    status: "eq.published",
    order: "is_featured.desc,editorial_weight.desc,published_at.desc",
    limit: String(limit),
  });

  try {
    const response = await fetch(
      `${config.url}/rest/v1/news_articles?${params.toString()}`,
      {
        headers: supabaseHeaders(config),
        next: { revalidate: 900, tags: ["game-news"] },
        signal: AbortSignal.timeout(4_000),
      },
    );
    if (!response.ok) return null;

    const rows = await readBoundedResponseJson<NewsRow[]>(
      response,
      MAX_SUPABASE_READ_BYTES,
    );
    const articles = Array.isArray(rows)
      ? rows.map(fromRow).filter((item): item is NewsArticle => item !== null)
      : [];
    return articles.length > 0 ? articles : null;
  } catch {
    return null;
  }
}

export async function getLatestNews(requestedLimit = 7) {
  const limit = Math.max(1, Math.min(requestedLimit, MAX_PUBLIC_ITEMS));
  const persisted = await readFromSupabase(limit);
  if (persisted) return persisted;

  try {
    return (await fetchOfficialNews()).slice(0, limit);
  } catch {
    return seedNews.slice(0, limit);
  }
}

export async function persistNewsArticles(articles: NewsArticle[]) {
  const config = supabaseConfig();
  if (!config) {
    throw new Error("Supabase news persistence is not configured");
  }

  const items = articles.slice(0, MAX_PUBLIC_ITEMS).map((article) => ({
    external_id: article.externalId,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    game_name: article.gameName,
    category: article.category,
    source_name: article.sourceName,
    source_url: article.sourceUrl,
    image_url: article.imageUrl,
    published_at: article.publishedAt,
  }));

  const response = await fetch(`${config.url}/rest/v1/rpc/ingest_news_articles`, {
    method: "POST",
    headers: supabaseHeaders(config, {
      "content-type": "application/json",
    }),
    body: JSON.stringify({ items }),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Supabase news ingestion returned ${response.status}`);
  }

  const count = await readBoundedResponseJson<unknown>(
    response,
    MAX_SUPABASE_RPC_BYTES,
  );
  return typeof count === "number" ? count : items.length;
}
