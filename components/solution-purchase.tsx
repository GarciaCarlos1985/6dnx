"use client";

import { useRef, useState } from "react";
import {
  ProductPurchasePanel,
  useProductSelection,
} from "@/components/product-detail-content";
import { PixCheckoutModal } from "@/components/pix-checkout-modal";
import type { Product } from "@/lib/products";

export function SolutionPurchase({
  product,
  checkoutAvailable,
  paymentTestAvailable,
}: {
  product: Product;
  checkoutAvailable: boolean;
  paymentTestAvailable: boolean;
}) {
  const selection = useProductSelection(product);
  const [checkoutVariantName, setCheckoutVariantName] = useState<string | null>(
    null,
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const variant = product.variants.find(
    (item) => item.name === checkoutVariantName,
  );
  return (
    <>
      <div inert={variant ? true : undefined}>
        <ProductPurchasePanel
          product={product}
          selectedVariant={selection.selectedVariant}
          onPick={selection.selectVariant}
          checkoutAvailable={checkoutAvailable}
          checkoutTriggerRef={triggerRef}
          onCheckout={setCheckoutVariantName}
          supportUrl={`/api/redirect?slug=${encodeURIComponent(product.slug)}`}
        />
        <p className="solution-account-note">
          Já comprou? <a href="/conta">Acesse a orientação na sua conta.</a>
        </p>
      </div>
      {variant ? (
        <PixCheckoutModal
          product={product}
          variant={variant}
          checkoutAvailable={checkoutAvailable}
          paymentTestAvailable={paymentTestAvailable}
          onClose={() => {
            setCheckoutVariantName(null);
            requestAnimationFrame(() => triggerRef.current?.focus());
          }}
        />
      ) : null}
    </>
  );
}
