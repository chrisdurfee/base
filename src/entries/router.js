/**
 * Router subpath entry.
 *
 * Importing from '@base-framework/base/router' provides the router and
 * NavLink without the rest of the framework surface.
 *
 * The default directives are registered here as a side effect so the
 * route/switch directives used by the router work the same way they do when
 * importing from the package root.
 */
import '../modules/layout/directives/core/default-directives.js';

export { NavLink, Router, router } from '../modules/router/router.js';
