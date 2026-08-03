const CPF_DIGITS = 11;

export function normalizePayerName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidPayerName(value: string) {
  const normalized = normalizePayerName(value);
  if (normalized.length < 3 || normalized.length > 100) return false;

  const parts = normalized.split(" ").filter(Boolean);
  return (
    parts.length >= 2 &&
    parts.every((part) => /^[\p{L}]+(?:['’.\-][\p{L}]+)*$/u.test(part))
  );
}

export function normalizeCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, CPF_DIGITS);
}

export function formatCpf(value: string) {
  const digits = normalizeCpf(value);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function cpfDigit(digits: string, factor: number) {
  let total = 0;
  for (const digit of digits) {
    total += Number(digit) * factor;
    factor -= 1;
  }

  const remainder = (total * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

export function isValidCpf(value: string) {
  const digits = normalizeCpf(value);
  if (digits.length !== CPF_DIGITS || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const first = cpfDigit(digits.slice(0, 9), 10);
  const second = cpfDigit(digits.slice(0, 10), 11);
  return first === Number(digits[9]) && second === Number(digits[10]);
}
