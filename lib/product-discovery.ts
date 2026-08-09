import type { Product } from "@/lib/products";

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

/**
 * Keeps storefront discovery aligned with the live catalog instead of a
 * second, manually maintained category list. Every term must match somewhere
 * in the product's public copy or visible options.
 */
export function productMatchesSearch(product: Product, query: string) {
  const terms = normalizeSearchValue(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const searchableText = normalizeSearchValue(
    [
      product.title,
      product.category,
      product.tagline,
      product.description,
      ...product.variants.flatMap((variant) => [
        variant.name,
        variant.note ?? "",
        variant.badge ?? "",
      ]),
    ].join(" "),
  );

  return terms.every((term) => searchableText.includes(term));
}

export function filterProductShortcuts(
  products: readonly Product[],
  query: string,
) {
  return products.filter((product) => productMatchesSearch(product, query));
}
