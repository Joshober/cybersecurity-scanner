# Framework vulnerability seeds (Angular + Next.js)

Minimal first-party files used to **regression-test** VibeScan line anchoring and framework-specific rules. They are intentionally vulnerable snippets—not runnable apps.

## Layout

| Path | Intended signal | Catalog line anchor |
|------|-----------------|---------------------|
| `angular/bypass.component.ts` | `DomSanitizer` bypass (`injection.xss.angular-sanitizer-bypass`) | 10 |
| `nextjs/app/redirect/route.ts` | Open redirect via `NextResponse.redirect` + `request.nextUrl` (`injection.open-redirect`) | 4 |
| `nextjs/app/sql/route.ts` | SQL template literal with `request` query (`injection.sql.string-concat`) | 5 |
| `nextjs/app/xss/page.tsx` | `dangerouslySetInnerHTML` with dynamic HTML (`injection.xss.react-dangerously-set-inner-html`) | 3 |
| `nextjs/lib/db.ts` | Stub `db` for the SQL route | — |

Files use **Acorn-parseable JavaScript** (no TypeScript-only syntax) so VibeScan’s parser matches CI behavior.

## Catalog + scan

- Case definitions: `results/framework-vuln-case-catalog.json`
- Scan seeds: `node benchmarks/scripts/run-framework-vuln-scan.mjs`
- Unit tests: `vibescan/tests/unit/framework-seed-benchmark.test.mjs`
