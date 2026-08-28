import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  normalizeYouTubeVideoId,
  youtubeNoCookieEmbedUrl,
  youtubeWatchUrl,
} from "../lib/media/youtube.ts";

const read = (path: string) =>
  readFile(new URL(path, import.meta.url), "utf8");

test("YouTube media accepts the ID and common HTTPS link formats", () => {
  const videoId = "BqPwa1SXowE";
  const accepted = [
    videoId,
    `https://www.youtube.com/watch?v=${videoId}`,
    `https://m.youtube.com/watch?v=${videoId}&feature=share`,
    `https://youtu.be/${videoId}?si=6dnx`,
    `https://www.youtube.com/shorts/${videoId}`,
    `https://www.youtube.com/embed/${videoId}`,
    `https://www.youtube.com/live/${videoId}`,
  ];

  for (const value of accepted) {
    assert.equal(normalizeYouTubeVideoId(value), videoId, value);
  }
});

test("YouTube media rejects unsafe hosts, protocols and malformed IDs", () => {
  const rejected = [
    "",
    "not-a-video-id",
    "http://www.youtube.com/watch?v=BqPwa1SXowE",
    "https://youtube.com.evil.example/watch?v=BqPwa1SXowE",
    "https://example.com/?v=BqPwa1SXowE",
    "https://www.youtube.com/watch?v=short",
  ];

  for (const value of rejected) {
    assert.equal(normalizeYouTubeVideoId(value), null, value);
  }
});

test("embed and fallback links are generated only from a validated ID", () => {
  assert.equal(
    youtubeNoCookieEmbedUrl("BqPwa1SXowE"),
    "https://www.youtube-nocookie.com/embed/BqPwa1SXowE?rel=0&modestbranding=1",
  );
  assert.equal(
    youtubeWatchUrl("https://youtu.be/BqPwa1SXowE"),
    "https://www.youtube.com/watch?v=BqPwa1SXowE",
  );
  assert.equal(youtubeNoCookieEmbedUrl("https://evil.example/video"), null);
});

test("admin accepts full links and the storefront renders approved media safely", async () => {
  const dashboard = await read("../components/admin/admin-dashboard.tsx");
  const validation = await read("../lib/catalog/validation.ts");
  const showcase = await read("../components/product-showcase.tsx");
  const page = await read("../app/page.tsx");
  const discord = await read("../lib/discord.ts");

  assert.match(dashboard, /Vídeo demonstrativo do YouTube/);
  assert.match(dashboard, /normalizeYouTubeVideoId/);
  assert.match(dashboard, /maxLength=\{500\}/);
  assert.match(validation, /normalizeYouTubeVideoId\(youtubeInput\)/);
  assert.match(showcase, /youtubeNoCookieEmbedUrl/);
  assert.match(showcase, /<iframe/);
  assert.match(showcase, /allowFullScreen/);
  assert.match(showcase, /activeMedia\?\.kind !== "image"/);
  assert.match(showcase, /Abrir no YouTube/);
  assert.match(page, /OFFICIAL_6DNX_DISCORD_INVITE/);
  assert.match(discord, /https:\/\/discord\.gg\/6dnx/);
  assert.doesNotMatch(page, /5k9tvSerW/);
});
