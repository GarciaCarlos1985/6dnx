const SOCIAL_PREVIEW_IMAGE_PATH =
  /^\/(?:opengraph-image|twitter-image)\.(?:gif|jpe?g|png)$/i;

const PUBLIC_CRAWLER_RESOURCE_PATH =
  /^\/(?:robots\.txt|sitemap\.xml|favicon\.ico|icon(?:-\d+x\d+)?\.png|apple-icon\.png)$/i;

export function isSocialPreviewImagePath(pathname: string) {
  return SOCIAL_PREVIEW_IMAGE_PATH.test(pathname);
}

export function isPublicCrawlerResourcePath(pathname: string) {
  return (
    isSocialPreviewImagePath(pathname) ||
    PUBLIC_CRAWLER_RESOURCE_PATH.test(pathname)
  );
}
