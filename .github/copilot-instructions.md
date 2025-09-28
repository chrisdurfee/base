# Copilot instructions for this repo

Purpose: concise, project-specific guidance so AI agents are instantly productive in this codebase.

## Architecture (what to know first)
- Render UI from plain JS objects (“layouts”)—no templates. Parser turns objects into DOM (browser) or HTML strings (server).
- Public API re-exported by `src/base.js` (e.g., `Builder`, `Component`, `Atom`, `Data`, `SimpleData`, `Model`, `Import`, `NavLink`, `router`, `Html`, `Directives`).
- Runtime renderer switch: `modules/layout/render/*` via `RenderController.setup()` → `BrowserRender` in browser, `ServerRender` otherwise.
- Component stack: `Unit` → `Component`. `Unit` handles lifecycle/context; `Component` adds state (`StateTracker`) and events.
- Reactive data: `modules/data` provides `Data` (deep), `SimpleData` (shallow), `Model` (server-backed). `WatcherHelper` powers `[[prop.path]]` in strings/arrays.

## Authoring layouts (house rules)
- Shape: `{ tag: 'div', class: 'name', children: [...] }`. Shorthands: `nest` → `children`; `text` creates text node; `html|innerHTML` sets raw HTML; buttons default `type: 'button'`.
- Events on elements receive `(event, parentComponent)` and are bound on the element: `{ click(e, parent) { parent.doThing(); } }`.
- Watchers become `watch` directives automatically:
  - Current data: `{ class: 'counter-[[count]]' }`
  - Specific data: `{ value: ['[[path]]', data] }`
- Directives are just attrs mapped in `modules/layout/directives/core/default-directives.js` (e.g., `bind`, `watch`, `map`, `for`, `route`, `switch`, `useState`, `useData`, `onCreated`, `onDestroyed`).

## Components and state/data
- Extend `Component` and implement `render()`; root gets cached as `panel` via `Unit._cacheRoot`. Use `this.getId('child')` for stable ids.
- State: override `setupStates()` (primitive or `{ state, callBack }`). Access via `this.state`, e.g., `this.state.increment('count')`.
- Data: override `setData()` to attach `this.data = new Data(...)` (or `SimpleData`/`Model`). Components with `route`/`switch` receive a bindable `route`.
- Lifecycle: `onCreated`, `beforeSetup`, `afterSetup`, `afterLayout`, `beforeDestroy`. For survival across re-renders, set parent `persist: true` (child may opt-out with `persist: false`).

## Rendering and routing
- Render anything (function/layout/Unit/Component): `Builder.render(x, container, parent?)`. Non-Unit inputs are wrapped in a `Jot` component.
- Router: `router.data.path` is reactive; navigate via `router.navigate(uri, data?, replace?)`. `NavLink` uses `[value: ['[[path]]', router.data]]` to track active path.

## Build and types
- Build to `dist/` with esbuild + TypeScript declarations: `npm run build` (bundles `src/base.js`, ESM, minified, sourcemaps; emits `dist/types/*.d.ts`).
- Consumers import from package root; `exports` maps ESM/CJS to `dist/base.js`.

## Pointers to examples
- Rendering: `modules/layout/render/{browser-render,server-render}.js`; Parser: `modules/layout/element/parser.js` + `modules/layout/watcher-helper.js`.
- Components: `modules/component/{unit.js,component.js}`; Directives registry: `modules/layout/directives/core/default-directives.js`.
- Data: `modules/data/types/**`; Router: `modules/router/router.js`, `modules/router/nav-link.js`.

Questions or gaps? Open an issue or add comments here with file pointers so we can refine these rules.