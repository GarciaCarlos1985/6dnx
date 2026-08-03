import "server-only";

import { checkoutActivationState } from "@/lib/checkout/activation";
import { parseStormBaseUrl } from "@/lib/checkout/storm-contract";

export type CheckoutRuntimeConfig = {
  stormBaseUrl: string;
  stormApiKey: string;
  checkoutHashSecret: string;
  supabaseUrl: string;
  supabaseSecretKey: string;
};

export type StormWebhookConfig = Pick<
  CheckoutRuntimeConfig,
  "supabaseUrl" | "supabaseSecretKey"
> & {
  webhookSecret: string;
};

export type CheckoutReadinessCode =
  | "disabled"
  | "production-not-approved"
  | "storm-url-invalid"
  | "storm-key-missing"
  | "hash-secret-missing"
  | "database-missing";

export class CheckoutConfigError extends Error {
  constructor(readonly code: CheckoutReadinessCode) {
    super("Checkout PIX indisponível");
    this.name = "CheckoutConfigError";
  }
}

function validSupabaseUrl(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

function databaseConfig() {
  const supabaseUrl = validSupabaseUrl(process.env.SUPABASE_URL);
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return supabaseUrl && supabaseSecretKey
    ? { supabaseUrl, supabaseSecretKey }
    : null;
}

function hashSecret() {
  const secret = process.env.CHECKOUT_DATA_HASH_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

function observationConfig():
  | { ready: true; config: CheckoutRuntimeConfig }
  | { ready: false; code: CheckoutReadinessCode } {
  const stormBaseUrl = parseStormBaseUrl(process.env.STORM_WALLET_API_URL);
  if (!stormBaseUrl) return { ready: false, code: "storm-url-invalid" };

  const stormApiKey = process.env.STORM_WALLET_API_KEY?.trim();
  if (!stormApiKey || stormApiKey.length < 16 || stormApiKey.length > 512) {
    return { ready: false, code: "storm-key-missing" };
  }

  const checkoutHashSecret = hashSecret();
  if (!checkoutHashSecret) {
    return { ready: false, code: "hash-secret-missing" };
  }

  const database = databaseConfig();
  if (!database) return { ready: false, code: "database-missing" };

  return {
    ready: true,
    config: {
      stormBaseUrl,
      stormApiKey,
      checkoutHashSecret,
      ...database,
    },
  };
}

export function checkoutReadiness():
  | { ready: true; config: CheckoutRuntimeConfig }
  | { ready: false; code: CheckoutReadinessCode } {
  const activation = checkoutActivationState({
    checkoutEnabled: process.env.STORM_WALLET_CHECKOUT_ENABLED,
    productionApproved: process.env.STORM_WALLET_PRODUCTION_APPROVED,
    vercelEnv: process.env.VERCEL_ENV,
  });
  if (activation !== "enabled") return { ready: false, code: activation };

  return observationConfig();
}

export function getCheckoutRuntimeConfig() {
  const readiness = checkoutReadiness();
  if (!readiness.ready) throw new CheckoutConfigError(readiness.code);
  return readiness.config;
}

export function getCheckoutObservationConfig() {
  const readiness = observationConfig();
  if (!readiness.ready) throw new CheckoutConfigError(readiness.code);
  return readiness.config;
}

export function getStormWebhookConfig(): StormWebhookConfig | null {
  const webhookSecret = process.env.STORM_WALLET_WEBHOOK_SECRET?.trim();
  const database = databaseConfig();
  if (!webhookSecret || webhookSecret.length < 16 || !database) {
    return null;
  }
  return { webhookSecret, ...database };
}
