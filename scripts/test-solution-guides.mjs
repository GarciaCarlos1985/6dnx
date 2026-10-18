import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

// Every write is to this disposable, network-isolated PostgreSQL container.
const container = `6dnx-guide-lab-${process.pid}-${Date.now()}`;
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
    const probe = await command([
      "exec",
      container,
      "pg_isready",
      "-U",
      "postgres",
    ]);
    if (!probe.code) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "local PostgreSQL did not start");
  for (const file of [
    "../tests/solution-self-service.bootstrap.sql",
    "../supabase/migrations/20261018061604_solution_self_service.sql",
    "../tests/solution-self-service.integration.sql",
  ]) {
    await checked(psql, await readFile(new URL(file, import.meta.url), "utf8"));
  }
  const guide = JSON.stringify({
    title: "Guia concorrente",
    introduction: "",
    youtubeId: null,
    steps: ["Confira seu pedido."],
    questions: [],
  });
  const transaction = `begin; set local role authenticated; select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","app_metadata":{"role":"admin"}}',true); select public.admin_save_solution_guide('solution-a',0,'save','${guide}'); select pg_sleep(0.2); commit;`;
  const concurrent = await Promise.all([
    command(psql, transaction),
    command(psql, transaction),
  ]);
  assert.equal(
    concurrent.filter((result) => result.code === 0).length,
    1,
    "one concurrent save must win",
  );
  assert.match(
    concurrent.find((result) => result.code !== 0)?.output ?? "",
    /guide revision conflict/,
  );
  const rowCount = await checked(
    [...psql, "-t", "-A"],
    "select count(*)::text || ':' || max(revision)::text from public.product_solution_guides;",
  );
  assert.equal(
    rowCount.trim(),
    "1:1",
    "concurrent saves must not duplicate or overwrite",
  );
  console.log(
    "PostgreSQL local: RLS, validação, rascunho, publicação, histórico, isolamento comercial e concorrência aprovados.",
  );
} finally {
  if (created) await checked(["rm", "-f", container]);
}
