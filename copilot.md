# Copilot instructions for this repo

Purpose: concise, project-specific guidance so AI agents are instantly productive in this codebase.

## Architecture (what to know first)
- **Render UI from plain JS objects** ("layouts")—no templates, no JSX. Parser turns objects into DOM (browser) or HTML strings (server).
- **Public API** re-exported by `src/base.js`: `Builder`, `Component`, `Unit`, `Jot`, `Pod`, `Atom`, `Data`, `SimpleData`, `Model`, `StateTracker`, `Import`, `NavLink`, `router`, `Html`, `Directives`, `Ajax`.
- **Runtime renderer switch**: `modules/layout/render/*` via `RenderController.setup()` → `BrowserRender` in browser, `ServerRender` for SSR.
- **Component hierarchy**: `Unit` (lifecycle/context) → `Component` (adds state via `StateTracker` and events).
- **Shorthand APIs**: `Jot` (functional components), `Pod` (stateful functional), `Atom` (reusable layouts).
- **Reactive data**: `Data` (deep proxy), `SimpleData` (shallow proxy), `Model` (server-backed). `WatcherHelper` powers `[[prop.path]]` bindings.
- **State management**: `StateTracker` for global state, component-level states via `setupStates()`.
- **Routing**: Client-side with History API, reactive `router.data.path`, automatic route parameters.
- **HTTP requests**: `Ajax` module with shorthand methods (`Ajax.get()`, `Ajax.post()`).
- **Dynamic imports**: `Import` wrapper for lazy loading with dependencies.

## CRITICAL: Common Mistakes to Avoid
1. **DON'T use templates or JSX** - Base uses plain JavaScript objects for layouts
2. **DON'T call `render()` directly** - Components call it internally; you return layout objects from `render()`
3. **DON'T mutate props** - Props are read-only; use `this.data` or `this.state` for mutable values
4. **DON'T use `this.setState()`** - Use `this.state.set('key', value)` or `this.state.increment('key')`
5. **DON'T forget `new` with Components** - Always: `new MyComponent()`, `new Component()`, never just `MyComponent()`
6. **DON'T use `new` with Atoms** - Always: `Button()`, never `new Button()`. Atoms are functions, not classes
7. **DON'T use `new` with Jot/Pod** - Call the returned class: `const MyJot = Jot({...}); new MyJot()` not `new Jot({})`
8. **DON'T mix data initialization locations** - Use `setData()` for initial setup, not `beforeSetup` or constructor
9. **DON'T bind without data** - `bind` directive requires `this.data` to be initialized via `setData()`
10. **DON'T use wrong state methods** - State keys must be defined in `setupStates()` before using `increment`, `decrement`, `toggle`
11. **DON'T forget Import function form** - Use `Import(() => import('./file.js'))` not `Import('./file.js')` for bundler support
12. **DON'T use element.remove()** - Use `Html.removeElement(element)` or `Builder.removeNode(element)` for proper cleanup
13. **DON'T access DOM before afterSetup** - `this.panel` and `this.elem` are only available after `afterSetup()` lifecycle hook
14. **DON'T return arrays from render()** - Wrap multiple elements: `return { children: [elem1, elem2] }` not `return [elem1, elem2]`
15. **DON'T use `await` in render()** - Load data in lifecycle hooks, render() must be synchronous

## Authoring layouts (house rules)
- **Shape**: `{ tag: 'div', class: 'name', children: [...] }`. Shorthands: `nest` → `children`; `text` creates text node; `html|innerHTML` sets raw HTML.
- **Default tag is 'div'** - Omit `tag` for divs: `{ class: 'container' }` renders as `<div class="container"></div>`
- **Button default** - Buttons default to `type: 'button'` (not 'submit')
- **Events on elements** receive `(event, parentComponent)` and are bound on the element: `{ click(e, parent) { parent.doThing(); } }`
- **Event names are lowercase** - Use `click`, `mouseover`, `change`, `input`, `submit`, not `onClick` or `CLICK`
- **Watchers** become `watch` directives automatically:
  - **PREFERRED**: Current component data: `{ class: 'counter-[[count]]' }` (simplest, watches `this.data` or `this.state`)
  - Specific data source: `{ value: ['[[path]]', data] }` (when you need different data than `this.data`)
  - Multi-source with callback: `{ class: ['[[a]] [[b]]', [dataA, dataB], ([a,b]) => `${a}-${b}`] }` (advanced use)
