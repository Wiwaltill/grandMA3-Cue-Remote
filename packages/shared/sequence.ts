// Application validation only; the actual MA pool range must be checked by the live bridge.
export function parseSequenceNumber(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^[0-9]{1,16}$/.test(trimmed)) return null;
  const number = Number(trimmed);
  return Number.isSafeInteger(number) && number > 0 ? String(number) : null;
}
