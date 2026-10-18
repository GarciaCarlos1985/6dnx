import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import path from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import {
  fileDigest,
  fingerprintTables,
  nativeCommand,
} from "./backup-maycon-upgrade.mjs";

const { values } = parseArgs({
  options: Object.fromEntries(
    ["backup-dir", "tools-root", "postgres-bin"].map((key) => [
      key,
      { type: "string" },
    ]),
  ),
});
for (const key of ["backup-dir", "tools-root", "postgres-bin"])
  if (!values[key]) throw new Error(`Falta --${key}.`);
const backup = path.resolve(values["backup-dir"]);
const tools = path.resolve(values["tools-root"]);
const require = createRequire(path.join(tools, "package.json"));
const { Client } = require("pg");
const { default: EmbeddedPostgres } = await import(
  pathToFileURL(require.resolve("embedded-postgres")).href
);
const manifest = JSON.parse(
  await readFile(path.join(backup, "manifest.json"), "utf8"),
);
assert.equal(
  manifest.projectRef,
  "muwqyoeisiuwadxoiokz",
  "Wrong source project",
);
assert.equal(manifest.completed, true);
for (const [name, expected] of Object.entries(manifest.files)) {
  assert.ok(!name.includes("/") && !name.includes("\\"));
  assert.deepEqual(
    await fileDigest(path.join(backup, name)),
    expected,
    `Backup digest mismatch: ${name}`,
  );
}
const inventory = JSON.parse(
  await readFile(path.join(backup, "inventory.private.json"), "utf8"),
);
assert.ok(
  Object.values(inventory.baseline).every((value) => value === false),
  "This recovery script only supports the measured pre-upgrade baseline",
);
const toc = await readFile(
  path.join(backup, "archive-list.private.txt"),
  "utf8",
);
const publicToc = toc
  .split("\n")
  .filter(
    (line) =>
      !line ||
      line.startsWith(";") ||
      /^\d+; \d+ \d+ (?:.* )?public /.test(line),
  );
assert.ok(publicToc.some((line) => /TABLE public product_catalog /.test(line)));
await writeFile(
  path.join(backup, "public-restore-list.private.txt"),
  publicToc.join("\n"),
);
const listener = net.createServer();
await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
const config = {
  host: "127.0.0.1",
  port,
  user: "postgres",
  password: randomBytes(24).toString("hex"),
  database: "postgres",
  connectionTimeoutMillis: 10000,
};
const dataDir = path.join(backup, `restore-lab-${Date.now()}`);
await mkdir(dataDir, { mode: 0o700 });
const database = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: config.user,
  password: config.password,
  port,
  persistent: true,
  createPostgresUser: false,
  authMethod: "scram-sha-256",
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  postgresFlags: [
    "-c",
    "listen_addresses=127.0.0.1",
    "-c",
    "shared_buffers=16MB",
    "-c",
    "max_connections=8",
  ],
  onLog: () => {},
  onError: () => {},
});
let client;
let started = false;
const evidence = {
  startedAt: new Date().toISOString(),
  projectRef: manifest.projectRef,
  sourceDatabaseUnchanged: true,
  publicRestoreVerified: false,
  fullSupabaseRestoreVerified: false,
  storageObjectRestoreVerified: false,
  checks: [],
};
evidence.testedFiles = {};
for (const file of [
  "supabase/migrations/20261018061604_solution_self_service.sql",
  "supabase/migrations/20261018162455_catalog_product_publication.sql",
  "scripts/rollback-maycon-upgrade.sql",
]) {
  evidence.testedFiles[file] = await fileDigest(new URL(`../${file}`, import.meta.url));
}
const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");
const rollbackSql = await read("scripts/rollback-maycon-upgrade.sql");
const rollbackBody = rollbackSql
  .replace(/^begin;$/m, "")
  .replace(/^commit;\s*$/m, "");
