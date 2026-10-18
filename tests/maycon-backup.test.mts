import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
// Local operations use an external PostgreSQL toolchain, never app credentials.
import { backupTarget, fileDigest } from "../scripts/backup-maycon-upgrade.mjs";

test("backup refuses mismatched project, wrong database and missing password", () => {
  const ref = "muwqyoeisiuwadxoiokz";
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
    SUPABASE_DB_URL: `postgresql://postgres:synthetic-test-password@db.${ref}.supabase.co:5432/postgres?sslmode=require`,
  };
  const target = backupTarget(env, ref);
  assert.equal(target.hostname, `db.${ref}.supabase.co`);
  assert.equal(target.searchParams.has("sslmode"), false);
  assert.throws(() => backupTarget(env, "potqyxfbojlwrwrdoysc"));
  assert.throws(() =>
    backupTarget(
      {
        ...env,
        SUPABASE_DB_URL: env.SUPABASE_DB_URL.replace("/postgres?", "/other?"),
      },
      ref,
    ),
  );
  assert.throws(() =>
    backupTarget(
      {
        ...env,
        SUPABASE_DB_URL: env.SUPABASE_DB_URL.replace(
          ":synthetic-test-password",
          "",
        ),
      },
      ref,
    ),
  );
  assert.throws(() => backupTarget(env, ""));
});

test("backup fingerprint streams exact file bytes and detects a changed archive", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "6dnx-backup-check-"));
  try {
    const filename = path.join(directory, "fixture.dump");
    const bytes = Buffer.from("backup fixture\n", "utf8");
    await writeFile(filename, bytes);
    assert.deepEqual(await fileDigest(filename), {
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
    const previous = await fileDigest(filename);
    await writeFile(filename, Buffer.from("changed fixture\n"));
    assert.notDeepEqual(await fileDigest(filename), previous);
  } finally {
    const resolved = path.resolve(directory);
    assert.equal(path.dirname(resolved), path.resolve(tmpdir()));
    assert.ok(path.basename(resolved).startsWith("6dnx-backup-check-"));
    await rm(resolved, { recursive: true });
  }
});
