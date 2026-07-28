export const newsCategories = ["release", "update", "community", "ai"] as const;

export type NewsCategory = (typeof newsCategories)[number];

export type NewsArticle = {
  id: string;
  externalId: string;
  slug: string;
  title: string;
  summary: string;
  gameName: string;
  category: NewsCategory;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;
  publishedAt: string;
  featured: boolean;
};

export const categoryLabels: Record<NewsCategory, string> = {
  release: "Lançamento",
  update: "Atualização",
  community: "Comunidade",
  ai: "Inteligência artificial",
};
