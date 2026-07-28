import "server-only";

import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import type { NewsArticle } from "@/lib/news/types";

const MAX_FEED_BYTES = 1_000_000;
const MAX_ITEMS_PER_FEED = 5;
const MAX_SUMMARY_LENGTH = 360;

type FeedSource = {
  id: "google-ai" | "openai";
  name: string;
  topic: string;
  endpoint: string;
  allowedArticleHosts: ReadonlySet<string>;
  allowedImageHosts: ReadonlySet<string>;
};

const feedSources: readonly FeedSource[] = [
  {
    id: "google-ai",
    name: "Google AI",
    topic: "Google AI",
    endpoint: "https://blog.google/technology/ai/rss/",
    allowedArticleHosts: new Set(["blog.google"]),
    allowedImageHosts: new Set(["storage.googleapis.com", "blog.google"]),
  },
  {
    id: "openai",
    name: "OpenAI",
    topic: "OpenAI",
    endpoint: "https://openai.com/news/rss.xml",
    allowedArticleHosts: new Set(["openai.com", "www.openai.com"]),
    allowedImageHosts: new Set(),
  },
] as const;

type RssItem = {
  title?: unknown;
  description?: unknown;
  link?: unknown;
  guid?: unknown;
  pubDate?: unknown;
  "media:content"?: unknown;
};

type RssPayload = {
  rss?: {
    channel?: {
      item?: RssItem | RssItem[];
    };
  };
};

type FetchOfficialRssOptions = {
  fresh?: boolean;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  parseTagValue: false,
  processEntities: false,
  trimValues: true,
});

function cleanText(value: string) {
  const decoded = value
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  return decoded
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function safeHttpsUrl(value: unknown, allowedHosts: ReadonlySet<string>) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && allowedHosts.has(url.hostname)
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function mediaImage(item: RssItem, source: FeedSource) {
  const candidates = Array.isArray(item["media:content"])
    ? item["media:content"]
    : [item["media:content"]];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      "url" in candidate
    ) {
      const imageUrl = safeHttpsUrl(
        (candidate as { url?: unknown }).url,
        source.allowedImageHosts,
      );
      if (imageUrl) return imageUrl;
    }
  }
  return "";
}

async function readBoundedXml(response: Response) {
  if (!response.body) throw new Error("RSS source returned an empty body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let xml = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_FEED_BYTES) {
        await reader.cancel("RSS feed exceeded the configured byte limit");
        throw new Error("RSS feed exceeded the configured byte limit");
      }
      xml += decoder.decode(value, { stream: true });
    }
    xml += decoder.decode();
    return xml;
  } finally {
    reader.releaseLock();
  }
}

function normalizeItem(
  item: RssItem,
  source: FeedSource,
): NewsArticle | null {
  const title = cleanText(typeof item.title === "string" ? item.title : "");
  const summary = truncate(
    cleanText(
      typeof item.description === "string" ? item.description : "",
    ),
    MAX_SUMMARY_LENGTH,
  );
  const sourceUrl = safeHttpsUrl(item.link, source.allowedArticleHosts);
  const publishedAt =
    typeof item.pubDate === "string" ? new Date(item.pubDate) : new Date(NaN);

  if (
    title.length < 3 ||
    summary.length < 10 ||
    !sourceUrl ||
    !Number.isFinite(publishedAt.getTime())
  ) {
    return null;
  }

  const digest = createHash("sha256")
    .update(`${source.id}:${sourceUrl}`)
    .digest("hex")
    .slice(0, 24);
  const externalId = `rss:${source.id}:${digest}`;

  return {
    id: externalId,
    externalId,
    slug: `${slugify(`${source.topic}-${title}`)}-${digest.slice(0, 8)}`,
    title,
    summary,
    gameName: source.topic,
    category: "ai",
    sourceName: source.name,
    sourceUrl,
    imageUrl: mediaImage(item, source),
    publishedAt: publishedAt.toISOString(),
    featured: false,
  };
}

async function fetchFeed(
  source: FeedSource,
  options: FetchOfficialRssOptions,
) {
  const response = await fetch(source.endpoint, {
    cache: options.fresh ? "no-store" : undefined,
    next: options.fresh
      ? undefined
      : { revalidate: 86_400, tags: ["game-news"] },
    signal: AbortSignal.timeout(8_000),
    headers: {
      accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8",
      "user-agent": "6DNX-News-Radar/1.0 (+https://6dnx.vercel.app)",
    },
  });

  if (!response.ok) {
    throw new Error(`${source.name} RSS returned ${response.status}`);
  }

  const xml = await readBoundedXml(response);
  const payload = parser.parse(xml) as RssPayload;
  const rawItems = payload.rss?.channel?.item;
  const items = Array.isArray(rawItems)
    ? rawItems
    : rawItems
      ? [rawItems]
      : [];

  return items
    .slice(0, MAX_ITEMS_PER_FEED)
    .map((item) => normalizeItem(item, source))
    .filter((item): item is NewsArticle => item !== null);
}

export async function fetchOfficialAiNews(
  options: FetchOfficialRssOptions = {},
) {
  const results = await Promise.allSettled(
    feedSources.map((source) => fetchFeed(source, options)),
  );
  const articles = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  if (articles.length === 0) {
    throw new Error("All official AI RSS sources failed");
  }
  return articles;
}
