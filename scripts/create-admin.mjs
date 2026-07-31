import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseEnv(source) {
  const values = new Map();
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(match[1], value);
  }
  return values;
}

const env = parseEnv(await readFile(resolve(".env.local"), "utf8"));
const url =
  env.get("SUPABASE_URL") || env.get("NEXT_PUBLIC_SUPABASE_URL") || "";
const serviceKey =
  env.get("SUPABASE_SECRET_KEY") ||
  env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  "";
const email = (env.get("ADMIN_BOOTSTRAP_EMAIL") || "").trim().toLowerCase();
const password = env.get("ADMIN_BOOTSTRAP_PASSWORD") || "";

const passwordIsStrong =
  password.length >= 16 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

if (!url || !serviceKey) {
  throw new Error(
    "Configure SUPABASE_URL e SUPABASE_SECRET_KEY em .env.local.",
  );
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Configure ADMIN_BOOTSTRAP_EMAIL com um e-mail válido.");
}
if (!passwordIsStrong) {
  throw new Error(
    "ADMIN_BOOTSTRAP_PASSWORD precisa ter 16+ caracteres, maiúscula, minúscula, número e símbolo.",
  );
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "admin" },
});

if (error) {
  throw new Error(
    error.message.toLowerCase().includes("already")
      ? "Esta conta já existe. Promova-a manualmente conforme docs/ADMIN.md."
      : `Supabase recusou a criação: ${error.message}`,
  );
}

console.log(
  JSON.stringify({
    created: true,
    userId: data.user.id,
    email: data.user.email,
    role: data.user.app_metadata.role,
    next: "Apague ADMIN_BOOTSTRAP_PASSWORD de .env.local e entre em /admin/login.",
  }),
);
