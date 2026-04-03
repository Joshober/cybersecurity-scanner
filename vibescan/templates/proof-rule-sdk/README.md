# VibeScan proof rule SDK (author template)

Use this when adding a **proof-backed** rule family: a generator that emits `node:test` files for local, deterministic checks.

## Steps

1. Copy [`src/system/proof/generators/_template.ts`](../../src/system/proof/generators/_template.ts) to `generators/<yourRule>.ts` and implement `supports()` / `emit()`.
2. Set `failureCode` from `proof/taxonomy.ts` when proof is partial or unsupported.
3. Optionally set `harness: { isolation: "pure" | "mock", notes?: string }` on the generator.
4. Register the generator in [`proof/registry.ts`](../../src/system/proof/registry.ts) (order matters: first match wins).
5. Add a fixture under `tests/fixtures/` and a unit test under `tests/unit/`.

## References

- CI: [`docs/vibescan/CI-PROVE.md`](../../../docs/vibescan/CI-PROVE.md)
