# Phases 1 and 2 — memory, teardown and correctness fixes

Shipping as `3.9.8`, a patch release off `3.9.7`. Every change is a behavior fix; no
public API was removed or renamed. The 17 `it.fails` specs written in
Phase 0 now pass and are flipped to `it`. One test was added, so the suite
is 65 tests across 13 files.

Phase 0's numbers stay in `phase-0-baseline.md` and are the comparison
point throughout.

## Verification status

| gate | result |
| --- | --- |
| `npm run test:run` | 65 passed / 65 |
| `npx tsc --noEmit` | clean |
| `npm run build` | clean |
| `npm run size:check` | no entry regressed past 3% |
| remaining `it.fails` | none |

## Success metrics

The two metrics that were structurally broken are fixed, and the results
reproduced across four consecutive benchmark runs.

| metric | phase 0 | now | change |
| --- | --- | --- | --- |
| subscribers after 50 list updates | 102,001 | 2,001 | back to the mount count |
| subscriber growth per update | 2,000 | 0 | leak eliminated |
| `unbounded` verdict | `true` | `false` | — |
| retained heap after 20 mount/unmount cycles | 15,682,512 b | ~317,000 b | −98% |
| retained per cycle | 784,126 b | ~15,900 b | −98% |

Subscriber count now returns exactly to `subscribersAtMount` (2,001) after
50 re-renders of a 1,000 row list, which is the steady state the harness
defines as correct.

### The wall-clock timings are not trustworthy on this machine

`list.update.1000Rows` measured 112.8, 84.1, 110.5 and 128.4 ms across the
four runs against a 136.8 ms baseline — improved in all four, but the
spread is too wide to quote a figure.

Other timings are worse than that. `publish.fanOut.sameProp` measured
0.861, 15.155, 14.984 and 1.237 ms **on identical code**, a 17x spread.
`list.build.1000Rows` ranged 60 to 205 ms. `deepData.set.coldCache`
ranged 66 to 198 ms against a 46.7 ms baseline, and
`router.navigate.cacheMiss` moved 172% despite no change touching the
router match path.

The 0.861 ms fan-out reading was initially mistaken for an 18x win. It was
noise. Deliveries were checked directly before drawing any conclusion —
1,000 subscribers × 15 flushes delivered 15,000 of 15,000 callbacks — and
that check is now a permanent test rather than a one-off script, because a
"fast" pub/sub is exactly what a dropped-message regression looks like.

**`bench-baseline.json` should be regenerated on an idle machine before it
is committed.** The file currently holds one of the noisy runs. The
leak and memory fields in it are sound; the millisecond fields are not.

## Bundle size

| | phase 0 gzip | now | change |
| --- | --- | --- | --- |
| `dist/base.js` | 29,763 | 30,526 | +763 (+2.6%) |
| all distinct live outputs | 62,812 | 64,376 | +1,564 (+2.5%) |

Under the 3% gate but not free: the fixes add the link records, the
reference counts, the scope tracking and the shared LRU module. The
component-vs-root success metric is unchanged at +1.5%, as expected —
that is the bundle-restructuring phase's target, not this one.

`size-baseline.json` was regenerated and now describes the post-fix build.
Phase 0's per-entry numbers survive in `phase-0-baseline.md`; the chunk
hashes changed, so the old file could not have been restored faithfully
anyway.

## Phase 1 — memory and teardown

**1. `unlink()` always no-opped.** `Objects.isEmpty(this.links)` walked own
keys of a `Map`, which reports every populated map as empty, so the method
returned before doing anything. The call site now tests `links.size === 0`.
`Objects.isEmpty` was also taught about `Map` and `Set` so the next caller
does not hit the same trap; its two other call sites pass plain objects and
are unaffected. `DataTracker.isEmpty` was checked and already handled maps
correctly.

**2. `removeLink()` unsubscribed the wrong thing.** It called
`data.off(token)` with one argument where `off(attrName, token)` is the
signature, so the attr was used as the token and nothing was removed. A
link record is now `{ data, attr, pair }`, and `removeLink` unsubscribes
with the stored attr. It also tears down the opposite direction via `pair`;
previously the remote kept both its callBack and a link record pointing
back, so releasing one side left half a link alive.

**3. `BasicData.remove()` was an empty placeholder.** It now calls
`unlink()` and resets the event sub.

**4. Local state action callbacks were never released.** Local tokens are
recorded on the state entry and released in a new
`stateHelper.removeLocalStates()`, which `Component.removeStates()` calls.
`restore()` re-subscribes them so a resumed component keeps working.

**5. `StateTracker.targets` grew forever.** Targets are reference counted
through `attach()` / `addOwner()` / `detach()`; the target is only removed
when its last consumer detaches. `Component.setupStateTarget()` now uses
`attach()` so the count reflects reality.

**6. Scoped row `Data` leaked.** The `for` directive allocates a scoped
`Data` per row, each linking onto the parent, and nothing released them.
Scopes created per render are tracked and disposed on the next re-render,
plus on element destroy through a `forScopes` data-tracker type. This is
the fix behind the 100,000-subscriber and 784 KB-per-cycle numbers.

**7. `trackContext` was dead code.** Now called from `addContext`, so a
context branch is dropped when its element is destroyed.

**8. Router teardown.** `destroy()` calls `history.removeEvent()` — the
history controller otherwise keeps a window listener holding every route
and route component for the life of the page. `removeRoute()` calls
`route.deactivate()` before splicing, matching what `reset()` does.

