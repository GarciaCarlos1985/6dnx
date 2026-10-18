import Image from "next/image";
import Link from "next/link";
import { productPagePath } from "@/lib/catalog/games";
import {
  formatBRL,
  priceFrom,
  productStatusLabel,
  visibleProductVariants,
  type Product,
} from "@/lib/products";

export function SolutionList({ products }: { products: Product[] }) {
  return (
    <div className="solution-list">
      {products.map((product, index) => {
        const price = priceFrom(product);
        return (
          <Link
            href={productPagePath(product)}
            className="solution-list-item"
            key={product.slug}
            prefetch={false}
          >
            <div className="solution-list-art">
              <Image
                src={product.image}
                alt=""
                fill
                sizes="(max-width: 600px) 90px, 180px"
                loading={index < 2 ? "eager" : "lazy"}
                unoptimized={product.image.startsWith("/products/card-art/")}
              />
            </div>
            <div className="solution-list-copy">
              <span className="solution-list-status">
                {productStatusLabel(product.status)}
              </span>
              <h2>{product.title}</h2>
              <p>{product.tagline}</p>
              <small>
                {visibleProductVariants(product).length} opções ·{" "}
                {product.youtubeId
                  ? "Vídeo disponível"
                  : "Apresentação da solução"}
              </small>
            </div>
            <div className="solution-list-action">
              <span>
                {price !== null
                  ? `A partir de ${formatBRL(price)}`
                  : "Sob consulta"}
              </span>
              <strong>
                Conhecer solução <span aria-hidden="true">→</span>
              </strong>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
