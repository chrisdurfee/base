import { addRoute } from './route.js';
import { addSwitch } from './switch.js';

/**
 * The directives that hand a layout to the router.
 *
 * Both resolve the router through the router registry at call time, so
 * registering this set does not pull the Router class into a bundle. The
 * "router" subpath and the package root register it for you; importing the
 * router from anywhere is what makes these directives functional.
 *
 * @type {Record<string, function>}
 */
export const routerDirectives =
{
	route: addRoute,
	switch: addSwitch
};
