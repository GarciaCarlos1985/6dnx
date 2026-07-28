import "server-only";

export class BoundedJsonError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 413,
  ) {
    super(message);
    this.name = "BoundedJsonError";
  }
}

export async function readBoundedJson<T>(
  request: Request,
  maxBytes: number,
): Promise<T> {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new BoundedJsonError("Payload muito grande", 413);
  }
  if (!request.body) {
    throw new BoundedJsonError("Payload inválido", 400);
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel("Request body exceeded its configured limit");
        throw new BoundedJsonError("Payload muito grande", 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    if (error instanceof BoundedJsonError) throw error;
    throw new BoundedJsonError("Payload inválido", 400);
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new BoundedJsonError("Payload inválido", 400);
  }
}
