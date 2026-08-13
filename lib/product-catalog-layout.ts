import type { Product } from "@/lib/products";

export const CATALOG_CARDS_PER_ROW = 4;
export const CATALOG_VISIBLE_ROWS = 8;
export const CATALOG_INITIAL_VISIBLE_COUNT =
  CATALOG_CARDS_PER_ROW * CATALOG_VISIBLE_ROWS;

export type ProductCatalogLayout = {
  /**
   * Every row owns its own finite sequence of four-card pages. Pages are
   * distributed round-robin so changing one row never duplicates a product
   * already visible in another row.
   */
  rows: Product[][][];
  pageCount: number;
};

function chunkProducts(products: readonly Product[], perPage: number) {
  const pages: Product[][] = [];

  for (let index = 0; index < products.length; index += perPage) {
    pages.push(products.slice(index, index + perPage));
  }

  return pages;
}

/**
 * Converts the canonical catalog order into independent carousel rows.
 *
 * With eight visible rows the first 32 products remain visible together:
 * pages 0..7 become the first page of rows 0..7, pages 8..15 become their
 * second page, and so on. This keeps every product reachable while preserving
 * the admin order as the single source of truth.
 */
export function buildProductCatalogLayout(
  catalog: readonly Product[],
  perPage = CATALOG_CARDS_PER_ROW,
  visibleRows = CATALOG_VISIBLE_ROWS,
): ProductCatalogLayout {
  if (!Number.isInteger(perPage) || perPage < 1) {
    throw new Error(
      "[product-catalog-layout] O tamanho da fileira deve ser um inteiro positivo.",
    );
  }
  if (!Number.isInteger(visibleRows) || visibleRows < 1) {
    throw new Error(
      "[product-catalog-layout] A quantidade de fileiras deve ser um inteiro positivo.",
    );
  }

  const slugs = catalog.map((product) => product.slug);
  const keys = catalog.map((product) => product.catalogKey ?? product.slug);
  if (
    new Set(slugs).size !== catalog.length ||
    new Set(keys).size !== catalog.length
  ) {
    throw new Error(
      "[product-catalog-layout] O catálogo contém identificadores duplicados.",
    );
  }

  const pages = chunkProducts(catalog, perPage);
  const rows = Array.from({ length: visibleRows }, () => [] as Product[][]);
  pages.forEach((page, pageIndex) => {
    rows[pageIndex % visibleRows].push(page);
  });

  const arrangedSlugs = rows
    .flatMap((row) => row)
    .flatMap((page) => page.map((product) => product.slug));
  if (
    arrangedSlugs.length !== catalog.length ||
    new Set(arrangedSlugs).size !== catalog.length
  ) {
    throw new Error(
      "[product-catalog-layout] A paginação perdeu ou duplicou produtos.",
    );
  }

  return {
    rows,
    pageCount: Math.max(0, ...rows.map((row) => row.length)),
  };
}
