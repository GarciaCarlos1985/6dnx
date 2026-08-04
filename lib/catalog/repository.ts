import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath, revalidateTag } from "next/cache";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";
import { buildProductCatalogLayout } from "@/lib/product-catalog-layout";
import {
  isRustCloneCatalogKey,
  products as staticProducts,
  RUST_CLONE_COUNT,
  RUST_SOURCE_CATALOG_KEY,
  selectMissingRustCloneProducts,
  type Product,
} from "@/lib/products";
import type {
  CatalogAdminItem,
  CatalogBootstrapState,
  CatalogMutation,
  CatalogRevision,
} from "@/lib/catalog/types";
import { parseProduct } from "@/lib/catalog/validation";

export const PRODUCT_CATALOG_CACHE_TAG = "product-catalog";

function revalidatePublicCatalog() {
  revalidateTag(PRODUCT_CATALOG_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
}

type CatalogRow = {
  id: string;
  source_key: string;
  slug: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  features: unknown;
  system_support: unknown;
  menu_keys: unknown;
  tutorial_steps: unknown;
  image: string;
  checkout_banner?: string | null;
  status: string;
  variants: unknown;
  youtube_id: string | null;
  video_orientation: string;
  theme: unknown;
  publication_state: string;
  catalog_order: number;
  revision: number;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type RevisionRow = {
  id: number;
  product_id: string;
  revision: number;
  snapshot: CatalogRow;
  change_note: string | null;
  changed_by: string | null;
  created_at: string;
};

function rowProductCandidate(row: CatalogRow) {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    tagline: row.tagline,
    description: row.description,
    features: row.features,
    systemSupport: row.system_support,
    menuKeys: row.menu_keys,
    tutorialSteps: row.tutorial_steps,
    image: row.image,
    ...(row.checkout_banner !== undefined
      ? { checkoutBanner: row.checkout_banner }
      : {}),
    status: row.status,
    variants: row.variants,
    youtubeId: row.youtube_id ?? undefined,
    videoOrientation: row.video_orientation,
    theme: row.theme,
  };
}

export function catalogRowToAdminItem(row: CatalogRow): CatalogAdminItem | null {
  const parsed = parseProduct(rowProductCandidate(row));
  if (!parsed.ok) return null;

  return {
    id: row.id,
    sourceKey: row.source_key,
    product: { ...parsed.value, catalogKey: row.source_key },
    publicationState:
      row.publication_state === "published" ||
      row.publication_state === "archived"
        ? row.publication_state
        : "draft",
    catalogOrder: row.catalog_order,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function catalogMutationColumns(
  mutation: CatalogMutation,
  sourceKey?: string,
) {
  const { product } = mutation;
  return {
    ...(sourceKey ? { source_key: sourceKey } : {}),
    slug: product.slug,
    title: product.title,
    category: product.category,
    tagline: product.tagline,
    description: product.description,
    features: product.features ?? [],
    system_support: product.systemSupport ?? [],
    menu_keys: product.menuKeys ?? [],
    tutorial_steps: product.tutorialSteps ?? [],
    image: product.image,
    ...(Object.hasOwn(product, "checkoutBanner")
      ? { checkout_banner: product.checkoutBanner ?? null }
      : {}),
    status: product.status,
    variants: product.variants,
    youtube_id: product.youtubeId ?? null,
    video_orientation: product.videoOrientation ?? "landscape",
    theme: product.theme ?? {
      accentColor: "#e3062c",
      textColor: "#f7f3f4",
      surfaceColor: "#0b0708",
    },
    publication_state: mutation.publicationState,
    catalog_order: mutation.catalogOrder,
    last_change_note: mutation.changeNote ?? null,
  };
}

function isSchemaMissing(error: { code?: string; message?: string } | null) {
  return Boolean(
    error &&
      (error.code === "42P01" ||
        error.code === "PGRST205" ||
        error.message?.includes("product_catalog")),
  );
}

function safeStaticCatalog() {
  return staticProducts.map((product) => ({
    ...product,
    catalogKey: product.catalogKey ?? product.slug,
    theme: product.theme ?? {
      accentColor: "#e3062c",
      textColor: "#f7f3f4",
      surfaceColor: "#0b0708",
    },
  }));
}

export async function getPublishedCatalog(): Promise<Product[]> {
  const config = getPublicSupabaseConfig();
  if (!config) return safeStaticCatalog();

  const query = new URL("/rest/v1/product_catalog", config.url);
  query.searchParams.set("select", "*");
  query.searchParams.set("publication_state", "eq.published");
  query.searchParams.set("order", "catalog_order.asc,created_at.asc");

  try {
    const response = await fetch(query, {
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`,
      },
      next: { revalidate: 300, tags: [PRODUCT_CATALOG_CACHE_TAG] },
    });
    if (!response.ok) {
      console.error("Catálogo público indisponível:", response.status);
      return [];
    }

    const rows = (await response.json()) as CatalogRow[];
    const products = rows.flatMap((row) => {
      const item = catalogRowToAdminItem(row);
      return item ? [item.product] : [];
    });

    if (!products.length) return [];
    buildProductCatalogLayout(products, 3);
    return products;
  } catch (error) {
    console.error(
      "Falha ao validar o catálogo público:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return [];
  }
}

export async function listAdminCatalog(
  supabase: SupabaseClient,
): Promise<{
  state: CatalogBootstrapState;
  items: CatalogAdminItem[];
  message?: string;
}> {
  const { data, error } = await supabase
    .from("product_catalog")
    .select("*")
    .order("catalog_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return {
      state: isSchemaMissing(error) ? "schema-missing" : "unavailable",
      items: [],
      message: error.message,
    };
  }

  const items = ((data ?? []) as CatalogRow[]).flatMap((row) => {
    const item = catalogRowToAdminItem(row);
    return item ? [item] : [];
  });
  return { state: items.length ? "ready" : "empty", items };
}

/**
 * Persists one complete published-catalog order through the database RPC.
 * The RPC validates membership and applies every position atomically, so a
 * partial request can never leave the storefront with a half-saved order.
 */
export async function reorderPublishedCatalog(
  supabase: SupabaseClient,
  orderedIds: string[],
) {
  const { error } = await supabase.rpc(
    "reorder_published_product_catalog",
    { p_ordered_ids: orderedIds },
  );
  if (error) return { items: [], error };

  revalidatePublicCatalog();
  const refreshed = await listAdminCatalog(supabase);
  if (refreshed.state !== "ready") {
    return {
      items: refreshed.items,
      error: {
        code: "CATALOG_UNAVAILABLE",
        message:
          refreshed.message ?? "O catálogo não pôde ser recarregado.",
      },
    };
  }

  return { items: refreshed.items, error: null };
}

export async function getAdminProduct(
  supabase: SupabaseClient,
  id: string,
) {
  const { data, error } = await supabase
    .from("product_catalog")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { item: null, error };
  return {
    item: data ? catalogRowToAdminItem(data as CatalogRow) : null,
    error: null,
  };
}

export async function updateAdminProduct(
  supabase: SupabaseClient,
  id: string,
  mutation: CatalogMutation,
) {
  let query = supabase
    .from("product_catalog")
    .update(catalogMutationColumns(mutation))
    .eq("id", id);
  if (mutation.expectedRevision) {
    query = query.eq("revision", mutation.expectedRevision);
  }

  const { data, error } = await query
    .select("*")
    .maybeSingle();
  if (error) return { item: null, error, conflict: false };
  if (!data) {
    return {
      item: null,
      error: null,
      conflict: true,
    };
  }
  revalidatePublicCatalog();
  return {
    item: catalogRowToAdminItem(data as CatalogRow),
    error: null,
    conflict: false,
  };
}

export async function listProductRevisions(
  supabase: SupabaseClient,
  productId: string,
) {
  const { data, error } = await supabase
    .from("product_catalog_revisions")
    .select("*")
    .eq("product_id", productId)
    .order("revision", { ascending: false })
    .limit(30);

  if (error) return { revisions: [], error };
  const revisions = ((data ?? []) as RevisionRow[]).flatMap((row) => {
    const snapshot = catalogRowToAdminItem(row.snapshot);
    if (!snapshot) return [];
    return [
      {
        id: row.id,
        productId: row.product_id,
        revision: row.revision,
        snapshot,
        changeNote: row.change_note,
        changedBy: row.changed_by,
        createdAt: row.created_at,
      } satisfies CatalogRevision,
    ];
  });
  return { revisions, error: null };
}

export function staticCatalogBootstrapRows() {
  return safeStaticCatalog().map((product, index) => {
    const parsed = parseProduct(product);
    if (!parsed.ok) {
      throw new TypeError(
        `Produto estático inválido (${product.slug}): ${parsed.errors.join(" ")}`,
      );
    }

    return {
      sourceKey: product.catalogKey ?? product.slug,
      mutation: {
        product: parsed.value,
        publicationState: "published" as const,
        catalogOrder: index,
        changeNote: "Importação inicial do catálogo estático",
      },
    };
  });
}

export async function bootstrapAdminCatalog(supabase: SupabaseClient) {
  const current = await listAdminCatalog(supabase);
  if (current.state !== "empty") {
    return {
      items: current.items,
      error:
        current.state === "ready"
          ? { message: "O catálogo já foi importado." }
          : { message: current.message ?? "O catálogo não está disponível." },
    };
  }

  let rows: ReturnType<typeof catalogMutationColumns>[];
  try {
    rows = staticCatalogBootstrapRows().map(({ sourceKey, mutation }) =>
      catalogMutationColumns(mutation, sourceKey),
    );
  } catch {
    return {
      items: [],
      error: {
        code: "CATALOG_INVALID",
        message:
          "O catálogo estático possui dados incompatíveis com o painel.",
      },
    };
  }
  const { data, error } = await supabase
    .from("product_catalog")
    .insert(rows)
    .select("*");
  if (error) return { items: [], error };

  const items = ((data ?? []) as CatalogRow[])
    .flatMap((row) => {
      const item = catalogRowToAdminItem(row);
      return item ? [item] : [];
    })
    .sort((a, b) => a.catalogOrder - b.catalogOrder);
  revalidatePublicCatalog();
  return { items, error: null };
}

/**
 * Sincroniza somente as cópias Rust solicitadas. A operação é idempotente:
 * cards existentes nunca são sobrescritos e apenas os identificadores ausentes
 * são anexados ao fim do catálogo.
 */
export async function ensureRustCatalogClones(
  supabase: SupabaseClient,
  requestedCount = 1,
) {
  if (
    !Number.isInteger(requestedCount) ||
    requestedCount < 1 ||
    requestedCount > RUST_CLONE_COUNT
  ) {
    return {
      items: [],
      createdCount: 0,
      error: {
        code: "INVALID_RUST_CLONE_COUNT",
        message: `Escolha entre 1 e ${RUST_CLONE_COUNT} cards por vez.`,
      },
    };
  }

  const current = await listAdminCatalog(supabase);
  if (current.state !== "ready") {
    return {
      items: current.items,
      createdCount: 0,
      error: {
        code: "CATALOG_UNAVAILABLE",
        message: current.message ?? "O catálogo não está disponível.",
      },
    };
  }

  const source = current.items.find(
    (item) => item.sourceKey === RUST_SOURCE_CATALOG_KEY,
  );
  if (!source) {
    return {
      items: current.items,
      createdCount: 0,
      error: {
        code: "RUST_SOURCE_MISSING",
        message: "O card Rust original não foi encontrado.",
      },
    };
  }

  const existingKeys = new Set(current.items.map((item) => item.sourceKey));
  const missingProducts = selectMissingRustCloneProducts(
    source.product,
    existingKeys,
    requestedCount,
  );
  if (!missingProducts.length) {
    return { items: current.items, createdCount: 0, error: null };
  }

  const lastOrder = current.items.reduce(
    (highest, item) => Math.max(highest, item.catalogOrder),
    -1,
  );
  const rows = missingProducts.map((product, index) =>
    catalogMutationColumns(
      {
        product,
        publicationState: "published",
        catalogOrder: lastOrder + index + 1,
        changeNote: `Cópia completa solicitada do Rust: ${product.title}`,
      },
      product.catalogKey ?? product.slug,
    ),
  );

  const { error } = await supabase.from("product_catalog").upsert(rows, {
    onConflict: "source_key",
    ignoreDuplicates: true,
  });
  if (error) {
    return { items: current.items, createdCount: 0, error };
  }

  const refreshed = await listAdminCatalog(supabase);
  if (refreshed.state !== "ready") {
    return {
      items: refreshed.items,
      createdCount: 0,
      error: {
        code: "CATALOG_UNAVAILABLE",
        message: refreshed.message ?? "O catálogo não pôde ser recarregado.",
      },
    };
  }

  const previousCloneCount = current.items.filter((item) =>
    isRustCloneCatalogKey(item.sourceKey),
  ).length;
  const nextCloneCount = refreshed.items.filter((item) =>
    isRustCloneCatalogKey(item.sourceKey),
  ).length;
  revalidatePublicCatalog();
  return {
    items: refreshed.items,
    createdCount: Math.max(0, nextCloneCount - previousCloneCount),
    error: null,
  };
}
