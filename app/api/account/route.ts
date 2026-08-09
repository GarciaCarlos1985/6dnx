import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AccountDatabaseError,
  AccountRepository,
} from "@/lib/account/repository";
import { getAccountDatabaseConfig } from "@/lib/account/config";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "A conta de usuário ainda não está configurada." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json(
      { error: "Faça login para ver sua conta." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const user = data.user;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.preferred_username === "string" && meta.preferred_username) ||
    user.email?.split("@")[0] ||
    "Visitante";

  const config = getAccountDatabaseConfig();
  if (!config) {
    return NextResponse.json(
      { error: "A conta de usuário ainda não está configurada." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const repository = new AccountRepository(config);
    const orders = await repository.listOrdersByUser(user.id);
    let wallets: { slot: number; community: number } | null = null;

    try {
      wallets = await repository.getRewardBalances(user.id);
    } catch (err) {
      // Pedidos são a parte obrigatória da conta. Fidelidade é best-effort
      // enquanto o domínio ainda não foi homologado em todos os ambientes.
      if (!(err instanceof AccountDatabaseError)) throw err;
    }

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, name },
        // Alias retrocompatível consumido pela prévia da Slot.
        balance: wallets?.slot ?? null,
        wallets: {
          slot: wallets?.slot ?? null,
          community: wallets?.community ?? null,
        },
        loyalty: {
          available: wallets !== null,
          status: wallets === null ? "preparing" : "ready",
        },
        orders,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    if (err instanceof AccountDatabaseError) {
      return NextResponse.json(
        { error: "Os dados da sua conta não estão disponíveis." },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }
    throw err;
  }
}
