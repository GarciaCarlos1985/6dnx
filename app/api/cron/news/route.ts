import { revalidateTag } from "next/cache";
import { persistNewsArticles } from "@/lib/news/repository";
import { fetchOfficialNews } from "@/lib/news/sources";

export const maxDuration = 20;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const articles = await fetchOfficialNews({ fresh: true });
    const sources = articles.reduce<Record<string, number>>((counts, article) => {
      counts[article.sourceName] = (counts[article.sourceName] ?? 0) + 1;
      return counts;
    }, {});
    let persisted = 0;
    let storage: "supabase" | "source-only" = "supabase";
    let persistenceWarning: string | undefined;

    try {
      persisted = await persistNewsArticles(articles);
    } catch (error) {
      storage = "source-only";
      persistenceWarning =
        error instanceof Error ? error.message : "Supabase persistence failed";
      console.error(
        "Notícias coletadas, mas não persistidas no Supabase:",
        error,
      );
    }

    revalidateTag("game-news", "max");

    return Response.json({
      ok: true,
      collected: articles.length,
      sources,
      persisted,
      storage,
      ...(persistenceWarning ? { persistenceWarning } : {}),
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Falha na sincronização de notícias:", error);
    return Response.json(
      { ok: false, error: "News synchronization failed" },
      { status: 503 },
    );
  }
}