**9. Unbounded module caches.** New `src/shared/lru-cache.js` backs
`segmentCache` (1000), `eventMessageCache` (2000), `_watcherPropsCache`
(1000) and `importCache` (100). Keys in the first two are data paths, so
the old plain maps grew with every row a long-lived page ever rendered.

## Phase 2 — correctness

**1. `null` wiped an element's children.** A watcher returning `null` hit
the `case 'object'` branch and was treated as a layout object. Guarded.

**2. `hash-history` passed a full URL** to `checkActiveRoutes`, which
expects a pathname-style uri, so no route matched on `hashchange`. A
`Utils.getHashUri()` helper does the normalizing, reusing the convention
`Router.getPath()` already follows for hash routing.

**3. `deepDataPattern` was broken.** `/(\w+)|(?:\[(\d)\))/g` closes its
bracket alternative with `\)`, so that branch could never match; paths only
parsed because `\w+` happened to catch the digits inside brackets, and only
for single digits. `getSegments` now uses a single-pass scanner that
actually understands brackets, keeps the prototype-pollution block, and
handles `a.b`, `phones[0]`, `phones[10]` and `a.b[2].c`. The pattern itself
is retained and marked deprecated because it is a published property of
`DataUtils`, and the Phase 0 test that documents its breakage still passes.

**4. `LRUCache.get()` did not promote on read**, making eviction FIFO
rather than LRU. It promotes now. Promotion is skipped while the cache is
under capacity, since recency only decides who gets evicted and these
caches sit on per-publish and per-render paths — exact LRU where it
matters, no map churn where it cannot.

**5. Deep `delete` did not publish to `dataBinder`.** Elements bound
through the binder kept rendering a deleted value. It now publishes to both
channels. The published value is `null` rather than the path string the old
walk handed out, which matches what `BasicData` sends for a delete; a bound
input would otherwise have displayed the path.

**6. `invalidateProxyCache` was never called.** Wired into the proxy `set`
trap for the case it was written for: an object being replaced. Its cached
proxies are bound to the path they were created for, so a detached object
that gets reattached elsewhere would otherwise be handed a proxy that
writes to the old path.

**7. `Pod` threw on `state: {...}`.** `Jot` wrapped a non-function
`setupStates` in a factory; `Pod` assigned it raw, so the component called
an object. The wrapper moved to `shorthand-methods.js` as
`getShorthandMethod` and both paths use it, which also removes the
duplicate.

**8. `Animation.step()` did not exist.** Implemented — it steps each of the
animation's movements — with a null guard at the controller call site.
Implemented rather than deleted, per the 3.x preference.

**9. The pub/sub circuit breaker dropped unrelated updates.** On tripping
`maxFlushIterations` it called `updateQueue.clear()`, discarding everything
queued at that moment. It now identifies which messages actually
re-published themselves (`deliveringMessage`, `reentrantMessages`), drops
only those, and drains the rest with `suppressQueue` set so the cascade
cannot restart. `reset()` no longer zeroes the module-level token counter,
which could hand out a token that was already live.

**10. Null guards and a duplicate call.** `stateHelper` is optional-chained
in `addStates()`. `Unit._remove()` no longer calls `removeContext()` a
second time — `Component.prepareDestroy()` already did.

**11. Teardown drift between `Unit` and `Component`.** Resolved in
`Component`'s favour. `Unit.prepareDestroy()` unlinked data
unconditionally; `Component`'s guards on `persist !== true`. Unconditional
is wrong: `resumeScope` restores a persisted data instance without
re-running the setup that created its links, so unlinking leaves a resumed
unit holding data that no longer tracks its remote sources. When the remote
side is destroyed it releases both directions anyway — which is only true
because of fix 2 above. `removeContext()` also moved into
`Unit.prepareDestroy()`, so units torn down by the data tracker on DOM
removal release their context branch too; previously only the explicit
`_remove()` path did.

## Token annotations

Fixing `removeLink` surfaced a pre-existing contradiction in the JSDoc:
`on()` returned `number` while `remoteLink()`, `addLink()` and
`removeLink()` declared `string`. The old broken call passed one argument,
so the second parameter was never checked.

`number` is authoritative — `DataPubSub.on()` does `const token =
++lastToken` and `subscribers.set(token, cb)`, a numeric map key. The
annotations were corrected to say so in `basic-data.js` (`link`,
`remoteLink`, `addLink`, `unlink`, `removeLink`, the `links` map type),
`state-helper.js` (`bindRemoteState`, `unbindRemoteState`, `addAction`) and
`state-tracker.js` (`removeAction`, `off`, `remove`).

Not done: coercing with `String(token)`, which would have type-checked
while silently breaking unsubscription, since `delete('4')` does not remove
entry `4` from a map keyed by numbers. No `@ts-ignore` was added; two
existing ones in `objects.js` turned out to be unnecessary and were
removed.

The links map is keyed with the raw numeric token on both sides of a pair.
The Phase 0 leak assertions were strengthened accordingly: `unlink()`
emptying the map is no longer asserted by size alone, because a delete with
the wrong key type would satisfy that while leaving both callBacks
subscribed. Subscriber counts on both sources are now checked directly, and
the propagation specs mutate the remote and assert silence.

## Known follow-ups

- `bench-baseline.json` needs a clean re-run on an idle machine.
- `deepData.set.coldCache` read above baseline in every run (66–198 ms vs
  46.7 ms). The spread overlaps the noise floor of the other benches, so it
  is unproven either way, but the segment parser rewrite is on that path
  and is the first place to look if it is real.
- `Unit._cacheRoot` was left alone as instructed.
