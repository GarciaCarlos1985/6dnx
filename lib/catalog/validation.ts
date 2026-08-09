import type {
  Product,
  ProductFeature,
  ProductStatus,
  ProductTheme,
  Variant,
} from "@/lib/products";
import {
  MAX_PRODUCT_DEMO_IMAGES,
  MAX_PRODUCT_VARIANTS,
  variantAvailabilityStates,
} from "@/lib/products";
import {
  catalogPublicationStates,
  type CatalogMutation,
  type CatalogPublicationState,
} from "@/lib/catalog/types";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const MAX_FEATURES = 40;
const MAX_TUTORIAL_STEPS = 80;

function parseDemoImages(value: unknown, errors: string[]) {
  if (!Array.isArray(value)) {
    errors.push("Galeria demonstrativa deve ser uma lista.");
    return [];
  }
  if (value.length > MAX_PRODUCT_DEMO_IMAGES) {
    errors.push(
      `A galeria aceita no máximo ${MAX_PRODUCT_DEMO_IMAGES} imagens.`,
    );
  }
  return value.slice(0, MAX_PRODUCT_DEMO_IMAGES).flatMap((entry, index) => {
    const image = optionalText(
      entry,
      `Imagem demonstrativa ${index + 1}`,
      500,
      errors,
    );
    if (!image) return [];
    if (!image.startsWith("/") && !image.startsWith("https://")) {
      errors.push(
        `Imagem demonstrativa ${index + 1} deve ser um caminho do site ou uma URL HTTPS.`,
      );
      return [];
    }
    return [image];
  });
}

type RecordLike = Record<string, unknown>;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is RecordLike {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requiredText(
  value: unknown,
  label: string,
  maxLength: number,
  errors: string[],
) {
  if (typeof value !== "string") {
    errors.push(`${label} é obrigatório.`);
    return "";
  }

  const normalized = value.trim();
  if (!normalized) errors.push(`${label} é obrigatório.`);
  if (normalized.length > maxLength) {
    errors.push(`${label} deve ter no máximo ${maxLength} caracteres.`);
  }
  return normalized.slice(0, maxLength);
}

function optionalText(
  value: unknown,
  label: string,
  maxLength: number,
  errors: string[],
) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    errors.push(`${label} deve ser um texto.`);
    return undefined;
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    errors.push(`${label} deve ter no máximo ${maxLength} caracteres.`);
  }
  return normalized.slice(0, maxLength) || undefined;
}

function boundedText(
  value: unknown,
  label: string,
  maxLength: number,
  errors: string[],
) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    errors.push(`${label} deve ser um texto.`);
    return "";
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    errors.push(`${label} deve ter no máximo ${maxLength} caracteres.`);
  }
  return normalized.slice(0, maxLength);
}

function parseFeatureList(
  value: unknown,
  label: string,
  errors: string[],
): ProductFeature[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors.push(`${label} deve ser uma lista.`);
    return undefined;
  }
  if (value.length > MAX_FEATURES) {
    errors.push(`${label} aceita no máximo ${MAX_FEATURES} itens.`);
  }

  const items = value.slice(0, MAX_FEATURES).flatMap((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`${label}: item ${index + 1} inválido.`);
      return [];
    }
    const itemErrors: string[] = [];
    const feature = {
      label: requiredText(
        entry.label,
        `${label}, nome do item ${index + 1}`,
        80,
        itemErrors,
      ),
      value: boundedText(
        entry.value,
        `${label}, valor do item ${index + 1}`,
        240,
        itemErrors,
      ),
    };
    errors.push(...itemErrors);
    return itemErrors.length ? [] : [feature];
  });

  return items.length ? items : undefined;
}

