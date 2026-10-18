import { ORDER_ID_PATTERN } from "../guides/access.ts";

export function safeAccountReturn(value: unknown, fallback = "/conta") {
  if (value === "/conta" || value === "/") return value;
  if (typeof value !== "string") return fallback;
  const match = /^\/conta\/pedidos\/([^/]+)\/guia$/.exec(value);
  return match && ORDER_ID_PATTERN.test(match[1]) ? value : fallback;
}
