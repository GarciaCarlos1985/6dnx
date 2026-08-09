import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminRewardUser,
  AdminRewardUserList,
  RewardAdjustment,
} from "@/lib/rewards/types";

type RewardUserRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  discord_display_name: string | null;
  slot_balance: number | string | null;
  community_balance: number | string | null;
  latest_activity: string;
};

function isSchemaMissing(error: { code?: string } | null) {
  return Boolean(
    error &&
      (error.code === "42P01" ||
        error.code === "PGRST202" ||
        error.code === "PGRST204" ||
        error.code === "PGRST205"),
  );
}

function mapUser(row: RewardUserRow): AdminRewardUser {
  return {
    userId: row.user_id,
    email: row.email ?? "E-mail indisponível",
    displayName: row.display_name ?? row.email?.split("@")[0] ?? "Usuário 6DNX",
    discordDisplayName: row.discord_display_name,
    balances: {
      slot: Number(row.slot_balance ?? 0),
      community: Number(row.community_balance ?? 0),
    },
    latestActivity: row.latest_activity,
  };
}

export async function listAdminRewardUsers(
  supabase: SupabaseClient,
  query = "",
): Promise<AdminRewardUserList> {
  const { data, error } = await supabase.rpc("admin_list_loyalty_users", {
    p_query: query.trim() || null,
    p_limit: 80,
  });

  if (error) {
    return {
      users: [],
      state: isSchemaMissing(error)
        ? "schema-missing"
        : error.code === "42501" && error.message?.includes("aal2")
          ? "mfa-required"
          : "unavailable",
      message: error.message,
    };
  }

  return {
    users: ((data ?? []) as RewardUserRow[]).map(mapUser),
    state: "ready",
  };
}

export async function adjustAdminRewardBalance(
  supabase: SupabaseClient,
  adjustment: RewardAdjustment,
) {
  const { data, error } = await supabase.rpc("admin_adjust_loyalty_wallet", {
    p_user_id: adjustment.userId,
    p_wallet: adjustment.wallet,
    p_delta: adjustment.delta,
    p_reason: adjustment.reason,
    p_note: adjustment.note,
    p_request_id: adjustment.requestId,
  });

  return {
    result: Array.isArray(data) ? data[0] : data,
    error,
    schemaMissing: isSchemaMissing(error),
  };
}
