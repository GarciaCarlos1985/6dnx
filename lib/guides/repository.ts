import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EMPTY_GUIDE,
  type GuideRecord,
  type GuideMutation,
  type GuideSummary,
} from "./types";
import { parseGuide } from "./validation";

function missingSchema(error: { code?: string } | null) {
  return Boolean(
    error &&
    ["42P01", "PGRST202", "PGRST204", "PGRST205"].includes(error.code ?? ""),
  );
}

export async function getAdminGuide(
  supabase: SupabaseClient,
  sourceKey: string,
): Promise<GuideRecord> {
  const { data, error } = await supabase
    .from("product_solution_guides")
    .select("draft,published,revision,published_at")
    .eq("product_source_key", sourceKey)
    .maybeSingle();
  const fallback: GuideRecord = {
    draft: structuredClone(EMPTY_GUIDE),
    published: null,
    revision: 0,
    publishedAt: null,
    state: "ready",
  };
  if (error)
    return {
      ...fallback,
      state: missingSchema(error) ? "schema-missing" : "unavailable",
    };
  if (!data) return fallback;
  const draft = parseGuide(data.draft);
  const published = data.published ? parseGuide(data.published) : null;
  if (!draft.ok || (published && !published.ok))
    return { ...fallback, state: "unavailable" };
  return {
    draft: draft.value,
    published: published?.ok ? published.value : null,
    revision: data.revision,
    publishedAt: data.published_at,
    state: "ready",
  };
}

export async function listGuideSummaries(
  supabase: SupabaseClient,
): Promise<{ guides: GuideSummary[]; available: boolean }> {
  const { data, error } = await supabase
    .from("product_solution_guides")
    .select("product_source_key,revision,published_at")
    .limit(500);
  return {
    available: !error,
    guides: error
      ? []
      : (data ?? []).map((row) => ({
          productSourceKey: row.product_source_key,
          revision: row.revision,
          publishedAt: row.published_at,
        })),
  };
}

export async function saveAdminGuide(
  supabase: SupabaseClient,
  sourceKey: string,
  mutation: GuideMutation,
) {
  const result = await supabase.rpc("admin_save_solution_guide", {
    p_product_source_key: sourceKey,
    p_expected_revision: mutation.expectedRevision,
    p_action: mutation.action,
    p_guide: mutation.guide,
  });
  if (result.error || !result.data)
    return {
      record: null,
      error: result.error ?? { code: "INVALID_GUIDE_RESULT" },
    };
  const row = result.data as Record<string, unknown>;
  const draft = parseGuide(row.draft);
  const published = row.published ? parseGuide(row.published) : null;
  if (
    !draft.ok ||
    (published && !published.ok) ||
    !Number.isSafeInteger(row.revision)
  ) {
    return { record: null, error: { code: "INVALID_GUIDE_RESULT" } };
  }
  return {
    record: {
      draft: draft.value,
      published: published?.ok ? published.value : null,
      revision: Number(row.revision),
      publishedAt: typeof row.publishedAt === "string" ? row.publishedAt : null,
      state: "ready" as const,
    },
    error: null,
  };
}
