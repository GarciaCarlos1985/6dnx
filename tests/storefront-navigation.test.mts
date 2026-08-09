import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("home navigation sends announcements to the configured Discord invite", async () => {
  const [page, navigation] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/site-navigation.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /DISCORD_ANNOUNCEMENTS_URL/);
  assert.match(page, /https:\/\/discord\.gg\/5k9tvSerW/);
  assert.match(navigation, /announcementsUrl/);
  assert.match(navigation, />\s*Anúncios\s*</);
  assert.doesNotMatch(navigation, /href:\s*["']\/noticias["']/);
});
