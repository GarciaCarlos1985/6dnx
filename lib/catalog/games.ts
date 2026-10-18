import type { Product } from "../products.ts";

export function gameSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function productPagePath(product: Pick<Product, "slug">) {
  return `/produtos/${encodeURIComponent(product.slug)}`;
}

export function groupProductsByGame(products: readonly Product[]) {
  const groups = new Map<
    string,
    { slug: string; name: string; products: Product[] }
  >();
  for (const product of products) {
    const name = product.gameName?.trim();
    if (!name) continue;
    const slug = gameSlug(name);
    if (!slug) continue;
    const group = groups.get(slug) ?? { slug, name, products: [] };
    group.products.push(product);
    groups.set(slug, group);
  }
  return [...groups.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}
