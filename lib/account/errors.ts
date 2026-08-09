export type DatabaseErrorLike = {
  code?: string | null;
};

const MISSING_RELATION_CODES = new Set(["42P01", "PGRST204", "PGRST205"]);

export function isMissingDatabaseRelation(error: DatabaseErrorLike | null) {
  return Boolean(error?.code && MISSING_RELATION_CODES.has(error.code));
}