- **Null/undefined props are ignored** - Use `{ class: condition ? 'active' : null }` to conditionally add attributes
- **Arrays in children** - Flatten automatically: `{ children: [elem1, [elem2, elem3], elem4] }` works
- **Function children** - Return layout objects: `{ children: [() => ({ tag: 'span', text: 'Dynamic' })] }`
- **Conditional rendering** - Use logical operators: `{ children: [condition && element, other || fallback] }`

## Common directives (quick cookbook)
- **bind** (two-way by default, binds to `this.data` in component):
  - Text input: `{ tag: 'input', type: 'text', bind: 'form.name' }` (binds to `this.data.form.name`)
  - Checkbox: `{ tag: 'input', type: 'checkbox', bind: 'form.accepted' }` (binds to boolean)
  - Radio: `{ tag: 'input', type: 'radio', name: 'color', value: 'red', bind: 'form.color' }`
  - Select + options: `{ tag: 'select', bind: 'form.color', children: [{ map: ['[[colors]]', data, (c) => ({ tag:'option', value:c, text:c })] }] }`
  - **IMPORTANT**: `bind` requires the component to have `this.data` set via `setData()`
  - Custom attribute: `{ tag: 'a', bind: 'href:link.url' }` (binds to href instead of value)
  - With filter: `{ bind: ['count', (v) => Math.round(v)] }` (transform displayed value)
  - One-way: `{ oneway: 'propPath' }` (element → data only)

- **map** (render lists from arrays, signature: `[watcherString, dataSource, callback]`):
  - Basic: `{ tag: 'ul', children: [{ map: ['[[items]]', data, (item, i) => ({ tag:'li', text:item.name })] }] }`
  - Callback receives: `(item, index)` - use both for keyed lists
  - **IMPORTANT**: The callback must return a layout object, not a string
  - With keys: Use `key: item.id` in returned layout for better performance

- **for** (repeat element N times):
  - Basic: `{ for: [5, (i) => ({ tag: 'div', text: `Item ${i}` })] }`
  - With data: `{ for: [['[[count]]', data], (i) => ({ tag: 'span', text: i })] }`

- **if** (conditional rendering):
  - Basic: `{ if: [() => condition, { tag: 'div', text: 'Shown' }] }`
  - With data: `{ if: [['[[isVisible]]', data], { tag: 'div', text: 'Visible' }] }`
  - **NOTE**: Use regular JavaScript `condition && layout` for simpler cases

- **Watchers** (one-way binding, auto-updates when data changes):
  - Simple: `{ class: 'status-[[status]]' }` (watches `this.data.status` or `this.state.status`)
  - Multiple: `{ text: 'User: [[name]] Age: [[age]]' }` (watches multiple props)
  - Deep paths: `{ text: '[[user.profile.name]]' }` (nested object access)
  - In arrays: `{ class: ['theme-[[theme]]', 'page'] }` (combines static and dynamic)

- **Lifecycle hooks** (element-level, different from component lifecycle):
  - `{ onCreated: (el, parent) => {/* el is DOM node, parent is component */} }`
  - `{ onDestroyed: (el, parent) => {/* cleanup before removal */} }`
  - **IMPORTANT**: These fire for each element, not once per component

- **State/Data hooks** (access parent state/data):
  - `{ useData: data }` - use specific data source for watchers in this subtree
  - `{ useState: state }` - use specific state source for watchers in this subtree
  - `{ useContext: context }` - use specific context for this subtree
  - `{ useParent: component }` - explicitly set parent component reference
  - **NOTE**: These propagate to child elements

