# VibeScan — Cursor Development Checklist

Work top-to-bottom. See [RULES.md](./RULES.md) for rule specs.

## Phase 1 · Project Scaffold

- [x] npm package `vibescan`, `bin` → `src/cli.js`
- [x] Folder structure under `vibescan/`
- [x] Dependencies: `@babel/parser`, `@babel/traverse`, `chalk`, `commander`, `ora`, dev `jest`, `nodemon`
- [x] `"type": "module"`

## Phase 2 · AST Extractor

- [x] `extractRoutes(dirPath)` — `.js` / `.ts`, Babel parse + traverse
- [x] Route patterns: `app|router` HTTP verbs, `app.use(prefix, router)`
- [x] `routeGraph.js` — normalized route objects
- [x] Mount propagation, router aliases, middleware chain, `req.*` fields
- [x] Unit tests vs `tests/fixtures/`

## Phases 3–8

- [x] Rule engine (`src/rules/`)
- [x] Payloads + secret dictionaries + entropy
- [x] Slopsquat `registryChecker.js`
- [x] Test generator `testWriter.js`
- [x] CLI: `scan`, `rules`, flags

## Phase 9–10 · Evaluation & polish

- [x] Sample fixtures + benchmark script
- [x] README, RULES, CONTRIBUTING, GitHub Action
