import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";
import { isMissingDatabaseRelation } from "../lib/account/errors.ts";

test("account recognizes SQL and PostgREST missing-relation errors", () => {
  assert.equal(isMissingDatabaseRelation({ code: "42P01" }), true);
  assert.equal(isMissingDatabaseRelation({ code: "PGRST205" }), true);
  assert.equal(isMissingDatabaseRelation({ code: "42501" }), false);
  assert.equal(isMissingDatabaseRelation(null), false);
});

test("account keeps orders mandatory and loyalty balance best-effort", async () => {
  const route = await readFile(
    new URL("../app/api/account/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(route, /const orders = await repository\.listOrdersByUser/);
  assert.doesNotMatch(route, /Promise\.all/);
  assert.match(route, /let balance: number \| null = null/);
  assert.match(route, /status: balance === null \? "preparing" : "ready"/);
});

test("account preserves the authentication boundary and nullable loyalty contract", async () => {
  const [route, repository, dashboard] = await Promise.all([
    readFile(new URL("../app/api/account/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/account/repository.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/account-dashboard.tsx", import.meta.url), "utf8"),
  ]);

  const authCheck = route.indexOf("supabase.auth.getUser()");
  const orderRead = route.indexOf("repository.listOrdersByUser(user.id)");
  assert.ok(authCheck >= 0 && orderRead > authCheck);
  assert.match(route, /status: 401/);
  assert.match(repository, /Promise<number \| null>/);
  assert.match(repository, /isMissingDatabaseRelation\(result\.error\)[\s\S]*return null/);
  assert.match(dashboard, /balance: number \| null/);
});

test("slot preview cannot create a real spin or choose a random result", async () => {
  const [source, stage] = await Promise.all([
    readFile(
      new URL("../components/slot-experience.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../components/slot-pixi-stage.tsx", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(source, /PRÉVIA VISUAL/);
  assert.match(source, /SEM PRÊMIO/);
  assert.match(source, /fetch\("\/api\/account"/);
  assert.doesNotMatch(source, /Math\.random/);
  assert.doesNotMatch(stage, /Math\.random/);
  assert.doesNotMatch(source, /fetch\(["'`]\/api\/slot/);
  assert.doesNotMatch(source, /fetch\(["'`]\/api\/.*spin/);
  assert.doesNotMatch(stage, /fetch\(/);
});

test("slot stays a single hero with modal cabin, rules and mascot reactions", async () => {
  const source = await readFile(
    new URL("../components/slot-experience.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /type ExperiencePanel = "machine" \| "rules" \| null/);
  assert.match(source, />\s*Cabine\s*</);
  assert.match(source, />\s*Regras claras\s*</);
  assert.match(source, /role="dialog"/);
  assert.match(source, /type MascotMood = "idle" \| "anticipation" \| "celebration"/);
  assert.doesNotMatch(source, /slot-console-section/);
  assert.doesNotMatch(source, /slot-mascot-states/);
});

test("slot preserves the supplied references and renders transparent reaction dragons", async () => {
  const transparentDragons = [
    new URL("../public/slot/dragon-idle-v2.png", import.meta.url),
    new URL("../public/slot/dragon-excited-v2.png", import.meta.url),
    new URL("../public/slot/dragon-anticipation-v2.png", import.meta.url),
    new URL("../public/slot/dragon-celebration-v2.png", import.meta.url),
  ];
  await Promise.all([
    access(new URL("../public/slot/slot-layout.png", import.meta.url)),
    access(new URL("../public/slot/slot-mascote.png", import.meta.url)),
    access(new URL("../public/slot/slot-modelos-mascote.png", import.meta.url)),
    ...transparentDragons.map((asset) => access(asset)),
  ]);
  const pngs = await Promise.all(transparentDragons.map((asset) => readFile(asset)));
  for (const png of pngs) {
    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
    assert.equal(png[25], 6, "dragon asset must use PNG RGBA color type");
  }
  const [slot, stage] = await Promise.all([
    readFile(
      new URL("../components/slot-experience.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../components/slot-pixi-stage.tsx", import.meta.url),
      "utf8",
    ),
  ]);
  const nav = await readFile(
    new URL("../components/site-navigation.tsx", import.meta.url),
    "utf8",
  );
  assert.match(slot, /\/slot\/dragon-excited-v2\.png/);
  assert.match(stage, /\/slot\/dragon-idle-v2\.png/);
  assert.match(stage, /\/slot\/dragon-excited-v2\.png/);
  assert.match(stage, /\/slot\/dragon-anticipation-v2\.png/);
  assert.match(stage, /\/slot\/dragon-celebration-v2\.png/);
  assert.doesNotMatch(stage, /\/slot\/slot-modelos-mascote\.png/);
  assert.doesNotMatch(stage, /mascotPanel|mascotMask/);
  assert.doesNotMatch(stage, /roundRect\(38, 92, 285, 360/);
  assert.doesNotMatch(slot, /src="\/slot\/slot-layout\.png"/);
  assert.doesNotMatch(stage, /\/slot\/slot-layout\.png/);
  assert.match(nav, /href="\/slot"/);
});

test("slot loads PixiJS only inside the machine and keeps a deterministic reel contract", async () => {
  const [experience, stage, timing, packageJson] = await Promise.all([
    readFile(
      new URL("../components/slot-experience.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../components/slot-pixi-stage.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../lib/slot/preview-contract.ts", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(experience, /dynamic\(/);
  assert.match(experience, /<SlotPixiStage mood=\{mascotMood\} round=\{previewRound\} \/>/);
  assert.match(stage, /await import\("pixi\.js"\)/);
  assert.match(stage, /preference: "webgl"/);
  assert.match(stage, /const coarsePointer = window\.matchMedia\("\(pointer: coarse\)"\)\.matches/);
  assert.match(stage, /antialias: !coarsePointer/);
  assert.match(stage, /powerPreference: coarsePointer \? "low-power" : "high-performance"/);
  assert.match(stage, /initializingApp\?\.destroy/);
  assert.doesNotMatch(stage, /quality: [23]/);
  assert.match(stage, /app\.ticker\.maxFPS = 60/);
  assert.match(stage, /const REEL_COUNT = 4/);
  assert.match(stage, /const REEL_MARKS = \["6", "D", "N", "X"\]/);
  assert.match(timing, /1700,[\s\S]*2300,[\s\S]*2900,[\s\S]*3500/);
  assert.match(timing, /SLOT_PREVIEW_REEL_STOP_DURATION_MS = 800/);
  assert.match(stage, /stopProgress/);
  assert.match(stage, /const RESULT_ROWS/);
  assert.match(stage, /prefers-reduced-motion: reduce/);
  assert.match(experience, /SLOT_PREVIEW_REDUCED_DURATION_MS/);
  assert.match(experience, /SLOT_PREVIEW_DURATION_MS/);
  assert.match(experience, /quatro colunas desaceleram e param uma por vez/);
  assert.match(experience, /×2 e \+1 não têm efeito nesta prévia/);
  assert.match(packageJson, /"pixi\.js"/);
});

test("slot audio is lightweight, user-triggered and never implies a real payout", async () => {
  const source = await readFile(
    new URL("../components/slot-experience.tsx", import.meta.url),
    "utf8",
  );
  const assets = [
    "spin-button.mp3",
    "reel-stop.mp3",
    "celebration-chime.mp3",
  ];

  for (const asset of assets) {
    const file = new URL(`../public/slot/sons/${asset}`, import.meta.url);
    await access(file);
    assert.ok((await stat(file)).size < 64 * 1024, `${asset} must stay bounded`);
    assert.match(source, new RegExp(`/slot/sons/${asset.replace(".", "\\.")}`));
  }

  assert.match(source, /aria-pressed=\{soundEnabled\}/);
  assert.match(source, /schedulePreviewSounds\(reducedMotion\)/);
  assert.match(source, /clearPreviewSounds/);
  assert.doesNotMatch(source, /jackpot|coin-payout/i);
});

test("storefront, account and slot expose one safe Discord support redirect", async () => {
  const sources = await Promise.all([
    readFile(new URL("../components/site-navigation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/account-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/slot-experience.tsx", import.meta.url), "utf8"),
  ]);
  for (const source of sources) {
    assert.match(source, /href="\/api\/redirect"/);
    assert.match(source, />\s*Suporte\s*</);
  }
});