- **onSet** (reactive callback for data changes):
  - Basic: `{ onSet: ['propPath', (value, oldValue) => ({ tag: 'div', text: value })] }`
  - Multiple props: `{ onSet: [['prop1', 'prop2'], ([val1, val2]) => layout] }`
  - With data source: `{ onSet: ['propPath', data, (value) => layout] }`

- **Component integration**:
  - `{ addState: { count: 0 } }` - add state properties to component
  - `{ addEvent: { myEvent: (data) => {} } }` - add event to component
  - `{ addContext: { theme: 'dark' } }` - add context to component

- **Animation**:
  - Enter: `{ animateEnter: 'fadeIn' }` or `{ animateEnter: { name: 'slide', duration: 300 } }`
  - Exit: `{ animateExit: 'fadeOut' }`
  - Move: `{ animateMove: 'slide' }`

- **Accessibility**:
  - `{ a11yHide: true }` - hide from screen readers
  - `{ a11yLabel: 'descriptive text' }` - set aria-label
  - `{ a11yRole: 'button' }` - set role
  - `{ a11yDescribe: 'longer description' }` - set aria-describedby

- **Cache/persist**:
  - `cache: 'propName'` - stores DOM element in `this.propName` (use for later access)
  - `persist: true` on parent preserves child component instances across re-renders
  - Child can opt-out with `persist: false`

## Components and state/data
- Extend `Component` and implement `render()` - return layout object (never call `render()` manually)
- Root element auto-cached as `this.panel` - access after `afterSetup()` lifecycle hook
- Use `this.getId('child')` for stable DOM IDs across re-renders
- Helper methods available on Component instances:
  - `this.if(condition, layout)` - conditional rendering helper
  - `this.map(array, callback)` - array mapping helper
  - `this.declareProps(schema)` - prop validation and defaults

### State Management
- Override `setupStates()` to define reactive state properties:
  ```javascript
  setupStates() {
      return {
          count: 0,  // Initial value
          active: { state: false, callBack: (val) => {/* fires on change */} },
          items: []  // Arrays work too
      };
  }
  ```
- Access via `this.state.count` or `this.state.get('count')`
- Update methods:
  - `this.state.set('count', 5)` or `this.state.set({ count: 5, active: true })`
  - `this.state.increment('count', amount?)` - add to number (default +1)
  - `this.state.decrement('count', amount?)` - subtract from number (default -1)
  - `this.state.toggle('active')` - flip boolean
  - `this.state.push('items', item)` - add to array
  - `this.state.splice('items', index, count)` - remove from array
- **NEVER** use `this.setState()` - that method doesn't exist
- **IMPORTANT**: State keys must be defined in `setupStates()` before using helper methods

### Global State (StateTracker)
- Create global state with `StateTracker.create(id, initialState)`:
  ```javascript
  import { StateTracker } from '@base-framework/base';
  const appState = StateTracker.create('app', { user: null, theme: 'light' });
  ```
- Access in components:
  ```javascript
  setupStateTarget() {
      this.state = StateTracker.get('app');
  }
  ```
- All state methods work on global state: `this.state.set('theme', 'dark')`
- Use `useState` directive to connect elements to global state

### Data Management
- Override `setData()` to attach reactive data (runs during component initialization):
  ```javascript
  setData() {
      this.data = new Data({ name: '', items: [] });
      // Optional: local storage persistence
      this.data.setKey('MY_STORAGE_KEY');
      this.data.resume({ name: '', items: [] });  // Load or use defaults
  }
  ```
