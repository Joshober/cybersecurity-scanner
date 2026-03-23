/**
 * Shannon entropy of a string (base-2).
 * @param {string} s
 * @returns {number}
 */
export function shannonEntropy(s) {
  if (!s.length) return 0;
  const freq = new Map();
  for (const ch of s) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }
  let h = 0;
  const n = s.length;
  for (const c of freq.values()) {
    const p = c / n;
    h -= p * Math.log2(p);
  }
  return h;
}

const AWS_KEY = /^AKIA[0-9A-Z]{16}$/;
const GITHUB_TOKEN = /^gh[pousr]_[A-Za-z0-9_]{20,}$/;
const OPENAI_SK = /^sk-[A-Za-z0-9]{20,}$/;

/**
 * Skip reporting when string looks like a real secret placeholder.
 * @param {string} value
 * @returns {boolean} true = skip (likely real secret)
 */
export function shouldSkipHighEntropySecret(value) {
  if (value.length > 20 && shannonEntropy(value) > 4.5) return true;
  if (AWS_KEY.test(value)) return true;
  if (GITHUB_TOKEN.test(value)) return true;
  if (OPENAI_SK.test(value)) return true;
  return false;
}
