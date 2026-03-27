# Seeded corpora (minimal, committable)

Small snippets for regression and per-rule smoke checks. Expand over time; map folders to CWE / rule families.

| Path | Intent |
|------|--------|
| [`crypto/pos-weak-hash.js`](./crypto/pos-weak-hash.js) | Expect `crypto.hash.weak` |
| [`injection/pos-sql-concat.js`](./injection/pos-sql-concat.js) | Expect SQL injection / taint signal on DVNA-style concat |

**Ground truth:** Run `npm run build` then:

```bash
npx vibescan scan benchmarks/seeded --format json --exclude-vendor
```

and adjudicate findings in [`../results/`](../results/) or a dated run folder.

Full fixtures also live under [`../../vibescan/tests/fixtures/`](../../vibescan/tests/fixtures/).
