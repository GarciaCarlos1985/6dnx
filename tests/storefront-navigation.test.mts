import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("all operational Discord navigation uses the permanent 6DNX invite", async () => {
  const [page, navigation, redirectRoute, discordConfig] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/site-navigation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/redirect/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/discord.ts", import.meta.url), "utf8"),
  ]);

  assert.match(page, /OFFICIAL_6DNX_DISCORD_INVITE/);
  assert.doesNotMatch(page, /DISCORD_ANNOUNCEMENTS_URL/);
  assert.match(navigation, /announcementsUrl/);
  assert.match(navigation, />\s*Anúncios\s*</);
  assert.doesNotMatch(navigation, /href:\s*["']\/noticias["']/);
  assert.match(redirectRoute, /OFFICIAL_6DNX_DISCORD_INVITE/);
  assert.doesNotMatch(redirectRoute, /DISCORD_INVITE_URL/);
  assert.match(discordConfig, /https:\/\/discord\.gg\/6dnx/);
});
