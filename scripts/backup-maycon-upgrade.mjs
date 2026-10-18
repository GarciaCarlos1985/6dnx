import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { parseArgs, parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

export function backupTarget(env, expectedRef) {
  if (!/^[a-z]{20}$/.test(expectedRef ?? ""))
    throw new Error("Informe o projeto esperado.");
  const api = new URL(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL);
  const db = new URL(env.SUPABASE_DB_URL);
  if (
    api.hostname !== `${expectedRef}.supabase.co` ||
    db.hostname !== `db.${expectedRef}.supabase.co`
  )
    throw new Error("O projeto da conexão não corresponde ao 6DNX esperado.");
  if (!db.password || db.pathname !== "/postgres")
    throw new Error("Conexão de backup incompleta.");
  for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"])
    db.searchParams.delete(key);
  return db;
}

const quote = (value) => `"${value.replaceAll('"', '""')}"`;
export async function fingerprintTables(client, tables) {
  const fingerprints = {};
  for (const table of tables) {
    const hash = createHash("sha256");
    let count = 0;
    await client.query(
      `declare backup_rows no scroll cursor for select to_jsonb(row)::text as content from ${quote(table.schema)}.${quote(table.name)} row order by to_jsonb(row)::text collate "C"`,
    );
    try {
      while (true) {
        const batch = await client.query("fetch forward 128 from backup_rows");
        if (!batch.rows.length) break;
        for (const row of batch.rows) {
          hash.update(row.content);
          hash.update("\n");
          count++;
        }
      }
    } finally {
      await client.query("close backup_rows");
    }
    fingerprints[`${table.schema}.${table.name}`] = {
      count,
      sha256: hash.digest("hex"),
    };
  }
  return fingerprints;
}

export async function fileDigest(filename) {
  const hash = createHash("sha256");
  for await (const bytes of createReadStream(filename)) hash.update(bytes);
  return { bytes: (await stat(filename)).size, sha256: hash.digest("hex") };
}

export async function nativeCommand(program, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(program, args, {
      env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    let errors = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("A ferramenta excedeu cinco minutos."));
    }, 300000);
    child.stdout.on("data", (chunk) => {
      if (output.length < 65536) output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      if (errors.length < 65536) errors += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code) reject(new Error(errors || `Ferramenta falhou: ${code}`));
      else resolve({ output, errors });
    });
  });
}

