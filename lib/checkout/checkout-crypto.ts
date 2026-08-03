import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function hmac(label: string, value: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`${label}\0${value}`, "utf8")
    .digest("hex");
}
export function hashPayerDocument(cpf: string, secret: string) {
  return hmac("payer-document-v1", cpf, secret);
}

export function hashRequestFingerprint(value: string, secret: string) {
  return hmac("request-fingerprint-v1", value, secret);
}

export function createCheckoutStatusToken(orderId: string, secret: string) {
  return hmac("checkout-status-v1", orderId, secret);
}

export function verifyCheckoutStatusToken(
  orderId: string,
  token: string,
  secret: string,
) {
  if (!/^[a-f0-9]{64}$/i.test(token)) return false;
  const expected = Buffer.from(createCheckoutStatusToken(orderId, secret), "hex");
  const received = Buffer.from(token, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
