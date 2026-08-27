# Phase 0 — Verification Harness Baseline

Phase 0 adds measuring instruments only. No framework behavior was changed.
Every number below was captured on the commit that introduced this file so
later phases can be proven rather than argued.

Captured on Node v24.11.0, Windows, `esbuild` 0.25.x.

## How to re-run the tooling

| Command | What it does |
| --- | --- |
| `npm test` | vitest in watch mode |
| `npm run test:run` | vitest single pass (CI) |
| `npm run size` | build in memory, print the size table, rewrite `size-baseline.json` |
| `npm run size:check` | build in memory, compare against `size-baseline.json`, exit 1 on regression |
| `npm run bench` | run the runtime benchmarks, rewrite `bench-baseline.json` |
| `npm run build` | unchanged: `node ./esbuild.js && tsc` |

Extra flags:

- `node ./scripts/size-report.js --verbose` lists every live chunk per entry.
- `node ./scripts/size-report.js --check --threshold=5` overrides the default 3%.
- `node --expose-gc ./scripts/bench.js --quick` runs a reduced workload.
- `node --expose-gc ./scripts/bench.js --env=node` skips the DOM suites.

## Test harness

- Runner: `vitest` with the `jsdom` environment (`vitest.config.js`).
- Files run sequentially in a single forked worker. Standing up a jsdom
  document dominates the wall clock, and parallel workers were starving the
  pool on Windows. Module isolation per file is still on, so the framework
  singletons (`dataBinder`, `Directives`, `StateTracker`) start clean per suite.
- `tests/setup.js` stubs `window.scrollTo` / `Element.prototype.scrollIntoView`,
  which jsdom does not implement and the router calls on every navigation.
- `tests/helpers.js` holds `flush`, `createContainer`, `resetBody`,
  `countSubscribers` and `countMessages`. `countSubscribers` walks
  `data.eventSub.callBacks` and is the leak metric used by several suites.

Every test that documents a defect uses `it.fails` and carries a comment
naming the source file and line of the bug. When Phase 1 fixes a bug, the
corresponding `it.fails` starts failing (because it now passes) and must be
flipped to `it`. That is the intended signal.

## Bundle size baseline

gzip level 9, brotli quality 11 (zlib max). Source maps excluded — they are
stripped from the published package by the `files` field. Chunk graphs are
resolved from the esbuild metafile, never by globbing `dist/chunks/`, because
esbuild does not clean its outdir and the directory holds ~58 chunk files of
which only 6 are live.

| entry | output | live chunks | raw | gzip | brotli |
| --- | --- | --- | --- | --- | --- |
| root | `dist/base.js` | 0 | 96,385 | 29,763 | 26,450 |
| ajax | `dist/modules/ajax.js` | 2 | 9,320 | 3,697 | 3,301 |
| html | `dist/modules/html.js` | 2 | 21,455 | 7,046 | 6,340 |
| date | `dist/modules/date.js` | 0 | 6,035 | 2,049 | 1,832 |
| data | `dist/modules/data.js` | 4 | 45,910 | 15,935 | 14,318 |
| state | `dist/modules/state.js` | 5 | 47,069 | 16,416 | 14,756 |
| component | `dist/modules/component.js` | 6 | 89,211 | 30,196 | 27,273 |
| router | `dist/modules/router.js` | 6 | 88,244 | 29,688 | 26,801 |

Distinct live outputs across all entries: 14 files — 8 entry files plus 6
shared chunks — raw 192,762, gzip 62,812, brotli 56,212.

### Success metric: component vs root gzip

`component` subpath gzip is **30,196**, which **EXCEEDS** the root bundle gzip
of **29,763** by **433 bytes (1.5%)**. Importing only the component toolkit
currently costs more compressed bytes than importing the whole framework from
the package root, even though the component entry should be a strict subset.
Driving this delta negative is the goal of the bundle-restructuring phase.

The cause is visible in `--verbose`: `component` pulls 6 of the 6 live chunks
(41,116 raw from `chunk-L4273GAO` alone) because the shared chunks are cut on
module boundaries rather than on what each entry actually needs.

## Runtime benchmark baseline

Full run (`npm run bench`), jsdom environment, forced GC.

### Deep data — 10,000 operations per iteration

