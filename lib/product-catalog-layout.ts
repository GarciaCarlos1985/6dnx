import type { Product } from "@/lib/products";

const LANDING_PRODUCT_SLUGS = [
  "dayz-private",
  "cs-2",
  "arena-breakout",
] as const;

const FIRST_RIGHT_PRODUCT_SLUGS = [
  "escape-from-tarkov-6DNX-software",
  "rust-6DNX-software",
  "pubg-6DNX-software",
] as const;

export const PINNED_CATALOG_KEYS: readonly string[] = [
  ...LANDING_PRODUCT_SLUGS,
  ...FIRST_RIGHT_PRODUCT_SLUGS,
];

export type ProductCatalogLayout = {
  pages: Product[][];
  defaultPage: number;
  firstRightPage: number;
};

function resolveProducts(
  productsByKey: ReadonlyMap<string, Product>,
  keys: readonly string[],
) {
  return keys.map((key) => {
    const product = productsByKey.get(key);

    if (!product) {
      throw new Error(
        `[product-catalog-layout] Produto obrigatório não encontrado: ${key}`,
      );
    }

    return product;
  });
}

function chunkProducts(products: readonly Product[], perPage: number) {
  const pages: Product[][] = [];

  for (let index = 0; index < products.length; index += perPage) {
    pages.push(products.slice(index, index + perPage));
  }

  return pages;
}

/**
 * Keeps a partial page at the far-left edge so the page immediately before
 * the catalog landing page still presents a complete three-card composition.
 */
function chunkProductsFromEnd(products: readonly Product[], perPage: number) {
  if (products.length === 0) return [];

  const pages: Product[][] = [];
  const firstPageSize = products.length % perPage || perPage;
  pages.push(products.slice(0, firstPageSize));

  for (let index = firstPageSize; index < products.length; index += perPage) {
    pages.push(products.slice(index, index + perPage));
  }

  return pages;
}

export function buildProductCatalogLayout(
  catalog: readonly Product[],
  perPage: number,
): ProductCatalogLayout {
  if (!Number.isInteger(perPage) || perPage < 1) {
    throw new Error(
      "[product-catalog-layout] O tamanho da página deve ser um inteiro positivo.",
    );
  }

  const productsBySlug = new Map(
    catalog.map((product) => [product.slug, product] as const),
  );
  const productsByKey = new Map(
    catalog.map(
      (product) => [product.catalogKey ?? product.slug, product] as const,
    ),
  );

  if (
    productsBySlug.size !== catalog.length ||
    productsByKey.size !== catalog.length
  ) {
    throw new Error(
      "[product-catalog-layout] O catálogo contém identificadores duplicados.",
    );
  }

  const landingProducts = resolveProducts(
    productsByKey,
    LANDING_PRODUCT_SLUGS,
  );
  const firstRightProducts = resolveProducts(
    productsByKey,
    FIRST_RIGHT_PRODUCT_SLUGS,
  );
  const reservedKeys = new Set<string>([
    ...LANDING_PRODUCT_SLUGS,
    ...FIRST_RIGHT_PRODUCT_SLUGS,
  ]);

  const leftDayzProducts = catalog.filter(
    (product) =>
      product.category === "DayZ" &&
      !reservedKeys.has(product.catalogKey ?? product.slug),
  );
  const leftDayzSlugs = new Set(
    leftDayzProducts.map((product) => product.slug),
  );
  const remainingProducts = catalog.filter(
    (product) =>
      !reservedKeys.has(product.catalogKey ?? product.slug) &&
      !leftDayzSlugs.has(product.slug),
  );

  const leftPages = chunkProductsFromEnd(leftDayzProducts, perPage);
  const defaultPage = leftPages.length;
  const firstRightPage = defaultPage + 1;
  const pages = [
    ...leftPages,
    landingProducts,
    firstRightProducts,
    ...chunkProducts(remainingProducts, perPage),
  ];

  const arrangedSlugs = pages.flatMap((page) =>
    page.map((product) => product.slug),
  );

  if (
    arrangedSlugs.length !== catalog.length ||
    new Set(arrangedSlugs).size !== catalog.length
  ) {
    throw new Error(
      "[product-catalog-layout] A paginação perdeu ou duplicou produtos.",
    );
  }

  return {
    pages,
    defaultPage,
    firstRightPage,
  };
}