function parseVariants(value: unknown, errors: string[]): Variant[] {
  if (!Array.isArray(value)) {
    errors.push("Variações deve ser uma lista.");
    return [];
  }
  if (value.length > MAX_PRODUCT_VARIANTS) {
    errors.push(
      `São permitidas no máximo ${MAX_PRODUCT_VARIANTS} variações.`,
    );
  }

  const seenNames = new Set<string>();
  const variants = value.slice(0, MAX_PRODUCT_VARIANTS).flatMap((entry, index) => {
    if (!isRecord(entry)) {
      errors.push(`Variação ${index + 1} inválida.`);
      return [];
    }

    const itemErrors: string[] = [];
    const name = requiredText(
      entry.name,
      `Nome da variação ${index + 1}`,
      80,
      itemErrors,
    );
    const normalizedName = name.toLocaleLowerCase("pt-BR");
    if (normalizedName && seenNames.has(normalizedName)) {
      itemErrors.push(`A variação “${name}” está duplicada.`);
    }
    seenNames.add(normalizedName);

    let priceBRL: number | undefined;
    if (
      entry.priceBRL !== undefined &&
      entry.priceBRL !== null &&
      entry.priceBRL !== ""
    ) {
      const numericPrice = Number(entry.priceBRL);
      if (
        !Number.isFinite(numericPrice) ||
        numericPrice < 0 ||
        numericPrice > 1_000_000
      ) {
        itemErrors.push(
          `Preço da variação ${index + 1} deve estar entre R$ 0,00 e R$ 1.000.000,00.`,
        );
      } else {
        priceBRL = Math.round(numericPrice * 100) / 100;
      }
    }

    let availability: Variant["availability"];
    if (entry.availability !== undefined) {
      if (
        typeof entry.availability !== "string" ||
        !variantAvailabilityStates.includes(
          entry.availability as NonNullable<Variant["availability"]>,
        )
      ) {
        itemErrors.push(
          `Disponibilidade da variação ${index + 1} é inválida.`,
        );
      } else {
        availability = entry.availability as NonNullable<
          Variant["availability"]
        >;
      }
    }

    let highlighted: boolean | undefined;
    if (entry.highlighted !== undefined) {
      if (typeof entry.highlighted !== "boolean") {
        itemErrors.push(`Destaque da variação ${index + 1} é inválido.`);
      } else if (entry.highlighted) {
        highlighted = true;
      }
    }

    const accentColor = optionalText(
      entry.accentColor,
      `Cor da variação ${index + 1}`,
      7,
      itemErrors,
    );
    if (accentColor && !HEX_COLOR_PATTERN.test(accentColor)) {
      itemErrors.push(
        `Cor da variação ${index + 1} deve usar o formato #RRGGBB.`,
      );
    }

    const variant: Variant = {
      name,
      note: optionalText(
        entry.note,
        `Observação da variação ${index + 1}`,
        180,
        itemErrors,
      ),
      priceBRL,
      badge: optionalText(
        entry.badge,
        `Selo da variação ${index + 1}`,
        40,
        itemErrors,
      ),
      ...(availability ? { availability } : {}),
      ...(highlighted ? { highlighted } : {}),
      ...(accentColor && HEX_COLOR_PATTERN.test(accentColor)
        ? { accentColor: accentColor.toLowerCase() }
        : {}),
    };
    errors.push(...itemErrors);
    return itemErrors.length ? [] : [variant];
  });

  if (variants.filter((variant) => variant.highlighted).length > 1) {
    errors.push("Somente uma variação pode ficar em destaque por card.");
  }
  return variants;
}

function parseTutorialSteps(
  value: unknown,
  errors: string[],
): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    errors.push("Tutorial deve ser uma lista de passos.");
    return undefined;
  }
  if (value.length > MAX_TUTORIAL_STEPS) {
    errors.push(`Tutorial aceita no máximo ${MAX_TUTORIAL_STEPS} passos.`);
  }

  const steps = value.slice(0, MAX_TUTORIAL_STEPS).flatMap((entry, index) => {
    if (typeof entry !== "string") {
      errors.push(`Passo ${index + 1} do tutorial é inválido.`);
      return [];
    }
    const normalized = entry.trim();
    if (!normalized) return [];
    if (normalized.length > 500) {
      errors.push(`Passo ${index + 1} deve ter no máximo 500 caracteres.`);
    }
    return [normalized.slice(0, 500)];
  });

  return steps.length ? steps : undefined;
}

function parseTheme(value: unknown, errors: string[]): ProductTheme {
  const theme = isRecord(value) ? value : {};
  const accentColor =
    typeof theme.accentColor === "string"
      ? theme.accentColor.trim()
      : "#e3062c";
  const textColor =
    typeof theme.textColor === "string" ? theme.textColor.trim() : "#f7f3f4";
  const surfaceColor =
    typeof theme.surfaceColor === "string"
      ? theme.surfaceColor.trim()
      : "#0b0708";

  if (!HEX_COLOR_PATTERN.test(accentColor)) {
    errors.push("A cor de destaque deve usar o formato hexadecimal #RRGGBB.");
  }
  if (!HEX_COLOR_PATTERN.test(textColor)) {
    errors.push("A cor do texto deve usar o formato hexadecimal #RRGGBB.");
  }
  if (!HEX_COLOR_PATTERN.test(surfaceColor)) {
    errors.push("A cor do fundo deve usar o formato hexadecimal #RRGGBB.");
  }

  return {
    accentColor: HEX_COLOR_PATTERN.test(accentColor)
      ? accentColor.toLowerCase()
      : "#e3062c",
    textColor: HEX_COLOR_PATTERN.test(textColor)
      ? textColor.toLowerCase()
      : "#f7f3f4",
    surfaceColor: HEX_COLOR_PATTERN.test(surfaceColor)
      ? surfaceColor.toLowerCase()
      : "#0b0708",
  };
}

