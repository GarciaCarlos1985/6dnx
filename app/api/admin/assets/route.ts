import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 256 * 1024;
const MIME_EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

export async function POST(request: NextRequest) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return noStoreJson({ error: "A imagem deve ter no máximo 5 MB." }, 413);
  }

  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const form = await request.formData();
  const file = form.get("file");
  const sourceKey = form.get("sourceKey");
  if (!(file instanceof File) || typeof sourceKey !== "string") {
    return noStoreJson({ error: "Selecione uma imagem válida." }, 400);
  }
  const extension = MIME_EXTENSIONS.get(file.type);
  if (!extension || file.size <= 0 || file.size > MAX_FILE_BYTES) {
    return noStoreJson(
      { error: "Use JPG, PNG, WEBP ou AVIF com no máximo 5 MB." },
      400,
    );
  }

  const safeSourceKey = sourceKey.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 80);
  const path = `products/${safeSourceKey || "custom"}/${randomUUID()}.${extension}`;
  const { error } = await auth.supabase.storage
    .from("product-assets")
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });
  if (error) return databaseErrorResponse(error);

  const { data } = auth.supabase.storage
    .from("product-assets")
    .getPublicUrl(path);
  return noStoreJson({ url: data.publicUrl }, 201);
}
