import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { persistNewsArticles } from "@/lib/news/repository";
import { fetchOfficialNews } from "@/lib/news/sources";

export const maxDuration = 20;
export const dynamic = "force-dynamic";

function jsonNoStore(payload: unknown, status = 200) {
  return Response.json(payload, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

function hasValidBearer(header: string | null, expected: string) {
  if (!header?.startsWith("Bearer ")) return false;
  const provided = Buffer.from(header.slice(7), "utf8");
  const secret = Buffer.from(expected, "utf8");
  return (
    provided.length === secret.length && timingSafeEqual(provided, secret)
  );
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || !hasValidBearer(authorization, cronSecret)) {
    return jsonNoStore({ ok: false, error: "Unauthorized" }, 401);
  }

  try {
    const articles = await fetchOfficialNews({ fresh: true });
    const sources = articles.reduce<Record<string, number>>((counts, article) => {
      counts[article.sourceName] = (counts[article.sourceName] ?? 0) + 1;
      return counts;
    }, {});
    let persisted = 0;

    try {
      persisted = await persistNewsArticles(articles);
    } catch (error) {
      console.error(
        "Notícias coletadas, mas não persistidas no Supabase:",
        error instanceof Error ? error.name : "UnknownError",
      );
      return jsonNoStore(
        {
          ok: false,
          error: "News persistence failed",
          collected: articles.length,
          sources,
          persisted: 0,
          completedAt: new Date().toISOString(),
        },
        503,
      );
    }

    revalidateTag("game-news", "max");

    return jsonNoStore({
      ok: true,
      collected: articles.length,
      sources,
      persisted,
      storage: "supabase",
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Falha na sincronização de notícias:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return jsonNoStore(
      { ok: false, error: "News synchronization failed" },
      503,
    );
  }
}
