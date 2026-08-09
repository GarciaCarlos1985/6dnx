export const REWARD_WALLETS = ["slot", "community"] as const;

export type RewardWallet = (typeof REWARD_WALLETS)[number];

export const REWARD_REASONS = [
  "manual_credit",
  "manual_debit",
  "purchase_feedback",
  "correction",
] as const;

export type RewardReason = (typeof REWARD_REASONS)[number];

export type RewardBalances = {
  slot: number;
  community: number;
};

export type AdminRewardUser = {
  userId: string;
  email: string;
  displayName: string;
  discordDisplayName: string | null;
  balances: RewardBalances;
  latestActivity: string;
};

export type AdminRewardUserList = {
  users: AdminRewardUser[];
  state: "ready" | "schema-missing" | "mfa-required" | "unavailable";
  message?: string;
};

export type RewardAdjustment = {
  userId: string;
  wallet: RewardWallet;
  delta: number;
  reason: RewardReason;
  note: string | null;
  requestId: string;
};
