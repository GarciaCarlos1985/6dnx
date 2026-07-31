import type { Product } from "@/lib/products";

export const catalogPublicationStates = [
  "draft",
  "published",
  "archived",
] as const;

export type CatalogPublicationState =
  (typeof catalogPublicationStates)[number];

export type CatalogAdminItem = {
  id: string;
  sourceKey: string;
  product: Product;
  publicationState: CatalogPublicationState;
  catalogOrder: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
};

export type CatalogMutation = {
  product: Product;
  publicationState: CatalogPublicationState;
  catalogOrder: number;
  expectedRevision?: number;
  changeNote?: string;
};

export type CatalogRevision = {
  id: number;
  productId: string;
  revision: number;
  snapshot: CatalogAdminItem;
  changeNote: string | null;
  createdAt: string;
  changedBy: string | null;
};

export type CatalogBootstrapState =
  | "ready"
  | "empty"
  | "schema-missing"
  | "unavailable";
