/**
 * The active router instance.
 *
 * The layout directives that drive routing (`route` and `switch`) resolve the
 * router through this registry instead of importing the router module. A
 * static import would make the whole Router class, its history controllers and
 * its route matching reachable from every layout that registers the default
 * directives, which no amount of tree shaking can undo.
 *
 * @type {object|null}
 */
let activeRouter = null;

/**
 * This will set the router the routing directives resolve.
 *
 * The router module calls this for its own singleton, so importing the router
 * from anywhere (the package root or the "router" subpath) is enough to wire
 * the directives up.
 *
 * @param {object|null} router
 * @returns {void}
 */
export const setRouter = (router) =>
{
	activeRouter = router;
};

/**
 * This will get the active router.
 *
 * @returns {object|null}
 */
export const getRouter = () =>
{
	if (activeRouter === null)
	{
		console.error('No router has been registered. Import the router from "@base-framework/base" or "@base-framework/base/router" before using the route or switch directives.');
	}

	return activeRouter;
};
