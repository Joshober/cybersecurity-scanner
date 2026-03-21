// Shannon entropy + provider patterns to skip likely-real secrets.

export function shannonEntropy(s: string): number {
  if (s.length === 0) return 0;
  const freq = new Map<number, number>();
  for (let i = 0; i < s.length; i++) {
    const c = s.codePointAt(i)!;
    freq.set(c, (freq.get(c) ?? 0) + 1);
  }
  let h = 0;
  const len = s.length;
  for (const count of freq.values()) {
    const p = count / len;
    h -= p * Math.log2(p);
  }
  return h;
}

/** Strings with high entropy and length are likely real secrets — skip weak-secret match. */
export function isLikelyRealSecret(s: string): boolean {
  if (s.length > 20 && shannonEntropy(s) > 4.5) return true;
  return PROVIDER_PATTERNS.some((re) => re.test(s));
}

export const PROVIDER_PATTERNS: RegExp[] = [
  /^AKIA[0-9A-Z]{16}$/,
  /^sk-[a-zA-Z0-9]{48}$/,
  /^ghp_[a-zA-Z0-9]{36}$/,
  /-----BEGIN .* PRIVATE KEY-----/,
];
