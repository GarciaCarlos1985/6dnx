import type { NewsArticle } from "@/lib/news/types";

/**
 * Last-resort content from the official Steam feeds. The live Steam feed or
 * Supabase wins whenever available, so a network incident never leaves an
 * empty, broken section in the commercial page.
 */
export const seedNews: NewsArticle[] = [
  {
    id: "seed-dayz-flash-sale",
    externalId: "steam:221100:1839041357032362",
    slug: "dayz-flash-sale-1839041357032362",
    title: "Flash Sale de DayZ",
    summary:
      "DayZ e seus pacotes entram em uma promoção-relâmpago de até 50%, junto da atualização Road to Badlands.",
    gameName: "DayZ",
    category: "community",
    sourceName: "DayZ · Steam",
    sourceUrl:
      "https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1839041357032362",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/221100/header.jpg",
    publishedAt: "2026-07-25T17:05:12.000Z",
    featured: true,
  },
  {
    id: "seed-arc-store-update",
    externalId: "steam:1808500:1838407329268489",
    slug: "arc-raiders-store-update-1-38-1838407329268489",
    title: "Store Update 1.38.0",
    summary:
      "ARC Raiders recebe novas cores para o conjunto Torpedo e ajustes ligados à Expedition Departure.",
    gameName: "ARC Raiders",
    category: "update",
    sourceName: "ARC Raiders · Steam",
    sourceUrl:
      "https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1838407329268489",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/1808500/header.jpg",
    publishedAt: "2026-07-21T09:00:50.000Z",
    featured: false,
  },
  {
    id: "seed-cs2-update",
    externalId: "steam:730:1838407329267700",
    slug: "counter-strike-2-update-1838407329267700",
    title: "Counter-Strike 2 Update",
    summary:
      "A Valve atualiza interações da bomba, fumaças e incendiários, além de renovar mapas da Oficina.",
    gameName: "Counter-Strike 2",
    category: "update",
    sourceName: "Counter-Strike 2 · Steam",
    sourceUrl:
      "https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1838407329267700",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg",
    publishedAt: "2026-07-20T23:13:36.000Z",
    featured: false,
  },
  {
    id: "seed-dayz-badlands",
    externalId: "steam:221100:1838407329259131",
    slug: "dayz-badlands-outubro-1838407329259131",
    title: "DayZ Badlands chega em outubro",
    summary:
      "A maior expansão de DayZ ganha novo teaser e uma janela de lançamento para outubro.",
    gameName: "DayZ",
    category: "release",
    sourceName: "DayZ · Steam",
    sourceUrl:
      "https://steamstore-a.akamaihd.net/news/externalpost/GamingOnLinux/1838407329259131",
    imageUrl: "https://cdn.akamai.steamstatic.com/steam/apps/221100/header.jpg",
    publishedAt: "2026-07-17T10:49:04.000Z",
    featured: false,
  },
];
