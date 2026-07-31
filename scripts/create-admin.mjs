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
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listedUsers, error: listError } =
  await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

if (listError) {
  throw new Error(`Supabase recusou a consulta: ${listError.message}`);
}

const existingUser = listedUsers.users.find(
  (user) => user.email?.trim().toLowerCase() === email,
);

if (existingUser) {
  const { data, error } = await supabase.auth.admin.updateUserById(
    existingUser.id,
    {
      app_metadata: {
        ...existingUser.app_metadata,
        role: "admin",
      },
    },
  );

  if (error) {
    throw new Error(`Supabase recusou a promoção: ${error.message}`);
  }

  console.log(
    JSON.stringify({
      action:
        existingUser.app_metadata.role === "admin"
          ? "already-admin"
          : "promoted",
      role: data.user.app_metadata.role,
      next: "Entre em /admin/login. ADMIN_BOOTSTRAP_PASSWORD não é necessária para uma conta existente.",
    }),
  );
  process.exit(0);
}

if (!passwordIsStrong) {
  throw new Error(
    "Para criar uma conta nova, ADMIN_BOOTSTRAP_PASSWORD precisa ter 16+ caracteres, maiúscula, minúscula, número e símbolo.",
  );
}

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "admin" },
});

if (error) {
  throw new Error(`Supabase recusou a criação: ${error.message}`);
}

console.log(
  JSON.stringify({
    action: "created",
    role: data.user.app_metadata.role,
    next: "Apague ADMIN_BOOTSTRAP_PASSWORD de .env.local e entre em /admin/login.",
  }),
);
