// Converts a human amount (e.g. 100.5) into the raw integer string a
// contract expects (e.g. "100500000" for 6 decimals). Uses BigInt
// throughout so it doesn't suffer floating-point drift on 18-decimal tokens.
export function toRawAmount(amount: number, decimals: number): string {
  const [whole, frac = ""] = amount.toString().split(".");
  const paddedFrac = (frac + "0".repeat(decimals)).slice(0, decimals);
  const wholeBig = BigInt(whole || "0") * BigInt(10) ** BigInt(decimals);
  const fracBig = BigInt(paddedFrac || "0");
  return (wholeBig + fracBig).toString();
}

// Converts a raw integer string back to a display-friendly number.
// Only used for showing amounts in the UI — actual transaction amounts
// stay as raw strings the whole way through, so this never affects funds.
export function fromRawAmount(raw: string, decimals: number): number {
  const big = BigInt(raw);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = big / divisor;
  const remainder = big % divisor;
  return Number(whole) + Number(remainder) / Number(divisor);
}