- **CRITICAL**: Initialize data in `setData()`, NOT in `beforeSetup()` or constructor
- Use `Data` for deep nested objects, `SimpleData` for flat objects, `Model` for server-backed data
- Access/modify: `this.data.name = 'test'` or `this.data.set('name', 'test')` or `this.data.set({ name: 'test', items: [] })`
- Components with `route`/`switch` directives automatically receive `this.route` (a bindable Data object with route params)
- Array methods: `push`, `pop`, `shift`, `unshift`, `splice` (all trigger reactivity)
- Other methods:
  - `this.data.get('nested.path')` - get nested value
  - `this.data.refresh('key')` - trigger watchers without changing value
  - `this.data.delete('key')` - remove property
  - `this.data.ifNull('key', defaultValue)` - return default if null/undefined
  - `this.data.getIndex('array', predicate)` - find array index
  - `this.data.concat('array', items)` - append to array
  - `this.data.on('change', callback)` - subscribe to changes
  - `this.data.off('change', callback)` - unsubscribe
  - `this.data.store()` - save to local storage (if key set)
  - `this.data.resume(defaults)` - load from local storage
  - `this.data.revert()` - undo changes (Data only, not SimpleData)
  - `this.data.link(otherData, 'prop')` - two-way sync with another data source

### Lifecycle Execution Order
1. `onCreated()` - component instance created, props available, NO DOM yet
2. `beforeSetup()` - before render, good for computed props
3. `setData()` - initialize reactive data (runs automatically)
4. `setupStates()` - define state properties (runs automatically)
5. `setupStateTarget()` - connect to global state (runs automatically if defined)
6. `render()` - return layout object (called automatically, NEVER call manually)
7. `afterSetup()` - DOM created but not in document, `this.panel` available
8. `afterRender()` - alias for afterSetup
9. `afterLayout()` - DOM in document, safe for measurements/animations
10. `beforeDestroy()` - cleanup before removal
11. `onDestroyed()` - final cleanup after removal

### Atoms (Reusable Layouts)
- Create with `Atom((props, children) => layoutObject)`:
  ```javascript
  const Button = Atom((props, children) => ({
      tag: 'button',
      type: 'button',
      ...props,
      children
  }));
  ```
- Call without `new`: `Button({ class: 'primary', click: handler }, 'Click Me')`
- Support flexible argument order: `Button('text')`, `Button({ class: 'btn' })`, `Button({ class: 'btn' }, 'text')`
- **DON'T** use `new` with Atoms - they are functions, not classes
- Atoms can merge props, children, and have watchers: `Button({ class: 'btn-[[size]]' }, 'Text')`

### Jot (Functional Components)
- Create lightweight components: `const MyJot = Jot({ render() { return { tag: 'div' }; } })`
- Returns a Component class: `new MyJot()` to instantiate
- Supports all component features: `setData()`, `setupStates()`, lifecycle hooks
- Auto-wrapped for non-Component objects in `Builder.render()`
- **DON'T** use `new Jot({})` - call the returned class: `const MyJot = Jot({}); new MyJot()`

### Pod (Stateful Functional Components)
- Like Jot but with built-in state setup:
  ```javascript
  const Counter = Pod({
      states: { count: 0 },
      render() {
          return { tag: 'div', text: 'Count: [[count]]' };
      }
  });
  ```
- Use `states` property to define state (equivalent to `setupStates()`)
- Instantiate: `new Counter()`

### Persistence & Component Reuse
- Parent `persist: true` keeps child component instances alive during re-renders
- Child can opt-out: `persist: false`
- **WARNING**: Data initialized in `beforeSetup` can cause issues with persistence

## HTTP Requests (Ajax Module)
- **Shorthand methods** (recommended for simple requests):
  ```javascript
  import { Ajax } from '@base-framework/base';

  // GET request
  Ajax.get('/api/users').then(data => console.log(data));

  // POST request
  Ajax.post('/api/users', { name: 'John' }).then(data => console.log(data));

  // PUT request
  Ajax.put('/api/users/123', { name: 'Jane' });

  // DELETE request
  Ajax.delete('/api/users/123');

  // HEAD request
  Ajax.head('/api/status');
  ```

