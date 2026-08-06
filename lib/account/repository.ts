import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type DatabaseConfig = {
  supabaseUrl: string;
  supabaseSecretKey: string;
};

export type AccountOrder = {
  id: string;
  externalId: string;
  productTitle: string;
  variantName: string;
  amountCents: number;
  status: string;
  createdAt: string;
};

export type LoyaltyBalance = {
  balance: number;
};

export class AccountDatabaseError extends Error {
  constructor(
    readonly operation: string,
    readonly databaseCode?: string,
  ) {
    super("Os dados da sua conta não estão disponíveis.");
    this.name = "AccountDatabaseError";
  }
}

function databaseError(operation: string, error: { code?: string } | null) {
  return new AccountDatabaseError(operation, error?.code);
}

export class AccountRepository {
  private readonly client: SupabaseClient;

  constructor(config: DatabaseConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseSecretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { "X-Client-Info": "6dnx-account-server" } },
    });
  }

  /** Pedidos do usuário, do mais recente para o mais antigo. */
  async listOrdersByUser(userId: string): Promise<AccountOrder[]> {
    const result = await this.client
      .from("commerce_orders")
      .select(
        "id, external_id, product_title, variant_name, amount_cents, status, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (result.error) throw databaseError("list-orders", result.error);
    return (result.data ?? []).map((row) => ({
      id: String(row.id),
      externalId: String(row.external_id),
      productTitle: String(row.product_title),
      variantName: String(row.variant_name),
      amountCents: Number(row.amount_cents),
      status: String(row.status),
      createdAt: String(row.created_at),
    }));
  }

  /**
   * Saldo de moedas de fidelidade. Como a coluna/tabela pode ainda não existir
   * (migration versionada, não aplicada) ou o usuário não ter linha, tratamos
   * ausência como saldo 0 em vez de falhar a tela toda.
   */
  async getLoyaltyBalance(userId: string): Promise<number> {
    const result = await this.client
      .from("loyalty_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (result.error && result.error.code === "42P01") {
      // relation does not exist -> migration not applied yet; fail-soft to 0
      return 0;
    }
    if (result.error) throw databaseError("get-balance", result.error);
    return Number(result.data?.balance ?? 0);
  }
}
