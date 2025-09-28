# Copilot Guide for Base

This guide helps AI agents (and humans) work effectively with the Base framework when this repo is open in the editor.

## Core concepts
- Layouts are plain JS objects parsed into DOM (browser) or HTML strings (server). See: `modules/layout/element/parser.js`, `modules/layout/render/*`.
- Public API: `src/base.js` re-exports `Builder`, `Component`, `Atom`, `Data`, `SimpleData`, `Model`, `Import`, `NavLink`, `router`, `Html`, `Directives`, etc.
- Units and Components: `Unit` provides lifecycle/context; `Component` adds state/events. See: `modules/component/{unit.js,component.js}`.
- Data types: `Data` (deep), `SimpleData` (shallow), `Model` (server-backed). See: `modules/data/types/**`.

## Atoms (from wiki)
- Create atoms with `Atom((props, children) => layout)`. Optional args supported:
  - `Div({class:'text'})`, `Div('text')`, `Div([Header()])`, `Div({class:'x'}, ['child'])`.
- Events receive `(event, parentComponent)` directly in the layout: `{ click(e, parent) { /*...*/ } }`.
- Prefer composition (nest atoms via children) over inheritance.

## Layout authoring
- Shape: `{ tag:'div', class:'name', children:[...] }`; `nest` → `children`; `text` makes a text node; `html|innerHTML` sets raw HTML; default button type is `button`.
- Watchers: use `[[path]]` inside strings or arrays. Examples:
  - Single: `{ class: 'counter-[[count]]' }`
  - Specific data: `{ value: ['[[path]]', data] }`
  - Multi-source + callback: `{ class: ['[[a]] [[b]]', [dataA, dataB], ([a,b]) => `${a}-${b}`] }`
- Directives: mapped in `modules/layout/directives/core/default-directives.js` (e.g., `bind`, `watch`, `map`, `for`, `route`, `switch`, `useData`, `useState`, `onCreated`, `onDestroyed`, `cache`).

## Components
- Extend `Component`; implement `render()`; `Unit._cacheRoot` auto-caches root as `panel`. Use `this.getId('child')` for stable ids.
- State: override `setupStates()` with primitives or `{ state, callBack }`; use `this.state.increment('count')`, `toggle`, etc.
- Data: override `setData()` and set `this.data = new Data({...})` (or `SimpleData`/`Model`). Deep nested updates are supported.
- Lifecycle: `onCreated`, `beforeSetup`, `afterSetup`, `afterLayout`, `beforeDestroy`.
- Persistence: Parent `persist: true` retains child component state across re-renders (child can opt-out with `persist: false`).

## Rendering & routing
- Render anything: `Builder.render(x, container, parent?)`; non-Unit inputs are wrapped with `Jot` automatically.
- Router: `router.data.path` is reactive; `router.navigate(uri, data?, replace?)` to change routes.
- `NavLink` tracks active path using `[value: ['[[path]]', router.data]]`.
- `route` renders all matching routes; `switch` renders the first match. Both support lazy imports (`import` or `() => import(...)`).

## Data patterns (from wiki)
- Mutations: `data.set('a.b', v)`, `data.push('arr', v)`, `data.splice('arr', i)`, `data.refresh('key')`, `data.revert()`.
- Linking: `data.link(otherData, 'prop')` or `data.link(otherData)` to sync.
- Local storage: `data.setKey('KEY'); data.resume(defaults); data.store()`.

## Tips for extending
- New directive: `Directives.add('name', (ele, attrValue, parent) => { /* apply behavior */ })` and reference in layout as `{ name: value }`.
- Prefer atoms/components returning layout objects; avoid direct DOM ops—use `Builder`, `Html`, and directives.
- Wrap quick stateless bits with Jot; `Builder.render` auto-wraps non-Units.

## Build/types
- `npm run build` → `dist/` via esbuild (bundle, ESM, sourcemap, minify) and TypeScript declarations in `dist/types`.
- Consumers import from package root; types at `dist/types/base.d.ts`.

See also: `documents/base.wiki/*` for deeper explanations and examples (Atoms, Components, Layout, Directives, Data, Router, Migration).