- **Object syntax** (for advanced options):
  ```javascript
  Ajax({
      url: '/api/users',
      method: 'POST',
      data: { name: 'John' },
      responseType: 'json',  // 'json', 'text', 'blob', 'arraybuffer'
      headers: { 'X-Custom': 'value' },
      success: (data) => console.log('Success:', data),
      error: (xhr) => console.error('Error:', xhr.status),
      progress: (e) => console.log('Progress:', e.loaded / e.total)
  });
  ```

- **Response types**:
  - `'json'` (default) - auto-parse JSON response
  - `'text'` - get response as string
  - `'blob'` - for binary data (files, images)
  - `'arraybuffer'` - for raw binary data

- **Global configuration**:
  ```javascript
  // Add fixed params to all requests
  Ajax.addFixedParams({ apiKey: 'abc123' });

  // Pre-request hook
  Ajax.beforeSend((xhr) => {
      xhr.setRequestHeader('Authorization', 'Bearer token');
  });

  // Default settings
  Ajax.ajaxSettings({
      baseURL: '/api',
      timeout: 5000,
      withCredentials: true
  });
  ```

- **In components**:
  ```javascript
  class UserList extends Component {
      onCreated() {
          Ajax.get('/api/users').then(users => {
              this.data.set('users', users);
          });
      }
  }
  ```

## Dynamic Module Loading (Import)
- **Basic usage** (lazy load components/modules):
  ```javascript
  import { Import } from '@base-framework/base';

  // In layouts (function form - works with bundlers)
  { children: [Import(() => import('./components/heavy.js'))] }

  // String path (for non-bundler scenarios)
  { children: [Import('./components/simple.js')] }
  ```

- **With dependencies** (load CSS/JS before module):
  ```javascript
  Import({
      src: () => import('./components/Chart.js'),
      depends: [
          './styles/chart.css',
          './vendor/chart-lib.js'
      ],
      callback: (module) => console.log('Chart loaded:', module)
  });
  ```

- **Route-based lazy loading**:
  ```javascript
  {
      switch: [
          { uri: '/dashboard', component: Import(() => import('./pages/Dashboard.js')) },
          { uri: '/profile', component: Import(() => import('./pages/Profile.js')) },
          { uri: '/settings', component: Import(() => import('./pages/Settings.js')) }
      ]
  }
  ```

- **Persistent modules** (keep loaded after parent destroyed):
  ```javascript
  Import({
      src: () => import('./services/Analytics.js'),
      persist: true  // Stays loaded globally
  });
  ```

- **CRITICAL**: Always use function form `() => import()` for bundler support (Vite, Webpack)
- **DON'T** use string paths with bundlers: `Import('./file.js')` won't code-split
- **DO** use function form: `Import(() => import('./file.js'))` enables code-splitting

### Persistence & Component Reuse
- Parent `persist: true` keeps child component instances alive during re-renders
- Child can opt-out: `persist: false`
- **WARNING**: Data initialized in `beforeSetup` can cause issues with persistence

### Component Helper Methods (Available in all Components)
```javascript
class MyComponent extends Component {
    someMethod() {
        // Conditional rendering helper
        this.if(this.state.show, { tag: 'div', text: 'Visible' });

        // Array mapping helper
        const items = this.map([1, 2, 3], (num) => ({ tag: 'span', text: num }));

        // Get stable DOM ID
        const id = this.getId('element-name');  // 'component-123-element-name'

        // Prop validation (optional)
        this.declareProps({
            title: { type: 'string', required: true },
            count: { type: 'number', default: 0 }
        });
    }
}
```

### Lifecycle Execution Order
1. `onCreated()` - component instance created, props available, NO DOM yet
2. `beforeSetup()` - before render, good for computed props
3. `setData()` - initialize reactive data (runs automatically)
4. `setupStates()` - define state properties (runs automatically)
5. `setupStateTarget()` - connect to global state (runs automatically if defined)
6. `render()` - return layout object (called automatically, NEVER call manually)
7. `afterSetup()` - DOM created but not in document, `this.panel` available
8. `afterRender()` - alias for afterSetup
9. `afterLayout()` - DOM in document, safe for measurements/animations
10. `beforeDestroy()` - cleanup before removal
11. `onDestroyed()` - final cleanup after removal

