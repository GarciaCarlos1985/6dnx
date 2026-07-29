import "server-only";

export async function readBoundedResponseJson<T>(
  response: Response,
  maxBytes: number,
): Promise<T> {
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error("Upstream response exceeded its configured byte limit");
  }
  if (!response.body) {
    throw new Error("Upstream response returned an empty body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel("Upstream response exceeded its byte limit");
        throw new Error("Upstream response exceeded its configured byte limit");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  return JSON.parse(text) as T;
}
