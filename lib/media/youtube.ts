const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

export function normalizeYouTubeVideoId(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const candidate = value.trim();
  if (!candidate) return null;
  if (YOUTUBE_VIDEO_ID_PATTERN.test(candidate)) return candidate;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || !YOUTUBE_HOSTS.has(url.hostname)) {
    return null;
  }

  let videoId: string | null = null;
  if (url.hostname === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (url.pathname === "/watch") {
    videoId = url.searchParams.get("v");
  } else {
    const [section, id] = url.pathname.split("/").filter(Boolean);
    if (section === "embed" || section === "shorts" || section === "live") {
      videoId = id ?? null;
    }
  }

  return videoId && YOUTUBE_VIDEO_ID_PATTERN.test(videoId) ? videoId : null;
}

export function youtubeNoCookieEmbedUrl(value: unknown): string | null {
  const videoId = normalizeYouTubeVideoId(value);
  return videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
    : null;
}

export function youtubeWatchUrl(value: unknown): string | null {
  const videoId = normalizeYouTubeVideoId(value);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}
