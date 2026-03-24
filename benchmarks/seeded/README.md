# Seeded corpora (minimal, committable)

Small snippets for regression and per-rule smoke checks. Expand over time; map folders to CWE / rule families.

LLM-oriented threat **tags** for benchmark cases are documented in [`../../docs/vibescan/seeded-benchmark-plan.md`](../../docs/vibescan/seeded-benchmark-plan.md) (column **LLM threat tags**).

| Path | Intent |
|------|--------|
| [`crypto/pos-weak-hash.js`](./crypto/pos-weak-hash.js) | Expect `crypto.hash.weak` |
| [`injection/pos-sql-concat.js`](./injection/pos-sql-concat.js) | Expect SQL injection / taint signal on DVNA-style concat |
| [`llm/pos-dynamic-system.js`](./llm/pos-dynamic-system.js) | SB-14 — `injection.llm.dynamic-system-prompt` |
| [`llm/pos-rag-template.js`](./llm/pos-rag-template.js) | SB-15 — `injection.llm.rag-template-mixing` |
| [`llm/pos-llm-innerhtml.js`](./llm/pos-llm-innerhtml.js) | SB-16 — `injection.llm.unsafe-html-output` |
| [`slop-case/package.json`](./slop-case/package.json) | SB-11 — run project scan with `--check-registry` for `SLOP-001` |

**Ground truth:** Run `npm run build -w vibescan` then:

```bash
node vibescan/dist/system/cli/index.js scan benchmarks/seeded --format json --exclude-vendor
```

For **SLOP-001** on the slop fixture only:

```bash
node vibescan/dist/system/cli/index.js scan benchmarks/seeded/slop-case --check-registry --format json
```

and adjudicate findings in a dated folder under [`../results/`](../results/) (see [`../results/README.md`](../results/README.md)).

Full fixtures also live under [`../../vibescan/tests/fixtures/`](../../vibescan/tests/fixtures/).