async function fingerprints() {
  await client.query("begin read only");
  try {
    return await fingerprintTables(
      client,
      Object.keys(inventory.tableFingerprints).map((name) => {
        const [schema, table] = name.split(".");
        return { schema, name: table };
      }),
    );
  } finally {
    await client.query("rollback");
  }
}
async function runRollback() {
  try {
    await client.query(rollbackSql);
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
async function protectedWriteFails(write) {
  await client.query("begin");
  try {
    await write();
    await client.query("savepoint guard_check");
    await assert.rejects(
      client.query(rollbackBody),
      (error) => error.code === "55000",
    );
    await client.query("rollback to savepoint guard_check");
  } finally {
    await client.query("rollback");
  }
}
try {
  await database.initialise();
  await database.start();
  started = true;
  client = new Client(config);
  await client.connect();
  await client.query("set timezone='UTC'");
  // Only Auth identities/functions required by the application are scaffolded.
  // This is a real public-schema restore, not a complete Supabase platform clone.
  for (const role of inventory.roles.filter(
    (role) => !role.rolname.startsWith("pg_") && role.rolname !== "postgres",
  )) {
    assert.match(role.rolname, /^[a-z_]+$/);
    await client.query(
      `create role "${role.rolname}" nologin ${role.rolbypassrls ? "bypassrls" : "nobypassrls"}`,
    );
  }
  await client.query(`create schema auth;
    create schema extensions;
    create table auth.users(id uuid primary key);
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
    create function auth.role() returns text language sql stable as $$select auth.jwt()->>'role'$$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on function auth.jwt(),auth.uid(),auth.role() to anon,authenticated,service_role;`);
  for (const id of inventory.authIds)
    await client.query("insert into auth.users values($1)", [id]);
  const restoreEnv = {
    ...process.env,
    PGHOST: config.host,
    PGPORT: String(port),
    PGUSER: config.user,
    PGPASSWORD: config.password,
    PGDATABASE: config.database,
    PGSSLMODE: "disable",
    PGCONNECT_TIMEOUT: "10",
  };
  const program = path.join(
    values["postgres-bin"],
    `pg_restore${process.platform === "win32" ? ".exe" : ""}`,
  );
  try {
    await nativeCommand(
      program,
      [
        "--no-password",
        "--exit-on-error",
        "--single-transaction",
        `--use-list=${path.join(backup, "public-restore-list.private.txt")}`,
        "--dbname=postgres",
        path.join(backup, "database.dump"),
      ],
      restoreEnv,
    );
  } catch (error) {
    await writeFile(
      path.join(backup, "restore-error.private.txt"),
      String(error.message),
    );
    throw new Error(
      "A restauração local falhou. Diagnóstico preservado no arquivo privado; produção intacta.",
    );
  }
  assert.deepEqual(
    await fingerprints(),
    inventory.tableFingerprints,
    "Restored application rows differ from source snapshot",
  );
  evidence.publicRestoreVerified = true;
  evidence.checks.push(
    "All 12 public application tables restored with identical counts and SHA-256 fingerprints",
  );
  console.log(
    "PASS: backup restaurou as 12 tabelas da aplicação com conteúdo idêntico.",
  );
  const functionsBefore = (
    await client.query(
      "select p.oid::regprocedure::text as signature,pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' order by 1",
    )
  ).rows;
  const schemaBefore = (
    await client.query(
      "select table_name,column_name,data_type,column_default,is_nullable from information_schema.columns where table_schema='public' order by table_name,ordinal_position",
    )
  ).rows;
  for (const file of [
    "supabase/migrations/20261018061604_solution_self_service.sql",
    "supabase/migrations/20261018162455_catalog_product_publication.sql",
  ])
    await client.query(await read(file));
  const existingRows = (
    await client.query(
      "select count(*)::integer as count from public.product_catalog",
    )
  ).rows[0].count;
  assert.equal(
    existingRows,
    inventory.tableFingerprints["public.product_catalog"].count,
  );
  await assert.rejects(runRollback(), (error) => error.code === "42501");
  await client.query(
    "set sixdnx.rollback_confirmation='revert-maycon-64ba685-c2734e9'",
  );
  const sourceKey = (
    await client.query(
      "select source_key from public.product_catalog order by source_key limit 1",
    )
  ).rows[0].source_key;
  await protectedWriteFails(() =>
    client.query(
      "insert into public.product_solution_guides(product_source_key,draft) values($1,$2)",
      [
        sourceKey,
        JSON.stringify({
          title: "Guia de laboratório",
          introduction: "Somente ensaio local.",
          youtubeId: null,
          steps: ["Teste"],
          questions: [],
        }),
      ],
    ),
  );
  assert.equal(
    (
      await client.query(
        "select count(*)::integer as n from public.product_solution_guides",
      )
    ).rows[0].n,
    0,
  );
  // Each attempted write and its legacy triggers are rolled back together.
  for (const assignment of [
    "game_name='Jogo do ensaio'",
    "demo_images='[\"/products/test-only.webp\"]'::jsonb",
  ]) {
    await protectedWriteFails(() =>
      client.query(
        `update public.product_catalog set ${assignment} where source_key=$1`,
        [sourceKey],
      ),
    );
  }
  evidence.checks.push(
    "Rollback refuses missing human approval and existing guide/game/gallery content",
  );
  await runRollback();
  assert.deepEqual(
    await fingerprints(),
    inventory.tableFingerprints,
    "Rollback changed existing application rows",
  );
  assert.deepEqual(
    (
      await client.query(
        "select table_name,column_name,data_type,column_default,is_nullable from information_schema.columns where table_schema='public' order by table_name,ordinal_position",
      )
    ).rows,
    schemaBefore,
  );
  assert.deepEqual(
    (
      await client.query(
        "select p.oid::regprocedure::text as signature,pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' order by 1",
      )
    ).rows,
    functionsBefore,
  );
  await runRollback();
  assert.deepEqual(await fingerprints(), inventory.tableFingerprints);
  evidence.checks.push(
    "Forward migrations and approved rollback restore original public schema, functions and all data; second rollback is harmless",
  );
  evidence.completedAt = new Date().toISOString();
  evidence.success = true;
  await writeFile(
    path.join(backup, "recovery-verification.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.log(
    "PASS: migrations e reversão aprovadas; dados originais preservados.",
  );
} catch (error) {
  evidence.success = false;
  evidence.error = String(error.message).slice(0, 500);
  await writeFile(
    path.join(backup, "recovery-verification.json"),
    JSON.stringify(evidence, null, 2),
  );
  console.error(evidence.error);
  process.exitCode = 1;
} finally {
  if (client) await client.end();
  if (started) await database.stop();
  console.log(
    "Laboratório local encerrado. Nenhuma migration ou reversão executada em produção.",
  );
}