export function parseProduct(value: unknown): ValidationResult<Product> {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return { ok: false, errors: ["Produto inválido."] };
  }

  const slug = requiredText(value.slug, "Rota do produto", 96, errors);
  if (slug && !SLUG_PATTERN.test(slug)) {
    errors.push(
      "A rota aceita apenas letras, números e hífens, sem espaços.",
    );
  }

  const image = requiredText(value.image, "Thumbnail", 500, errors);
  if (
    image &&
    !image.startsWith("/") &&
    !image.startsWith("https://")
  ) {
    errors.push("Thumbnail deve ser um caminho do site ou uma URL HTTPS.");
  }

  const hasCheckoutBanner = Object.hasOwn(value, "checkoutBanner");
  const checkoutBanner = hasCheckoutBanner
    ? optionalText(
        value.checkoutBanner,
        "Banner vertical do checkout",
        500,
        errors,
      ) ?? null
    : undefined;
  if (
    checkoutBanner &&
    !checkoutBanner.startsWith("/") &&
    !checkoutBanner.startsWith("https://")
  ) {
    errors.push(
      "Banner do checkout deve ser um caminho do site ou uma URL HTTPS.",
    );
  }
  const hasDemoImages = Object.hasOwn(value, "demoImages");
  const demoImages = hasDemoImages
    ? parseDemoImages(value.demoImages, errors)
    : undefined;

  const status: ProductStatus =
    value.status === "custom" || value.status === "sold-out"
      ? value.status
      : "available";
  if (
    value.status !== "custom" &&
    value.status !== "available" &&
    value.status !== "sold-out"
  ) {
    errors.push("Status comercial inválido.");
  }

  const youtubeId = optionalText(
    value.youtubeId,
    "ID do vídeo do YouTube",
    20,
    errors,
  );
  if (youtubeId && !YOUTUBE_ID_PATTERN.test(youtubeId)) {
    errors.push("Informe somente o ID de 11 caracteres do vídeo do YouTube.");
  }

  const videoOrientation =
    value.videoOrientation === "portrait" ? "portrait" : "landscape";
  if (
    value.videoOrientation !== undefined &&
    value.videoOrientation !== "portrait" &&
    value.videoOrientation !== "landscape"
  ) {
    errors.push("Orientação do vídeo inválida.");
  }

  const product: Product = {
    slug,
    title: requiredText(value.title, "Título", 100, errors),
    category: requiredText(value.category, "Categoria", 80, errors),
    tagline: requiredText(value.tagline, "Subtítulo", 160, errors),
    description: boundedText(value.description, "Descrição", 4_000, errors),
    features: parseFeatureList(value.features, "Recursos", errors),
    systemSupport: parseFeatureList(
      value.systemSupport,
      "Compatibilidade",
      errors,
    ),
    menuKeys: parseFeatureList(value.menuKeys, "Teclas do menu", errors),
    tutorialSteps: parseTutorialSteps(value.tutorialSteps, errors),
    image,
    ...(hasCheckoutBanner ? { checkoutBanner } : {}),
    ...(hasDemoImages ? { demoImages } : {}),
    status,
    variants: parseVariants(value.variants, errors),
    youtubeId,
    videoOrientation,
    theme: parseTheme(value.theme, errors),
  };

  return errors.length ? { ok: false, errors } : { ok: true, value: product };
}

export function parseCatalogMutation(
  value: unknown,
): ValidationResult<CatalogMutation> {
  if (!isRecord(value)) {
    return { ok: false, errors: ["Alteração inválida."] };
  }

  const errors: string[] = [];
  const productResult = parseProduct(value.product);
  if (!productResult.ok) errors.push(...productResult.errors);

  const publicationState = catalogPublicationStates.includes(
    value.publicationState as CatalogPublicationState,
  )
    ? (value.publicationState as CatalogPublicationState)
    : null;
  if (!publicationState) errors.push("Estado de publicação inválido.");

  const catalogOrder = Number(value.catalogOrder);
  if (
    !Number.isInteger(catalogOrder) ||
    catalogOrder < 0 ||
    catalogOrder > 9_999
  ) {
    errors.push("A ordem do catálogo deve ser um inteiro entre 0 e 9999.");
  }

  let expectedRevision: number | undefined;
  if (value.expectedRevision !== undefined) {
    const revision = Number(value.expectedRevision);
    if (!Number.isInteger(revision) || revision < 1) {
      errors.push("Revisão esperada inválida.");
    } else {
      expectedRevision = revision;
    }
  }

  const changeNote = optionalText(
    value.changeNote,
    "Nota da alteração",
    240,
    errors,
  );

  if (errors.length || !productResult.ok || !publicationState) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      product: productResult.value,
      publicationState,
      catalogOrder,
      expectedRevision,
      changeNote,
    },
  };
}

export function isAllowedProductImage(
  image: string,
  supabaseUrl?: string,
) {
  if (image.startsWith("/") && !image.startsWith("//")) return true;

  try {
    const parsed = new URL(image);
    if (!supabaseUrl) return false;
    const expectedOrigin = new URL(supabaseUrl).origin;
    const productAssetsPath =
      "/storage/v1/object/public/product-assets/";

    return (
      parsed.protocol === "https:" &&
      parsed.origin === expectedOrigin &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.search === "" &&
      parsed.hash === "" &&
      parsed.pathname.startsWith(productAssetsPath) &&
      parsed.pathname.length > productAssetsPath.length
    );
  } catch {
    return false;
  }
}