### Atoms (Reusable Layouts)
- Create with `Atom((props, children) => layoutObject)`:
  ```javascript
  const Button = Atom((props, children) => ({
      tag: 'button',
      type: 'button',
      ...props,
      children
  }));
  ```
- Call without `new`: `Button({ class: 'primary', click: handler }, 'Click Me')`
- Support flexible argument order: `Button('text')`, `Button({ class: 'btn' })`, `Button({ class: 'btn' }, 'text')`
- **DON'T** use `new` with Atoms - they are functions, not classes
- Atoms can merge props, children, and have watchers: `Button({ class: 'btn-[[size]]' }, 'Text')`

### Jot (Functional Components)
- Create lightweight components: `const MyJot = Jot({ render() { return { tag: 'div' }; } })`
- Returns a Component class: `new MyJot()` to instantiate
- Supports all component features: `setData()`, `setupStates()`, lifecycle hooks
- Auto-wrapped for non-Component objects in `Builder.render()`
- **DON'T** use `new Jot({})` - call the returned class: `const MyJot = Jot({}); new MyJot()`

### Pod (Stateful Functional Components)
- Like Jot but with built-in state setup:
  ```javascript
  const Counter = Pod({
      states: { count: 0 },
      render() {
          return { tag: 'div', text: 'Count: [[count]]' };
      }
  });
  ```
- Use `states` property to define state (equivalent to `setupStates()`)
- Instantiate: `new Counter()`
- **State helpers** (only work on keys defined in `setupStates()`):
  - `this.state.set('key', value)` - set any value
  - `this.state.toggle('key')` - flip boolean
  - `this.state.increment('key', amount?)` - add to number (default +1)
  - `this.state.decrement('key', amount?)` - subtract from number (default -1)
  - **DON'T** try to use these on undefined state keys

- **Data helpers** (work on `Data` and `SimpleData`):
  - Get: `data.name` or `data.get('nested.path')`
  - Set: `data.name = val` or `data.set('nested.path', val)` or `data.set({ key1: val1, key2: val2 })`
  - Arrays: `data.push('arr', item)`, `data.splice('arr', idx, count)`, `data.unshift()`, `data.shift()`, `data.pop()`
  - Refresh: `data.refresh('key')` - trigger watchers without changing value
  - Revert: `data.revert()` - undo changes since last commit (Data only)
  - Delete: `data.delete('key')` - remove property

- **Linking data sources** (two-way sync):
  - Full link: `data.link(otherData)` - sync all properties
  - Single prop: `data.link(otherData, 'propName')` - sync one property

- **Local storage persistence**:
  ```javascript
  setData() {
      this.data = new Data({ count: 0 });
      this.data.setKey('MY_STORAGE_KEY');
      this.data.resume({ count: 0 }); // Load or use defaults
  }

  // Save when needed
  saveData() {
      this.data.store();
  }
  ```

## Rendering and routing
- Render anything (function/layout/Unit/Component): `Builder.render(x, container, parent?)`. Non-Unit inputs are wrapped in a `Jot` component.
- Router: `router.data.path` is reactive; navigate via `router.navigate(uri, data?, replace?)`. `NavLink` uses `[value: ['[[path]]', router.data]]` to track active path.
- Routes via directives: `route` renders all matches; `switch` renders the first match. Both can lazy-load components via `import`.
- Lazy imports: use `Import` or dynamic `import()` in route/switch children to defer loading.
- NavLink patterns: `{ tag:'a', route:'/users', children:['Users'], useData: router.data }` or use `NavLink` which watches `router.data.path` for active state.

### Router Setup (do this FIRST)
```javascript
import { router } from '@base-framework/base';
router.setup('/base-url/', 'App Title');
```