| benchmark | median | p95 | n |
| --- | --- | --- | --- |
| `deepData.set.hotCache` | 6.264 ms | 8.636 ms | 15 |
| `deepData.set.coldCache` | 46.663 ms | 81.314 ms | 15 |
| `deepData.get.hotCache` | 1.666 ms | 2.763 ms | 15 |
| `deepData.get.coldCache` | 9.028 ms | 27.133 ms | 15 |

Cold cache is 7.4x slower than hot on `set` and 5.4x on `get`. The cold path
is dominated by `DataUtils.getSegments` re-parsing, which is also where the
broken LRU promotion (defect 8) lives.

### Publish fan-out — 1,000 registered watchers

| benchmark | median | p95 | n |
| --- | --- | --- | --- |
| `publish.fanOut.sameProp` | 15.474 ms | 16.038 ms | 15 |
| `publish.fanOut.nestedPaths` | 13.349 ms | 14.382 ms | 8 |

### Large list — 1,000 rows through the `for` directive

| benchmark | median | p95 | n |
| --- | --- | --- | --- |
| `list.build.1000Rows` | 45.910 ms | 50.740 ms | 5 |
| `list.update.1000Rows` | 136.824 ms | 232.188 ms | 50 |

### Subscriber leak metric — CONFIRMED UNBOUNDED

| field | value |
| --- | --- |
| rows | 1,000 |
| updates | 50 |
| subscribers at mount | 2,001 |
| subscribers after 50 updates | 102,001 |
| total growth | 100,000 |
| growth per update | 2,000 |
| growth per update per row | 2 |
| first update growth | 2,000 |
| last update growth | 2,000 |
| unbounded | `true` |

Growth is exactly 2 subscribers per row per update and does not decay — the
first and last update leak identically, so this is linear-forever, not a
warmup artifact. Steady-state re-rendering should return to the mount count of
2,001. Root cause is the scoped-row leak of defect 5: the `for` directive
allocates a scoped `Data` per row via `data.scope(...)`, which links onto the
parent, and nothing unlinks them on re-render (and `unlink()` is broken anyway
per defects 1 and 2).

### Router — 200 routes

| benchmark | median | p95 | n |
| --- | --- | --- | --- |
| `router.navigate.cacheMiss.200Routes` | 0.271 ms | 0.851 ms | 100 |
| `router.navigate.cacheHit.200Routes` | 0.014 ms | 0.038 ms | 100 |

Cache hit is ~19x faster than a miss, so route-match caching is working. The
miss path is the one that scales with route-table size.

### Memory — 20 mount/unmount cycles of a 1,000 row list

| field | value |
| --- | --- |
| GC forced | `true` |
| cycles | 20 |
| rows per cycle | 1,000 |
| heapUsed before | 52,245,192 bytes |
| heapUsed after | 67,927,704 bytes |
| retained delta | 15,682,512 bytes |
| retained per cycle | 784,126 bytes |

Measured around an explicit `global.gc()`, so this is retained memory, not
garbage awaiting collection. ~784 KB survives every mount/unmount cycle.

## Behavior-neutral source changes

None. No file under `src/` was modified. The only non-additive change is
`esbuild.js`, which was refactored to *export* its option objects
(`shared`, `rootEntryPoints`, `featureEntryPoints`, `createRootOptions`,
`createFeatureOptions`, `runBuild`) so `scripts/size-report.js` consumes the
same configuration instead of duplicating it. The build only runs when the
file is executed directly, so importing it for its options does not write to
`dist`. The produced options are byte-identical to before and
`npm run build` output is unchanged.

## Notes against the hand-measured baseline

| measurement | by hand | by tooling | delta |
| --- | --- | --- | --- |
| `dist/base.js` raw | 96,385 | 96,385 | 0 |
| `dist/base.js` gzip | 29,811 | 29,763 | -48 |
| `component` + chunks raw | 89,211 | 89,211 | 0 |
| `component` + chunks gzip | 30,193 | 30,196 | +3 |
| `dist/modules/date.js` raw | 6,035 | 6,035 | 0 |
| `dist/modules/date.js` gzip | 2,045 | 2,049 | +4 |

Raw bytes match exactly. The gzip deltas are compression-setting noise
(a gzip container stores an optional filename and timestamp, and level 9 vs
the default level 6 moves a few dozen bytes). The tooling numbers are the
authoritative baseline going forward since they are reproducible.
