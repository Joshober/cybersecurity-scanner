# Seeded golden run notes

- `RUN_ID`: `2026-03-23_seeded_vibescan_v1.0.0+04e93ca`
- Corpus: `benchmarks/seeded` (2 files)
- Command:
  - `node dist/system/cli/index.js scan benchmarks/seeded --format json --project-root benchmarks/seeded --exclude-vendor --benchmark-metadata --export-adjudication vibescan-adjudication`
- VibeScan exit code: `1` (non-zero because at least one finding had severity `error`)
- Findings emitted:
  - `crypto.hash.weak` in `benchmarks/seeded/crypto/pos-weak-hash.js`
  - `MW-003` (missing `helmet()`) in `benchmarks/seeded/injection/pos-sql-concat.js`
- Seeded ground truth expects:
  - `crypto.hash.weak` (present; TP)
  - an injection string-concat / taint signal in `pos-sql-concat.js` (not emitted in this run; tracked as FN in the scoring notes)

