import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import {
  databaseErrorResponse,
  noStoreJson,
  rejectCrossOriginMutation,
} from "@/lib/admin/api";
import {
  ACCEPTED_IMAGE_TYPES,
  detectImageType,
  readBoundedBody,
  UploadBodyTooLargeError,
} from "@/lib/security/image-upload";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_FILE_BYTES) {
    return noStoreJson({ error: "A imagem deve ter no máximo 5 MB." }, 413);
  }

  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const declaredType = request.headers.get("content-type")?.toLowerCase();
  const sourceKey = request.headers.get("x-product-source-key");
  const assetSlot =
    request.headers.get("x-asset-slot") === "checkout-banner"
      ? "checkout"
      : "card";
  if (!declaredType || !sourceKey) {
    return noStoreJson({ error: "Selecione uma imagem válida." }, 400);
  }

  let bytes: Uint8Array;
  try {
    bytes = await readBoundedBody(request.body, MAX_FILE_BYTES);
  } catch (error) {
    if (error instanceof UploadBodyTooLargeError) {
      return noStoreJson({ error: "A imagem deve ter no máximo 5 MB." }, 413);
    }
    return noStoreJson({ error: "Não foi possível ler a imagem." }, 400);
  }

  const detectedType = detectImageType(bytes);
  if (!detectedType || detectedType !== declaredType || bytes.length === 0) {
    return noStoreJson(
      {
        error:
          "O conteúdo do arquivo não corresponde a uma imagem JPG, PNG, WEBP ou AVIF válida.",
      },
      400,
    );
  }
  const extension = ACCEPTED_IMAGE_TYPES[detectedType];

  const safeSourceKey = sourceKey.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 80);
  const path = `products/${safeSourceKey || "custom"}/${assetSlot}/${randomUUID()}.${extension}`;
  const { error } = await auth.supabase.storage
    .from("product-assets")
    .upload(path, bytes, {
      cacheControl: "31536000",
      contentType: detectedType,
      upsert: false,
    });
  if (error) return databaseErrorResponse(error);

  const { data } = auth.supabase.storage
    .from("product-assets")
    .getPublicUrl(path);
  return noStoreJson({ url: data.publicUrl }, 201);
}