### Route Directive (renders ALL matching routes)
```javascript
{
    route: [
        { uri: '/users', component: UsersList },
        { uri: '/users/:id', component: UserDetail },
        { uri: '/users/:id/edit', component: UserEdit }
    ]
}
// All matching routes render simultaneously
```

### Switch Directive (renders FIRST match only)
```javascript
{
    switch: [
        { uri: '/login', component: Login },
        { uri: '/dashboard', component: Dashboard },
        { component: NotFound }  // No uri = default/fallback route
    ]
}
// Only one route renders
```

### Route Patterns
- **Exact match**: `/users` - matches only `/users`
- **Wildcard**: `/users*` - matches `/users`, `/users/123`, `/users/123/edit`
- **Required param**: `/users/:id` - matches `/users/123`, extracts `id: '123'`
- **Optional param**: `/users/:id?` - matches `/users` and `/users/123`
- **Multi-params**: `/users/:id/posts/:postId?*` - combines patterns

### Accessing Route Data in Components
```javascript
class UserDetail extends Component {
    render() {
        // this.route is automatically injected by route/switch directives
        const userId = this.route.id;  // From /users/:id
        return { text: `User ID: [[id]]` };  // Watches this.route.id
    }
}
```

### Lazy Loading Routes
```javascript
{
    switch: [
        { uri: '/heavy', import: () => import('./components/heavy.js') }
    ]
}
// Component loads only when route matches
```

### NavLink Component
```javascript
import { NavLink } from '@base-framework/base';

new NavLink({
    href: '/users',
    text: 'Users',
    exact: true,  // false = matches /users*
    activeClass: 'active'  // Class added when route matches
})
```

## Build and types
- Build to `dist/` with esbuild + TypeScript declarations: `npm run build` (bundles `src/base.js`, ESM, minified, sourcemaps; emits `dist/types/*.d.ts`).
- Consumers import from package root; `exports` maps ESM/CJS to `dist/base.js`.

## Complete Working Examples

### Example 1: Simple Counter Component (State + Watchers)
```javascript
import { Component, Atom } from '@base-framework/base';

const Button = Atom((props, children) => ({
    tag: 'button',
    type: 'button',
    ...props,
    children
}));

class Counter extends Component {
    setupStates() {
        return {
            count: 0
        };
    }

    render() {
        return {
            class: 'counter',
            children: [
                { tag: 'h2', text: 'Count: [[count]]' },  // Watcher on this.state
                Button({
                    click: () => this.state.increment('count'),
                }, 'Increment'),
                Button({
                    click: () => this.state.decrement('count'),
                }, 'Decrement')
            ]
        };
    }
}

// Usage
import { Builder } from '@base-framework/base';
Builder.render(new Counter(), document.body);
```

### Example 2: Form with Data Binding
```javascript
import { Component, Data } from '@base-framework/base';

class UserForm extends Component {
    setData() {
        this.data = new Data({
            form: {
                name: '',
                email: '',
                role: 'user',
                newsletter: false
            }
        });
    }

    render() {
        return {
            class: 'user-form',
            children: [
                {
                    tag: 'input',
                    type: 'text',
                    placeholder: 'Name',
                    bind: 'form.name'  // Two-way binding to this.data.form.name
                },
                {
                    tag: 'input',
                    type: 'email',
                    placeholder: 'Email',
                    bind: 'form.email'
                },
                {
                    tag: 'select',
                    bind: 'form.role',
                    children: [
                        { tag: 'option', value: 'user', text: 'User' },
                        { tag: 'option', value: 'admin', text: 'Admin' }
                    ]
                },
                {
                    tag: 'label',
                    children: [
                        { tag: 'input', type: 'checkbox', bind: 'form.newsletter' },
                        { tag: 'span', text: 'Subscribe to newsletter' }
                    ]
                },
                {
                    tag: 'button',
                    type: 'button',
                    text: 'Submit',
                    click: () => this.handleSubmit()
                },
                // Preview with watchers
                { tag: 'pre', text: 'Name: [[form.name]]\nEmail: [[form.email]]' }
            ]
        };
    }

    handleSubmit() {
        console.log('Form data:', this.data.form);
    }
}
```

