import { DataTracker } from "../../../../main/data-tracker/data-tracker.js";
import { router } from "../../../router/router.js";

/**
 * This will add a route.
 *
 * @protected
 * @param {object} ele
 * @param {(object|array)} route
 * @param {object} parent
 * @returns {void}
 */
export const addRoute = (ele, route, parent) =>
{
    if (!route)
    {
        return false;
    }

    if (Array.isArray(route))
    {
        route.forEach((item) =>
        {
            setupRoute(ele, item, parent);
        });
    }
    else
    {
        setupRoute(ele, route, parent);
    }
};

/**
 * This will setup a route.
 *
 * @protected
 * @param {object} ele
 * @param {object} route
 * @param {object} parent
 * @returns {void}
 */
const setupRoute = (ele, route, parent) =>
{
    // this will check to resume route
    // if (checkResume(route))
    // {
    // 	resumeRoute(ele, route.component.route);
    // 	return;
    // }

    route.container = ele;
    route.parent = parent;

    const newRoute = router.add(route);
    trackRoute(ele, newRoute);
};

/**
 * This will check to resume route.
 *
 * @param {object} route
 */
// const checkResume = (route) =>
// {
//     return (route && route.component && route.component.route);
// };

/**
 * This will resume a route.
 *
 * @param {object} ele
 * @param {object} route
 */
// const resumeRoute = (ele, route) =>
// {
//     router.resume(route, ele);

//     trackRoute(ele, route);
// };

/**
 * This will track a route.
 *
 * @param {object} ele
 * @param {object} route
 * @returns {void}
 */
const trackRoute = (ele, route) =>
{
    DataTracker.add(ele, 'routes',
    {
        route
    });
};