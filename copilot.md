# Copilot instructions for this repo

Purpose: concise, project-specific guidance so AI agents are instantly productive in this codebase.

## Architecture (what to know first)
- Render UI from plain JS objects ("layouts")—no templates. Parser turns objects into DOM (browser) or HTML strings (server).
- Public API re-exported by `src/base.js` (e.g., `Builder`, `Component`, `Atom`, `Data`, `SimpleData`, `Model`, `Import`, `NavLink`, `router`, `Html`, `Directives`).
- Runtime renderer switch: `modules/layout/render/*` via `RenderController.setup()` → `BrowserRender` in browser, `ServerRender` otherwise.
- Component stack: `Unit` → `Component`. `Unit` handles lifecycle/context; `Component` adds state (`StateTracker`) and events.
- Reactive data: `modules/data` provides `Data` (deep), `SimpleData` (shallow), `Model` (server-backed). `WatcherHelper` powers `[[prop.path]]` in strings/arrays.

## CRITICAL: Common Mistakes to Avoid
1. **DON'T use templates or JSX** - Base uses plain JavaScript objects for layouts
2. **DON'T call `render()` directly** - Components call it internally; you return layout objects from `render()`
3. **DON'T mutate props** - Props are read-only; use `this.data` or `this.state` for mutable values
4. **DON'T use `this.setState()`** - Use `this.state.set('key', value)` or `this.state.increment('key')`
5. **DON'T forget `new` with Components** - Always: `new MyComponent()`, never just `MyComponent()`
6. **DON'T use `new` with Atoms** - Always: `Button()`, never `new Button()`
7. **DON'T mix data initialization locations** - Use `setData()` for initial setup, not `beforeSetup` or constructor

## Authoring layouts (house rules)
- Shape: `{ tag: 'div', class: 'name', children: [...] }`. Shorthands: `nest` → `children`; `text` creates text node; `html|innerHTML` sets raw HTML; buttons default `type: 'button'`.
- **Default tag is 'div'** - Omit `tag` for divs: `{ class: 'container' }` renders as `<div class="container"></div>`
- Events on elements receive `(event, parentComponent)` and are bound on the element: `{ click(e, parent) { parent.doThing(); } }`.
- **Event names are lowercase** - Use `click`, `mouseover`, `change`, not `onClick` or `CLICK`
- Watchers become `watch` directives automatically:
  - **PREFERRED**: Current component data: `{ class: 'counter-[[count]]' }` (simplest, use this by default)
  - Specific data source: `{ value: ['[[path]]', data] }` (when you need different data than `this.data`)
  - Multi-source with callback: `{ class: ['[[a]] [[b]]', [dataA, dataB], ([a,b]) => `${a}-${b}`] }` (advanced use)
- Directives are just attrs mapped in `modules/layout/directives/core/default-directives.js` (e.g., `bind`, `watch`, `map`, `for`, `route`, `switch`, `useState`, `useData`, `onCreated`, `onDestroyed`).
- **Null/undefined props are ignored** - Use `{ class: condition ? 'active' : null }` to conditionally add attributes

## Common directives (quick cookbook)
- **bind** (two-way by default, binds to `this.data` in component):
  - Text input: `{ tag: 'input', type: 'text', bind: 'form.name' }` (binds to `this.data.form.name`)
  - Checkbox: `{ tag: 'input', type: 'checkbox', bind: 'form.accepted' }` (binds to boolean)
  - Select + options: `{ tag: 'select', bind: 'form.color', children: [{ map: ['[[colors]]', data, (c) => ({ tag:'option', value:c, text:c })] }] }`
  - **IMPORTANT**: `bind` requires the component to have `this.data` set via `setData()`
  - Custom attribute: `{ tag: 'a', bind: 'href:link.url' }` (binds to href instead of value)
  - With filter: `{ bind: ['count', (v) => Math.round(v)] }` (transform displayed value)

- **map** (render lists from arrays, signature: `[watcherString, dataSource, callback]`):
  - Basic: `{ tag: 'ul', children: [{ map: ['[[items]]', data, (item, i) => ({ tag:'li', text:item.name })] }] }`
  - Callback receives: `(item, index)` - use both for keyed lists
  - **IMPORTANT**: The callback must return a layout object, not a string

- **Watchers** (one-way binding, auto-updates when data changes):
  - Simple: `{ class: 'status-[[status]]' }` (watches `this.data.status`)
  - Multiple: `{ text: 'User: [[name]] Age: [[age]]' }` (watches multiple props)
  - Deep paths: `{ text: '[[user.profile.name]]' }` (nested object access)

- **Lifecycle hooks** (element-level, different from component lifecycle):
  - `{ onCreated: (el, parent) => {/* el is DOM node, parent is component */} }`
  - `{ onDestroyed: (el, parent) => {/* cleanup before removal */} }`
  - **IMPORTANT**: These fire for each element, not once per component

- **Cache/persist**:
  - `cache: 'propName'` - stores DOM element in `this.propName` (use for later access)
  - `persist: true` on parent preserves child component instances across re-renders
  - Child can opt-out with `persist: false`

## Components and state/data
- Extend `Component` and implement `render()` - return layout object (never call `render()` manually)
- Root element auto-cached as `this.panel` - access after `afterSetup()` lifecycle hook
- Use `this.getId('child')` for stable DOM IDs across re-renders

### State Management
- Override `setupStates()` to define reactive state properties:
  ```javascript
  setupStates() {
      return {
          count: 0,  // Initial value
          active: { state: false, callBack: (val) => {/* fires on change */} }
      };
  }
  ```
- Access via `this.state.count` or `this.state.get('count')`
- Update methods: `this.state.set('count', 5)`, `this.state.increment('count')`, `this.state.toggle('active')`
- **NEVER** use `this.setState()` - that method doesn't exist

### Data Management
- Override `setData()` to attach reactive data (runs during component initialization):
  ```javascript
  setData() {
      this.data = new Data({ name: '', items: [] });
  }
  ```
- **CRITICAL**: Initialize data in `setData()`, NOT in `beforeSetup()` or constructor
- Use `Data` for deep nested objects, `SimpleData` for flat objects, `Model` for server-backed data
- Access/modify: `this.data.name = 'test'` or `this.data.set('name', 'test')`
- Components with `route`/`switch` directives automatically receive `this.route` (a bindable Data object)

### Lifecycle Execution Order
1. `onCreated()` - component instance created, props available, NO DOM yet
2. `beforeSetup()` - before render, good for computed props
3. `render()` - return layout object (called automatically)
4. `afterSetup()` - DOM created but not in document, `this.panel` available
5. `afterLayout()` - DOM in document, safe for measurements/animations
6. `beforeDestroy()` - cleanup before removal

### Persistence
- Parent `persist: true` keeps child component instances alive during re-renders
- Child can opt-out: `persist: false`
- **WARNING**: Data initialized in `beforeSetup` can cause issues with persistence

### Jot (Lightweight Components)
- Wrap objects/functions as components: `Jot({ render() { return {...}; } })`
- Non-Unit inputs to `Builder.render()` auto-wrapped with Jot

### Useful state/data ops
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