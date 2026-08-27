/**
 * Router subpath entry.
 *
 * Importing from '@base-framework/base/router' provides the router and
 * NavLink without the rest of the framework surface.
 *
 * The routing directive set is registered as a side effect so `route` and
 * `switch` work the same way they do when importing from the package root.
 * The core and reactive sets are not registered here: pair this subpath with
 * 'component' (or the package root) when you render layouts.
 */
import { registerDirectives } from '../modules/layout/directives/directive-registry.js';
import { routerDirectives } from '../modules/layout/directives/core/router-directives.js';

registerDirectives(routerDirectives);

export { routerDirectives } from '../modules/layout/directives/core/router-directives.js';
export { registerDirectives } from '../modules/layout/directives/directive-registry.js';
export { NavLink, Router, router } from '../modules/router/router.js';
