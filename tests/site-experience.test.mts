import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DEFAULT_SITE_EXPERIENCE,
  EXPERIENCE_EFFECT_FAMILIES,
} from "../lib/site-experience/types.ts";
import {
  contrastRatio,
  parseSiteExperienceConfig,
  parseSiteExperienceMutation,
} from "../lib/site-experience/validation.ts";

function cloneDefault() {
  return structuredClone(DEFAULT_SITE_EXPERIENCE);
}

test("site experience accepts canonical defaults and normalizes safe plain text", () => {
  const config = cloneDefault();
  config.home.content.catalogTitle = "  Soluções   6DNX  ";
  const parsed = parseSiteExperienceConfig(config);
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.value.home.content.catalogTitle, "Soluções 6DNX");
});

test("site experience rejects unknown fields, oversized documents and unsupported versions", () => {
  const unknown = cloneDefault() as unknown as Record<string, unknown>;
  unknown.checkout = { enabled: true };
  assert.equal(parseSiteExperienceConfig(unknown).ok, false);

  const version = cloneDefault() as unknown as Record<string, unknown>;
  version.schemaVersion = 2;
  assert.equal(parseSiteExperienceConfig(version).ok, false);

  const oversized = cloneDefault();
  oversized.home.content.catalogDescription = "x".repeat(50 * 1024);
  const result = parseSiteExperienceConfig(oversized);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.errors.join(" "), /48 KB/);
});

test("site experience blocks HTML, script links, control and bidi attacks", () => {
  const attacks = [
    "<img src=x onerror=alert(1)>",
    "[clique](javascript:alert(1))",
    "texto\u0000oculto",
    "texto\u202Eoculto",
    "texto\u2066isolado",
  ];
  for (const attack of attacks) {
    const config = cloneDefault();
    config.home.content.catalogTitle = attack;
    assert.equal(parseSiteExperienceConfig(config).ok, false, attack);
  }
});

test("site experience enforces color, contrast and local font allowlists", () => {
  assert.ok(contrastRatio("#FFFFFF", "#000000") >= 4.5);
  assert.ok(contrastRatio("#777777", "#888888") < 4.5);

  for (const attack of ["red", "#fff", "#FFFFFF80", "rgb(0,0,0)", "var(--evil)", "#000000;position:fixed"]) {
    const config = cloneDefault();
    config.home.theme.backgroundColor = attack;
    assert.equal(parseSiteExperienceConfig(config).ok, false, attack);
  }

  const lowContrast = cloneDefault();
  lowContrast.account.theme.headingColor = "#080808";
  assert.equal(parseSiteExperienceConfig(lowContrast).ok, false);

  const remoteFont = cloneDefault() as unknown as {
    home: { theme: { displayFont: string } };
  };
  remoteFont.home.theme.displayFont = "https://fonts.example/evil.woff2";
  assert.equal(parseSiteExperienceConfig(remoteFont).ok, false);
});

test("site experience limits particle families and never accepts client instance counts", () => {
  assert.deepEqual(EXPERIENCE_EFFECT_FAMILIES, ["feathers", "ammo", "embers", "sparks", "lightning"]);
  const tooMany = cloneDefault();
  tooMany.slot.effects.families = ["embers", "sparks", "lightning"];
  assert.equal(parseSiteExperienceConfig(tooMany).ok, false);

  const injected = cloneDefault() as unknown as {
    home: { effects: Record<string, unknown> };
  };
  injected.home.effects.instances = 10_000;
  assert.equal(parseSiteExperienceConfig(injected).ok, false);
});

test("site experience mutation requires exact optimistic-concurrency revisions", () => {
  assert.equal(parseSiteExperienceMutation({
    config: cloneDefault(),
    expectedDraftRevision: 1,
    expectedPublishedRevision: 1,
  }).ok, true);

  for (const revisions of [
    { expectedDraftRevision: 0, expectedPublishedRevision: 1 },
    { expectedDraftRevision: 1, expectedPublishedRevision: 1.5 },
    { expectedDraftRevision: 1, expectedPublishedRevision: 1, extra: true },
  ]) {
    assert.equal(parseSiteExperienceMutation({ config: cloneDefault(), ...revisions }).ok, false);
  }
});