### Example 3: List with Map Directive
```javascript
import { Component, Data } from '@base-framework/base';

class TodoList extends Component {
    setData() {
        this.data = new Data({
            newTodo: '',
            todos: [
                { id: 1, text: 'Learn Base', done: false },
                { id: 2, text: 'Build app', done: false }
            ]
        });
    }

    render() {
        return {
            class: 'todo-list',
            children: [
                {
                    tag: 'input',
                    type: 'text',
                    bind: 'newTodo',
                    placeholder: 'New todo...'
                },
                {
                    tag: 'button',
                    type: 'button',
                    text: 'Add',
                    click: () => this.addTodo()
                },
                {
                    tag: 'ul',
                    children: [{
                        map: ['[[todos]]', this.data, (todo, index) => ({
                            tag: 'li',
                            class: todo.done ? 'done' : '',
                            children: [
                                {
                                    tag: 'input',
                                    type: 'checkbox',
                                    checked: todo.done,
                                    change: (e) => {
                                        this.data.todos[index].done = e.target.checked;
                                        this.data.refresh('todos');
                                    }
                                },
                                { tag: 'span', text: todo.text },
                                {
                                    tag: 'button',
                                    type: 'button',
                                    text: '×',
                                    click: () => this.removeTodo(index)
                                }
                            ]
                        })]
                    }]
                }
            ]
        };
    }

    addTodo() {
        if (!this.data.newTodo.trim()) return;
        this.data.push('todos', {
            id: Date.now(),
            text: this.data.newTodo,
            done: false
        });
        this.data.newTodo = '';
    }

    removeTodo(index) {
        this.data.splice('todos', index, 1);
    }
}
```

### Example 4: Routing App
```javascript
import { Component, router, NavLink } from '@base-framework/base';

// Setup router FIRST
router.setup('/app/', 'My App');

// Page components
class HomePage extends Component {
    render() {
        return { class: 'home', children: [{ tag: 'h1', text: 'Home' }] };
    }
}

class UserDetail extends Component {
    render() {
        // this.route is automatically available from router
        return {
            class: 'user-detail',
            children: [
                { tag: 'h1', text: 'User Details' },
                { tag: 'p', text: 'User ID: [[id]]' }  // Watches this.route.id
            ]
        };
    }
}

class NotFound extends Component {
    render() {
        return { class: 'not-found', children: [{ tag: 'h1', text: '404' }] };
    }
}

// Main app with navigation
class App extends Component {
    render() {
        return {
            class: 'app',
            children: [
                {
                    tag: 'nav',
                    children: [
                        new NavLink({ href: '/', text: 'Home', exact: true }),
                        new NavLink({ href: '/users', text: 'Users' }),
                        new NavLink({ href: '/about', text: 'About' })
                    ]
                },
                {
                    tag: 'main',
                    // Use switch for mutually exclusive routes
                    switch: [
                        { uri: '/', component: HomePage },
                        { uri: '/users/:id', component: UserDetail },
                        { uri: '/about', import: () => import('./about.js') },
                        { component: NotFound }  // Fallback route
                    ]
                }
            ]
        };
    }
}

// Render app
import { Builder } from '@base-framework/base';
Builder.render(new App(), document.body);
```

## Pointers to examples
- Rendering: `modules/layout/render/{browser-render,server-render}.js`; Parser: `modules/layout/element/parser.js` + `modules/layout/watcher-helper.js`.
- Components: `modules/component/{unit.js,component.js}`; Directives registry: `modules/layout/directives/core/default-directives.js`.
- Data: `modules/data/types/**`; Router: `modules/router/router.js`, `modules/router/nav-link.js`.

Questions or gaps? Open an issue or add comments here with file pointers so we can refine these rules.