async function main() {
  const { values } = parseArgs({
    options: Object.fromEntries(
      [
        "env-file",
        "expected-ref",
        "tools-root",
        "postgres-bin",
        "ca-file",
        "output-root",
      ].map((key) => [key, { type: "string" }]),
    ),
  });
  for (const key of [
    "env-file",
    "expected-ref",
    "tools-root",
    "postgres-bin",
    "ca-file",
    "output-root",
  ])
    if (!values[key]) throw new Error(`Falta --${key}.`);
  if ((await stat(values["env-file"])).size > 65536)
    throw new Error("Arquivo de ambiente excessivo.");
  const env = parseEnv(await readFile(values["env-file"], "utf8"));
  const db = backupTarget(env, values["expected-ref"]);
  const repo = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
  const root = path.resolve(values["output-root"]);
  if (root === repo || root.startsWith(repo + path.sep))
    throw new Error("Backup deve ficar fora do repositório.");
  const directory = path.join(
    root,
    `pre-maycon-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`,
  );
  await mkdir(directory, { recursive: false, mode: 0o700 });
  const require = createRequire(
    path.join(path.resolve(values["tools-root"]), "package.json"),
  );
  const { Client } = require("pg");
  const ca = await readFile(values["ca-file"], "utf8");
  const client = new Client({
    connectionString: db.href,
    ssl: { rejectUnauthorized: true, ca },
    connectionTimeoutMillis: 10000,
    application_name: "6dnx-before-upgrade-backup",
    options:
      "-c default_transaction_read_only=on -c statement_timeout=60000 -c timezone=UTC",
  });
  const processEnv = {
    ...process.env,
    PGHOST: db.hostname,
    PGPORT: db.port || "5432",
    PGUSER: decodeURIComponent(db.username),
    PGPASSWORD: decodeURIComponent(db.password),
    PGDATABASE: "postgres",
    PGSSLMODE: "verify-full",
    PGSSLROOTCERT: path.resolve(values["ca-file"]),
    PGCONNECT_TIMEOUT: "10",
    PGOPTIONS:
      "-c default_transaction_read_only=on -c statement_timeout=120000",
    PGAPPNAME: "6dnx-readonly-backup",
  };
  const program = (name) =>
    path.join(
      values["postgres-bin"],
      name + (process.platform === "win32" ? ".exe" : ""),
    );
  try {
    await client.connect();
    await client.query("begin isolation level repeatable read read only");
    const state = (
      await client.query(
        "select current_database() as database, current_user as role, current_setting('server_version') as server_version, current_setting('transaction_read_only') as read_only, (select ssl from pg_stat_ssl where pid=pg_backend_pid()) as tls, pg_export_snapshot() as snapshot",
      )
    ).rows[0];
    if (state.read_only !== "on" || state.tls !== true)
      throw new Error("Backup exige TLS e transação somente leitura.");
    const baseline = (
      await client.query(`select
      exists(select 1 from information_schema.columns where table_schema='public' and table_name='product_catalog' and column_name='game_name') as had_game_name,
      exists(select 1 from information_schema.columns where table_schema='public' and table_name='product_catalog' and column_name='demo_images') as had_demo_images,
      to_regclass('public.product_solution_guides') is not null as had_guides,
      to_regclass('public.product_solution_guide_revisions') is not null as had_guide_revisions,
      to_regprocedure('public.solution_guide_is_valid(jsonb)') is not null as had_validator,
      to_regprocedure('public.admin_save_solution_guide(text,integer,text,jsonb)') is not null as had_save_guide,
      to_regprocedure('public.admin_publish_catalog_product(uuid,integer)') is not null as had_publish_product,
      exists(select 1 from pg_constraint where conrelid='public.product_catalog'::regclass and conname='product_catalog_game_name_valid') as had_game_constraint,
      exists(select 1 from pg_constraint where conrelid='public.product_catalog'::regclass and conname='product_catalog_gallery_self_service_shape') as had_gallery_constraint`)
    ).rows[0];
    const tables = (
      await client.query(
        "select n.nspname as schema,c.relname as name from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by 1,2",
      )
    ).rows;
    const tableFingerprints = await fingerprintTables(client, tables);
    const functions = (
      await client.query(
        "select p.oid::regprocedure::text as signature,pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' order by 1",
      )
    ).rows;
    const roles = (
      await client.query(
        "select rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolreplication,rolbypassrls from pg_roles order by rolname",
      )
    ).rows;
    const references = (
      await client.query(
        "select conname,pg_get_constraintdef(oid) as definition from pg_constraint where contype='f' and confrelid='auth.users'::regclass order by conname",
      )
    ).rows;
    const authIds = (
      await client.query("select id from auth.users order by id limit 10000")
    ).rows.map((row) => row.id);
    const inventory = {
      capturedAt: new Date().toISOString(),
      projectRef: values["expected-ref"],
      source: { ...state, snapshot: undefined },
      baseline,
      tableFingerprints,
      functions,
      roles,
      authIds,
      authReferences: references,
    };
    await writeFile(
      path.join(directory, "inventory.private.json"),
      JSON.stringify(inventory, null, 2),
      { flag: "wx", mode: 0o600 },
    );
    console.log(
      `Origem confirmada: ${values["expected-ref"]}; transação somente leitura, TLS validado.`,
    );
    await nativeCommand(
      program("pg_dump"),
      [
        "--no-password",
        "--format=custom",
        "--lock-wait-timeout=10s",
        `--snapshot=${state.snapshot}`,
        `--file=${path.join(directory, "database.dump")}`,
      ],
      processEnv,
    );
    await nativeCommand(
      program("pg_dump"),
      [
        "--no-password",
        "--schema-only",
        "--lock-wait-timeout=10s",
        `--snapshot=${state.snapshot}`,
        `--file=${path.join(directory, "schema.private.sql")}`,
      ],
      processEnv,
    );
    await client.query("commit");
    await nativeCommand(
      program("pg_dumpall"),
      [
        "--no-password",
        "--roles-only",
        "--no-role-passwords",
        `--file=${path.join(directory, "roles.private.sql")}`,
      ],
      processEnv,
    );
    await nativeCommand(
      program("pg_restore"),
      [
        "--list",
        `--file=${path.join(directory, "archive-list.private.txt")}`,
        path.join(directory, "database.dump"),
      ],
      processEnv,
    );
    const files = {};
    for (const name of [
      "database.dump",
      "schema.private.sql",
      "roles.private.sql",
      "inventory.private.json",
      "archive-list.private.txt",
    ])
      files[name] = await fileDigest(path.join(directory, name));
    const manifest = {
      version: 1,
      projectRef: values["expected-ref"],
      createdAt: new Date().toISOString(),
      completed: true,
      sourceReadOnly: true,
      tlsVerified: true,
      files,
      baseline,
      tableCount: tables.length,
      restoreVerified: false,
      storageObjectsIncluded: false,
    };
    await writeFile(
      path.join(directory, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      { flag: "wx", mode: 0o600 },
    );
    console.log(
      JSON.stringify({
        backupDirectory: directory,
        complete: true,
        tables: tables.length,
        archiveBytes: files["database.dump"].bytes,
        baseline,
      }),
    );
  } finally {
    await client.end();
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((error) => {
    console.error(String(error.message).slice(0, 1500));
    process.exitCode = 1;
  });
