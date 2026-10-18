import type { Product } from "../products.ts";
import type { CatalogAdminItem } from "./types.ts";
import { gameSlug } from "./games.ts";
import { parseProduct, type ValidationResult } from "./validation.ts";

export const PRODUCT_PLACEHOLDER = "/products/product-placeholder.svg";
export const CATALOG_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CreateProductInput = {
  requestId: string;
  title: string;
  category: string;
  gameName?: string | null;
  sourceId?: string;
  expectedSourceRevision?: number;
};

export function parseCreateProduct(
  value: unknown,
): ValidationResult<CreateProductInput> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { ok: false, errors: ["Cadastro inválido."] };
  const input = value as Record<string, unknown>;
  const errors: string[] = [];
  if (
    Object.keys(input).some(
      (key) =>
        ![
          "requestId",
          "title",
          "category",
          "gameName",
          "sourceId",
          "expectedSourceRevision",
        ].includes(key),
    )
  )
    errors.push(
      "O cadastro aceita somente nome, categoria, jogo e produto de origem.",
    );
  const text = (key: string, label: string, max: number) => {
    const result = typeof input[key] === "string" ? input[key].trim() : "";
    if (
      !result ||
      result.length > max ||
      /[<>\u0000-\u001f\u007f]/.test(result)
    )
      errors.push(`${label}: informe um texto de até ${max} caracteres.`);
    return result;
  };
  const title = text("title", "Nome do produto", 100);
  const category = text("category", "Categoria", 80);
  const requestId =
    typeof input.requestId === "string" ? input.requestId.toLowerCase() : "";
  if (!CATALOG_UUID.test(requestId))
    errors.push("Identificador do cadastro inválido.");
  let gameName: string | null | undefined;
  if (Object.hasOwn(input, "gameName")) {
    if (input.gameName !== null && typeof input.gameName !== "string")
      errors.push("Jogo inválido.");
    gameName =
      typeof input.gameName === "string" ? input.gameName.trim() || null : null;
    if (
      gameName &&
      (gameName.length > 80 ||
        !gameSlug(gameName) ||
        /[<>\u0000-\u001f\u007f]/.test(gameName))
    )
      errors.push("Informe um nome de jogo legível com até 80 caracteres.");
  }
  const sourceId =
    typeof input.sourceId === "string"
      ? input.sourceId.toLowerCase()
      : undefined;
  if (
    input.sourceId !== undefined &&
    (!sourceId || !CATALOG_UUID.test(sourceId))
  )
    errors.push("Produto de origem inválido.");
  const expectedSourceRevision = input.expectedSourceRevision;
  if (
    sourceId &&
    (!Number.isInteger(expectedSourceRevision) ||
      Number(expectedSourceRevision) < 1)
  )
    errors.push("A revisão do produto original é obrigatória.");
  if (!sourceId && expectedSourceRevision !== undefined)
    errors.push("Revisão de origem sem produto.");
  return errors.length
    ? { ok: false, errors }
    : {
        ok: true,
        value: {
          requestId,
          title,
          category,
          ...(gameName !== undefined ? { gameName } : {}),
          ...(sourceId
            ? {
                sourceId,
                expectedSourceRevision: Number(expectedSourceRevision),
              }
            : {}),
        },
      };
}

export function buildCreatedProduct(
  input: CreateProductInput,
  source?: Product,
): Product {
  const sourceKey = `admin-${input.requestId}`;
  const slug = `${gameSlug(input.title).slice(0, 70).replace(/-+$/, "") || "produto"}-${input.requestId.replaceAll("-", "").slice(0, 12)}`;
  return {
    ...(source
      ? structuredClone(source)
      : {
          description: "",
          image: PRODUCT_PLACEHOLDER,
          status: "available" as const,
          variants: [],
          videoOrientation: "landscape" as const,
          theme: {
            accentColor: "#e3062c",
            textColor: "#f7f3f4",
            surfaceColor: "#0b0708",
          },
        }),
    catalogKey: sourceKey,
    slug,
    title: input.title,
    category: input.category,
    tagline: source?.tagline ?? input.title,
    ...(Object.hasOwn(input, "gameName")
      ? { gameName: input.gameName ?? null }
      : {}),
  };
}

export function catalogPublishErrors(product: Product) {
  const parsed = parseProduct(product);
  const errors = parsed.ok ? [] : [...parsed.errors];
  if (!product.description.trim())
    errors.push("Escreva a descrição do produto.");
  if (!product.image || product.image === PRODUCT_PLACEHOLDER)
    errors.push("Adicione a imagem deste produto na etapa Visual.");
  if (!product.variants.some((variant) => variant.availability !== "archived"))
    errors.push("Cadastre pelo menos um plano ou opção na etapa Variações.");
  return errors;
}

export function demoCreatedItem(
  input: CreateProductInput,
  source?: CatalogAdminItem,
): CatalogAdminItem {
  const now = new Date().toISOString();
  const product = buildCreatedProduct(input, source?.product);
  return {
    id: input.requestId,
    sourceKey: product.catalogKey!,
    product,
    publicationState: "draft",
    catalogOrder: 0,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    updatedBy: null,
  };
}
