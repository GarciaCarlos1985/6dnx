import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin/auth";
import { noStoreJson, rejectCrossOriginMutation } from "@/lib/admin/api";
import { getAdminProduct } from "@/lib/catalog/repository";
import { saveAdminGuide } from "@/lib/guides/repository";
import { parseGuideMutation } from "@/lib/guides/validation";
import { ORDER_ID_PATTERN } from "@/lib/guides/access";
import {
  BoundedJsonError,
  readBoundedJson,
} from "@/lib/http/read-bounded-json";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const rejected = rejectCrossOriginMutation(request);
  if (rejected) return rejected;
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;
  const { id } = await context.params;
  if (!ORDER_ID_PATTERN.test(id))
    return noStoreJson({ error: "Produto inválido." }, 400);
  let body: unknown;
  try {
    body = await readBoundedJson(request, 128 * 1024);
  } catch (error) {
    if (error instanceof BoundedJsonError)
      return noStoreJson({ error: error.message }, error.status);
    throw error;
  }
  const mutation = parseGuideMutation(body);
  if (!mutation.ok)
    return noStoreJson(
      { error: "Revise o guia.", errors: mutation.errors },
      400,
    );
  const product = await getAdminProduct(auth.supabase, id);
  if (product.error)
    return noStoreJson(
      { error: "Não foi possível consultar o produto. Tente novamente." },
      503,
    );
  if (!product.item)
    return noStoreJson({ error: "Produto não encontrado." }, 404);
  const result = await saveAdminGuide(
    auth.supabase,
    product.item.sourceKey,
    mutation.value,
  );
  if (result.error) {
    const conflict = result.error.code === "40001";
    return noStoreJson(
      {
        error: conflict
          ? "Este guia foi alterado em outra sessão. Recarregue antes de continuar; seu texto ainda está nesta tela."
          : "Não foi possível salvar o guia. Confira a disponibilidade do módulo e tente novamente.",
      },
      conflict ? 409 : 503,
    );
  }
  return noStoreJson({ record: result.record });
}
