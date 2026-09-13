// The advertised Solo Pass price. The signup funnel prints this figure on the
// GCash/Maya QR step, so it must match what every other surface shows.
export const SOLO_PASS_PRICE_PHP = 99;

// The live subscription_packages row still carries an older price. Pinning the
// Solo Pass figure here keeps the landing copy from advertising one amount
// while the signup QR step tells people to send another. Correct the row in
// Admin -> Packages and this becomes a no-op. Plus/Max are left untouched.
export function withCanonicalPrice<T extends { code: string; price_php: number } | null>(
  pkg: T
): T {
  if (!pkg || pkg.code !== "solo") return pkg;
  return { ...pkg, price_php: SOLO_PASS_PRICE_PHP };
}
