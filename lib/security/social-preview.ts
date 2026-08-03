const SOCIAL_PREVIEW_IMAGE_PATH =
  /^\/(?:opengraph-image|twitter-image)\.(?:gif|jpe?g|png)$/i;

export function isSocialPreviewImagePath(pathname: string) {
  return SOCIAL_PREVIEW_IMAGE_PATH.test(pathname);
}