test("site experience migration isolates public, draft and history data fail-closed", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20260809220000_add_site_experience_studio.sql", import.meta.url),
    "utf8",
  );
  for (const table of ["site_experience_published", "site_experience_drafts", "site_experience_revisions"]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, "i"));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /grant select on table public\.site_experience_published to anon, authenticated/i);
  assert.match(sql, /site_experience_plain_text_is_valid/i);
  assert.match(sql, /octet_length\(p_config::text\) <= 49152/i);
  assert.match(sql, /when 'heroCtaLabel' then 32/i);
  assert.match(sql, /when 'heroAccent' then 24/i);
  assert.match(sql, /when 'anonymousSupport' then 260/i);
  assert.match(sql, /p_value !~ '\[\[:cntrl:\]\]'/i);
  assert.match(sql, /strpos\(p_value, '<'\) = 0/i);
  assert.match(sql, /javascript\[\[:space:\]\]\*:/i);
  assert.match(sql, /8294, 8295, 8296, 8297/i);
  assert.match(sql, /site_experience_contrast_ratio/i);
  assert.match(sql, /\) < 4\.5, true\)/i);
  assert.match(sql, /\) < 3, true\)/i);
  assert.match(sql, /key_name not in \('density', 'families'\)/i);
  assert.doesNotMatch(sql, /grant select on table public\.site_experience_(drafts|revisions) to anon/i);
  assert.match(sql, /revoke all on table public\.site_experience_published,[\s\S]*site_experience_revisions\s+from public, anon, authenticated/i);
  assert.match(sql, /base_published_revision integer not null/i);
  assert.match(sql, /draft_revision integer not null/i);
  assert.match(sql, /updated_by uuid references auth\.users/i);
  assert.match(sql, /published_by uuid references auth\.users/i);
  assert.match(sql, /on conflict \(id\) do nothing/i);
  assert.doesNotMatch(sql, /(insert into|update|delete from) public\.product_catalog/i);
  assert.doesNotMatch(sql, /(insert into|update|delete from) public\.commerce_/i);
  assert.doesNotMatch(sql, /(insert into|update|delete from) public\.loyalty_/i);
  assert.doesNotMatch(sql, /truncate\s+/i);
  assert.doesNotMatch(sql, /drop table/i);
});

test("site experience publication and restore require admin, AAL2 and revision locks", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20260809220000_add_site_experience_studio.sql", import.meta.url),
    "utf8",
  );
  for (const rpc of ["publish_site_experience", "restore_site_experience_revision_to_draft"]) {
    const start = sql.indexOf(`create or replace function public.${rpc}`);
    assert.ok(start >= 0, rpc);
    const block = sql.slice(start, sql.indexOf("$$;", start) + 3);
    assert.match(block, /security definer/i);
    assert.match(block, /set search_path = ''/i);
    assert.match(block, /if not public\.is_catalog_admin\(\)/i);
    assert.match(block, /auth\.jwt\(\) ->> 'aal'/i);
    assert.match(block, /aal2/i);
    assert.match(block, /for update/i);
  }
  assert.match(sql, /p_expected_published_revision/i);
  assert.match(sql, /p_expected_draft_revision/i);
  assert.match(sql, /insert into public\.site_experience_revisions/i);
});

test("site experience draft and publish routes preserve their trust boundaries", async () => {
  const [draft, publish, restore] = await Promise.all([
    readFile(new URL("../app/api/admin/site-experience/draft/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/site-experience/publish/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/site-experience/restore/route.ts", import.meta.url), "utf8"),
  ]);

  const origin = draft.indexOf("rejectCrossOriginMutation(request)");
  const auth = draft.indexOf("requireAdminApi()", origin);
  const bounded = draft.indexOf("readBoundedJson(request", auth);
  const parse = draft.indexOf("parseSiteExperienceMutation(payload)", bounded);
  const save = draft.indexOf("saveSiteExperienceDraft", parse);
  assert.ok(origin >= 0 && auth > origin && bounded > auth && parse > bounded && save > parse);
  assert.match(draft, /64 \* 1024/);
  assert.doesNotMatch(draft, /revalidatePath|revalidateTag/);

  assert.match(publish, /requireAdminApi\(\{ requireAal2: true \}\)/);
  assert.match(publish, /publishSiteExperience/);
  assert.match(publish, /revalidateTag\(SITE_EXPERIENCE_CACHE_TAG/);
  assert.match(publish, /revalidatePath\("\/"\)/);
  assert.doesNotMatch(publish, /parseSiteExperienceConfig/);
  assert.match(restore, /requireAdminApi\(\{ requireAal2: true \}\)/);
  assert.match(restore, /restoreSiteExperienceRevision/);
});

test("site atmosphere has deterministic bounded pools and reduced-motion protection", async () => {
  const [component, globalCss] = await Promise.all([
    readFile(new URL("../components/site-atmosphere.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(component, /const MAX_PARTICLES = 24/);
  assert.match(component, /const LIGHT_PARTICLES = 10/);
  assert.match(component, /data-site-effect-particle/);
  assert.match(component, /data-effect-family/);
  assert.doesNotMatch(component, /Math\.random/);
  assert.match(globalCss, /nth-child\(n \+ 11\)/);
  assert.match(globalCss, /prefers-reduced-motion: reduce/);
  assert.match(globalCss, /\.site-atmosphere/);
});

test("site experience domain never imports checkout, commerce, rewards or Slot engine", async () => {
  const sources = await Promise.all([
    readFile(new URL("../lib/site-experience/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/site-experience/validation.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/admin/site-experience-studio.tsx", import.meta.url), "utf8"),
  ]);
  for (const source of sources) {
    for (const forbidden of ["@/lib/checkout", "@/lib/commerce", "@/lib/rewards", "@/lib/slot/engine"]) {
      assert.doesNotMatch(source, new RegExp(forbidden));
    }
    assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML/);
  }
});
