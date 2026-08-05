import type { CatalogAdminItem, CatalogMutation } from "./types";

function themesMatch(
  current: CatalogAdminItem["product"]["theme"],
  requested: CatalogMutation["product"]["theme"],
) {
  return (
    current?.accentColor === requested?.accentColor &&
    current?.surfaceColor === requested?.surfaceColor &&
    current?.textColor === requested?.textColor
  );
}

/**
 * Campos estruturais nunca fazem parte da edição cotidiana do proprietário.
 * A interface não os mostra e esta política repete a proteção no servidor,
 * porque ocultar um botão no navegador não é uma barreira de segurança.
 */
export function protectedCatalogUpdateErrors(
  current: CatalogAdminItem,
  requested: CatalogMutation,
) {
  const errors: string[] = [];

  if (requested.product.slug !== current.product.slug) {
    errors.push("O identificador interno do produto é protegido.");
  }
  if (!themesMatch(current.product.theme, requested.product.theme)) {
    errors.push("A paleta oficial 6DNX é protegida.");
  }
  if (requested.publicationState !== current.publicationState) {
    errors.push("O estado de publicação não pode ser alterado neste painel.");
  }
  if (requested.catalogOrder !== current.catalogOrder) {
    errors.push("A posição do produto no catálogo é protegida.");
  }
  return errors;
}
