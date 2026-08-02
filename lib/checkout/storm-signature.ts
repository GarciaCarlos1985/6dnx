import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function stormPayloadDigest(body: Uint8Array) {
  return createHash("sha256").update(body).digest("hex");
}

export function signStormPayload(body: Uint8Array, secret: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function verifyStormSignature(
  body: Uint8Array,
  signature: string | null,
  secret: string,
) {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = Buffer.from(signStormPayload(body, secret), "hex");
  const received = Buffer.from(signature, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
