/* eslint-disable @typescript-eslint/no-require-imports -- Offline CommonJS catalog generator. */
const fs = require('fs');

const parsedProducts = JSON.parse(fs.readFileSync('parsed_products.json', 'utf8'));
const mapaContent = fs.readFileSync('docs/MAPA_EDITORIAL_31_ENTRADAS.md', 'utf8');
const userData = JSON.parse(fs.readFileSync('parsed_user_data.json', 'utf8'));

const mapRegex = /\| (P\d{2}) \|\s*\d+ \| (.*?)\s*\| (C\d{2}) \| (.*?)\s*\|/g;
const categoryMap = {};

let match;
while ((match = mapRegex.exec(mapaContent)) !== null) {
  const originalTitle = match[2].trim();
  const category = match[4].trim();
  categoryMap[originalTitle] = category;
}

const images = [
  "/products/card-art/performance-audit-6dnx.webp",
  "/products/card-art/game-setup-pro-6dnx.webp",
  "/products/card-art/aim-training-lab-6dnx.webp",
  "/products/card-art/creator-identity-pack-6dnx.webp",
  "/products/card-art/steam-profile-6dnx.webp",
  "/products/card-art/reshades-6dnx.webp",
  "/products/card-art/stream-studio-6dnx.webp"
];

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function parseDescriptionText(descText) {
  const data = {
    features: [],
    systemSupport: [],
    menuKeys: [],
    tutorialSteps: []
  };

  if (!descText) return data;

  const lines = descText.split('\n').map(l => l.trim()).filter(Boolean);
  
  let currentContext = 'none';

  for (const line of lines) {
    if (line.includes('Premium Features Included:') || line.includes('Drivers: Sim') || line.includes('Stream Protected')) {
      currentContext = 'features';
    }
    if (line.includes('System Support Plataforma:') || line.includes('Sistema Operacional:')) {
      currentContext = 'system';
    }
    if (line.includes('Teclas do Menu')) {
      currentContext = 'menu';
    }
    if (line.includes('Tutorial de Inicialização') || line.includes('Program Initialization:') || line.includes('Discord Initialize:')) {
      currentContext = 'tutorial';
    }
    if (line.includes('Links Relacionados') || line.includes('6DNX - TUTORIAL') || line.includes('Abre em uma nova janela')) {
      currentContext = 'ignore';
    }

    if (currentContext === 'features') {
      const parts = line.split(':');
      if (parts.length >= 2) {
        data.features.push({ label: parts[0].trim(), value: parts[1].trim() });
      }
    } else if (currentContext === 'system') {
      const parts = line.split(':');
      if (parts.length >= 2) {
        data.systemSupport.push({ label: parts[0].replace('System Support ', '').trim(), value: parts[1].trim() });
      }
    } else if (currentContext === 'menu') {
      // Ex: "🔴 END: Fecha a aplicação + limpa rastros"
      const parts = line.split(':');
      if (parts.length >= 2) {
        let keyLabel = parts[0].replace('Teclas do Menu', '').trim();
        let action = parts[1].trim();
        data.menuKeys.push({ label: keyLabel, value: action });
      }
    } else if (currentContext === 'tutorial') {
      if (!line.includes('Tutorial de') && !line.includes('Initialize') && !line.includes('Program Initialization:')) {
        data.tutorialSteps.push(line);
      }
    }
  }

  // Se não extraiu features estruturadas (produto não padrão), guarda o texto limpo como fallback
  if (data.features.length === 0 && data.systemSupport.length === 0) {
    data.rawDescription = descText;
  }

  return data;
}

const finalProducts = parsedProducts.map((p, index) => {
  let matchedCategory = 'Geral';
  for (const [title, cat] of Object.entries(categoryMap)) {
    if (title.includes(p.title) || p.title.includes(title)) {
      matchedCategory = cat;
      break;
    }
  }

  let overrides = userData[p.title] || { variants: [], youtubeId: 'BqPwa1SXowE' };
  
  const parsedData = parseDescriptionText(p.description);

  return {
    slug: generateSlug(p.title),
    title: p.title,
    category: matchedCategory,
    tagline: p.title + ' Acesso',
    description: parsedData.rawDescription || '', 
    features: parsedData.features,
    systemSupport: parsedData.systemSupport,
    menuKeys: parsedData.menuKeys,
    tutorialSteps: parsedData.tutorialSteps,
    image: images[index % images.length],
    status: 'available',
    variants: overrides.variants && overrides.variants.length > 0 ? overrides.variants : p.variants,
    youtubeId: overrides.youtubeId || 'BqPwa1SXowE',
  };
});

let output = `export type ProductStatus = "available" | "custom";

export type Variant = {
  name: string;
  note?: string;
  /**
   * Valor de referência em R$ para montagem da vitrine.
   * Não deve ser usado como cobrança real sem validação comercial.
   */
  priceBRL?: number;
  badge?: string;
};

export type ProductFeature = {
  label: string;
  value: string;
};

export type Product = {
  slug: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  features?: ProductFeature[];
  systemSupport?: ProductFeature[];
  menuKeys?: ProductFeature[];
  tutorialSteps?: string[];
  image: string;
  status: ProductStatus;
  variants: Variant[];
  /** ID do vídeo do YouTube (o trecho depois de \`v=\`), quando disponível. */
  youtubeId?: string;
  videoOrientation?: "landscape" | "portrait";
};

export const products: Product[] = ${JSON.stringify(finalProducts, null, 2)};

export function productStatusLabel(status: ProductStatus) {
  return status === "available" ? "Disponível" : "Sob medida";
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Menor preço de referência definido entre as variações. */
export function priceFrom(product: Product): number | null {
  const prices = product.variants
    .map((variant) => variant.priceBRL)
    .filter((price): price is number => typeof price === "number");
  return prices.length ? Math.min(...prices) : null;
}
`;

fs.writeFileSync('lib/products.ts', output);
console.log('Successfully generated lib/products.ts with structured description fields.');
