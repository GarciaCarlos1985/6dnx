import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { getStorefrontContent } from "@/lib/storefront-content/repository";
import {
  cloneSiteExperience,
  DEFAULT_SITE_EXPERIENCE,
  type SiteExperienceAdminRecord,
  type SiteExperienceConfig,
} from "@/lib/site-experience/types";
import { parseSiteExperienceConfig } from "@/lib/site-experience/validation";

export const SITE_EXPERIENCE_CACHE_TAG = "site-experience";

type PublishedRow = {
  config: unknown;
};

type RpcResult<T> = {
  data: T | null;
  error: { code?: string; message?: string } | null;
};

function schemaMissing(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === "42P01" ||
        error.code === "PGRST202" ||
        error.code === "PGRST205" ||
        error.message?.includes("site_experience_")),
  );
}

async function legacyCompatibleDefaults() {
  const legacyHome = await getStorefrontContent();
  const defaults = cloneSiteExperience(DEFAULT_SITE_EXPERIENCE);
  defaults.home.content = legacyHome;
  return defaults;
}

export async function getSiteExperience(): Promise<SiteExperienceConfig> {
  const config = getPublicSupabaseConfig();
  if (!config) return legacyCompatibleDefaults();

  const query = new URL("/rest/v1/site_experience_published", config.url);
  query.searchParams.set("select", "config");
  query.searchParams.set("id", "eq.site");
  query.searchParams.set("limit", "1");

  try {
    const response = await fetch(query, {
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
      },
      next: { revalidate: 300, tags: [SITE_EXPERIENCE_CACHE_TAG] },
    });
    if (!response.ok) return legacyCompatibleDefaults();
    const [row] = (await response.json()) as PublishedRow[];
    const parsed = parseSiteExperienceConfig(row?.config);
    return parsed.ok ? parsed.value : legacyCompatibleDefaults();
  } catch {
    return legacyCompatibleDefaults();
  }
}

export async function getAdminSiteExperience(
  supabase: SupabaseClient,
): Promise<SiteExperienceAdminRecord> {
  const result = (await supabase.rpc("admin_get_site_experience")) as RpcResult<unknown>;
  if (result.error || !result.data || typeof result.data !== "object") {
    const fallback = await legacyCompatibleDefaults();
    return {
      published: fallback,
      draft: cloneSiteExperience(fallback),
      publishedRevision: 1,
      draftRevision: 1,
      basePublishedRevision: 1,
      updatedAt: null,
      history: [],
      state: schemaMissing(result.error) ? "schema-missing" : "unavailable",
      message: result.error?.message,
    };
  }

  const raw = result.data as Record<string, unknown>;
  const published = parseSiteExperienceConfig(raw.published);
  const draft = parseSiteExperienceConfig(raw.draft);
  if (!published.ok || !draft.ok) {
    const fallback = await legacyCompatibleDefaults();
    return {
      published: fallback,
      draft: cloneSiteExperience(fallback),
      publishedRevision: 1,
      draftRevision: 1,
      basePublishedRevision: 1,
      updatedAt: null,
      history: [],
      state: "unavailable",
      message: "A configuração salva não passou pela validação de segurança.",
    };
  }

  const history = Array.isArray(raw.history)
    ? raw.history.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const item = entry as Record<string, unknown>;
        return Number.isInteger(item.revision) && typeof item.publishedAt === "string"
          ? [{ revision: Number(item.revision), publishedAt: item.publishedAt }]
          : [];
      })
    : [];

  return {
    published: published.value,
    draft: draft.value,
    publishedRevision: Number(raw.publishedRevision),
    draftRevision: Number(raw.draftRevision),
    basePublishedRevision: Number(raw.basePublishedRevision),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
    history,
    state: "ready",
  };
}

export async function saveSiteExperienceDraft(
  supabase: SupabaseClient,
  input: {
    config: SiteExperienceConfig;
    expectedDraftRevision: number;
    expectedPublishedRevision: number;
  },
) {
  return supabase.rpc("save_site_experience_draft", {
    p_config: input.config,
    p_expected_draft_revision: input.expectedDraftRevision,
    p_expected_published_revision: input.expectedPublishedRevision,
  });
}

export async function publishSiteExperience(
  supabase: SupabaseClient,
  input: { expectedDraftRevision: number; expectedPublishedRevision: number },
) {
  return supabase.rpc("publish_site_experience", {
    p_expected_draft_revision: input.expectedDraftRevision,
    p_expected_published_revision: input.expectedPublishedRevision,
  });
}

export async function restoreSiteExperienceRevision(
  supabase: SupabaseClient,
  input: {
    revision: number;
    expectedDraftRevision: number;
    expectedPublishedRevision: number;
  },
) {
  return supabase.rpc("restore_site_experience_revision_to_draft", {
    p_revision: input.revision,
    p_expected_draft_revision: input.expectedDraftRevision,
    p_expected_published_revision: input.expectedPublishedRevision,
  });
}
