import type { Product } from "@/lib/products";

export const LOCAL_PAYMENT_TEST_PRODUCT_KEY = "rust-1-6dnx-software";
export const LOCAL_PAYMENT_TEST_VARIANT_NAME = "1 Dia";
export const LOCAL_PAYMENT_TEST_AMOUNT_BRL = 1;

/**
 * Prepara uma vitrine de homologação somente para o servidor de desenvolvimento.
 *
 * A identidade imutavel do produto e da variacao permanece igual a do Supabase,
 * portanto o backend ainda resolve uma oferta comercial server-side. Apenas a
 * apresentação local vira "Teste" e o card vai para o início da vitrine.
 */
export function withLocalPaymentTestProduct(
  catalogProducts: readonly Product[],
  enabled: boolean,
): Product[] {
  if (!enabled) return [...catalogProducts];

  const targetIndex = catalogProducts.findIndex(
    (product) =>
      (product.catalogKey ?? product.slug) === LOCAL_PAYMENT_TEST_PRODUCT_KEY,
  );
  if (targetIndex < 0) return [...catalogProducts];

  const target = catalogProducts[targetIndex];
  const sourceVariant = target.variants.find(
    (variant) => variant.name === LOCAL_PAYMENT_TEST_VARIANT_NAME,
  );
  if (!sourceVariant) return [...catalogProducts];

  const testProduct: Product = {
    ...target,
    title: "Teste",
    category: "Homologação PIX",
    tagline: "Pagamento real controlado de R$ 1,00",
    variants: [
      {
        ...sourceVariant,
        priceBRL: LOCAL_PAYMENT_TEST_AMOUNT_BRL,
        badge: "TESTE",
        note: "Oferta temporária para homologação",
      },
    ],
  };

  return [
    testProduct,
    ...catalogProducts.filter((_, index) => index !== targetIndex),
  ];
}
