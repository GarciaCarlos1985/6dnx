import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";

// All mutations stay inside this disposable PostgreSQL, with no network.
const container = `6dnx-authoring-lab-${process.pid}-${Date.now()}`;
function command(args, input = "") {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    for (const stream of [child.stdout, child.stderr])
      stream.on("data", (chunk) => {
        output += chunk;
        if (output.length > 128 * 1024) child.kill();
      });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, output }));
    child.stdin.end(input);
  });
}
async function checked(args, input) {
  const result = await command(args, input);
  if (result.code) throw new Error(result.output);
  return result.output;
}
const psql = [
  "exec",
  "-i",
  container,
  "psql",
  "-U",
  "postgres",
  "-v",
  "ON_ERROR_STOP=1",
  "-X",
  "-q",
];
const read = (file) => readFile(new URL(file, import.meta.url), "utf8");
let created = false;
try {
  await checked([
    "run",
    "--name",
    container,
    "--network",
    "none",
    "-e",
    `POSTGRES_PASSWORD=${randomBytes(24).toString("hex")}`,
    "-d",
    "postgres:17-alpine",
  ]);
  created = true;
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (
      !(await command(["exec", container, "pg_isready", "-U", "postgres"])).code
    ) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "local PostgreSQL did not start");
  await checked(psql, await read("../tests/catalog-authoring.bootstrap.sql"));
  const baseline = await read(
    "../supabase/migrations/20260731090000_create_product_catalog_admin.sql",
  );
  await checked(
    psql,
    baseline.slice(0, baseline.indexOf("insert into storage.buckets")),
  );
  for (const file of [
    "../supabase/migrations/20260801143000_add_catalog_ordering.sql",
    "../supabase/migrations/20261018061604_solution_self_service.sql",
    "../supabase/migrations/20261018162455_catalog_product_publication.sql",
    "../tests/catalog-authoring.integration.sql",
  ])
    await checked(psql, await read(file));
  const transaction = (id) =>
    `begin; set local role authenticated; select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","app_metadata":{"role":"admin"}}',true); select (public.admin_publish_catalog_product('${id}',1)).id; select pg_sleep(0.2); commit;`;
  const simultaneous = await Promise.all([
    command(psql, transaction("cccccccc-cccc-4ccc-8ccc-cccccccccccc")),
    command(psql, transaction("dddddddd-dddd-4ddd-8ddd-dddddddddddd")),
  ]);
  assert.ok(
    simultaneous.every((result) => result.code === 0),
    JSON.stringify(simultaneous),
  );
  const conflict = await Promise.all([
    command(psql, transaction("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee")),
    command(psql, transaction("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee")),
  ]);
  assert.equal(conflict.filter((result) => result.code === 0).length, 1);
  assert.match(
    conflict.find((result) => result.code !== 0)?.output ?? "",
    /product revision conflict/,
  );
  const state = await checked(
    [...psql, "-t", "-A"],
    "select count(*)::text||':'||count(distinct catalog_order)::text from public.product_catalog where publication_state='published';",
  );
  assert.equal(
    state.trim(),
    "5:5",
    "concurrent publication must append distinct positions",
  );
  console.log(
    "PostgreSQL local: criação de rascunho, publicação, RLS, histórico, preservação comercial e concorrência aprovados.",
  );
} finally {
  if (created) await checked(["rm", "-f", container]);
}
