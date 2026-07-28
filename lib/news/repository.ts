import "server-only";

import { fetchOfficialNews } from "@/lib/news/sources";
import { seedNews } from "@/lib/news/seed";
import {
  newsCategories,
  type NewsArticle,
  type NewsCategory,
} from "@/lib/news/types";

const MAX_PUBLIC_ITEMS = 24;

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

function fromRow(row: NewsRow): NewsArticle | null {
  if (
    typeof row.id !== "string" ||
    typeof row.external_id !== "string" ||
    typeof row.slug !== "string" ||
    typeof row.title !== "string" ||
    typeof row.summary !== "string" ||
    typeof row.game_name !== "string" ||
    !isCategory(row.category) ||
    typeof row.source_name !== "string" ||
    typeof row.source_url !== "string" ||
    typeof row.image_url !== "string" ||
    typeof row.published_at !== "string"
  ) {
    return null;
  }

  return {
    id: row.id,
    externalId: row.external_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    gameName: row.game_name,
    category: row.category,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    imageUrl: row.image_url,
    publishedAt: row.published_at,
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

    const rows = (await response.json()) as NewsRow[];
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

  const count = (await response.json()) as unknown;
  return typeof count === "number" ? count : items.length;
}
