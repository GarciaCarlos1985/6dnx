import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath, revalidateTag } from "next/cache";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import {
  DEFAULT_STOREFRONT_CONTENT,
  type StorefrontContent,
  type StorefrontContentAdminRecord,
} from "@/lib/storefront-content/types";

export const STOREFRONT_CONTENT_CACHE_TAG = "storefront-content";

type StorefrontContentRow = {
  id: string;
  hero_headline_lead: string;
  hero_headline_accent: string;
  hero_headline_tail: string;
  hero_support: string;
  hero_reveal_title: string;
  hero_reveal_accent: string;
  hero_reveal_support: string;
  hero_cta_label: string;
  catalog_title: string;
  catalog_description: string;
  continuation_eyebrow: string;
  continuation_title: string;
  revision: number;
  updated_at: string;
};

function isSchemaMissing(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.message?.includes("storefront_content")),
  );
}

function rowToContent(row: StorefrontContentRow): StorefrontContent {
  return {
    heroHeadlineLead: row.hero_headline_lead,
    heroHeadlineAccent: row.hero_headline_accent,
    heroHeadlineTail: row.hero_headline_tail,
    heroSupport: row.hero_support,
    heroRevealTitle: row.hero_reveal_title,
    heroRevealAccent: row.hero_reveal_accent,
    heroRevealSupport: row.hero_reveal_support,
    heroCtaLabel: row.hero_cta_label,
    catalogTitle: row.catalog_title,
    catalogDescription: row.catalog_description,
    continuationEyebrow: row.continuation_eyebrow,
    continuationTitle: row.continuation_title,
  };
}

function contentColumns(content: StorefrontContent) {
  return {
    hero_headline_lead: content.heroHeadlineLead,
    hero_headline_accent: content.heroHeadlineAccent,
    hero_headline_tail: content.heroHeadlineTail,
    hero_support: content.heroSupport,
    hero_reveal_title: content.heroRevealTitle,
    hero_reveal_accent: content.heroRevealAccent,
    hero_reveal_support: content.heroRevealSupport,
    hero_cta_label: content.heroCtaLabel,
    catalog_title: content.catalogTitle,
    catalog_description: content.catalogDescription,
    continuation_eyebrow: content.continuationEyebrow,
    continuation_title: content.continuationTitle,
  };
}

export async function getStorefrontContent(): Promise<StorefrontContent> {
  const config = getPublicSupabaseConfig();
  if (!config) return { ...DEFAULT_STOREFRONT_CONTENT };

  const query = new URL("/rest/v1/storefront_content", config.url);
  query.searchParams.set("select", "*");
  query.searchParams.set("id", "eq.home");
  query.searchParams.set("limit", "1");

  try {
    const response = await fetch(query, {
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
      },
      next: { revalidate: 300, tags: [STOREFRONT_CONTENT_CACHE_TAG] },
    });
    if (!response.ok) return { ...DEFAULT_STOREFRONT_CONTENT };
    const [row] = (await response.json()) as StorefrontContentRow[];
    return row ? rowToContent(row) : { ...DEFAULT_STOREFRONT_CONTENT };
  } catch {
    return { ...DEFAULT_STOREFRONT_CONTENT };
  }
}

export async function getAdminStorefrontContent(
  supabase: SupabaseClient,
): Promise<StorefrontContentAdminRecord> {
  const { data, error } = await supabase
    .from("storefront_content")
    .select("*")
    .eq("id", "home")
    .maybeSingle();

  if (error) {
    return {
      content: { ...DEFAULT_STOREFRONT_CONTENT },
      revision: 1,
      updatedAt: null,
      state: isSchemaMissing(error) ? "schema-missing" : "unavailable",
      message: error.message,
    };
  }

  const row = data as StorefrontContentRow | null;
  return {
    content: row ? rowToContent(row) : { ...DEFAULT_STOREFRONT_CONTENT },
    revision: row?.revision ?? 1,
    updatedAt: row?.updated_at ?? null,
    state: row ? "ready" : "schema-missing",
  };
}

export async function updateAdminStorefrontContent(
  supabase: SupabaseClient,
  content: StorefrontContent,
  expectedRevision: number,
) {
  const { data, error } = await supabase
    .from("storefront_content")
    .update(contentColumns(content))
    .eq("id", "home")
    .eq("revision", expectedRevision)
    .select("*")
    .maybeSingle();

  if (error) return { record: null, error, conflict: false };
  if (!data) return { record: null, error: null, conflict: true };

  revalidateTag(STOREFRONT_CONTENT_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  const row = data as StorefrontContentRow;
  return {
    record: {
      content: rowToContent(row),
      revision: row.revision,
      updatedAt: row.updated_at,
      state: "ready" as const,
    },
    error: null,
    conflict: false,
  };
}
