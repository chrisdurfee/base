import {base} from '../../core.js';

/**
 * This will add a route.
 *
 * @protected
 * @param {object} ele
 * @param {(object|array)} route
 * @param {object} parent
 */
export const addRoute = (ele, route, parent) =>
{
    if (!route)
    {
        return false;
    }

    if (Array.isArray(route))
    {
        for (var i = 0, length = route.length; i < length; i++)
        {
            setupRoute(ele, route[i], parent);
        }
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
 */
const setupRoute = (ele, route, parent) =>
{
    // this will check to resume route
    // if(this.checkResume(route))
    // {
    // 	this.resumeRoute(ele, route.component.route);
    // 	return;
    // }

    route.container = ele;
    route.parent = parent;
    let newRoute = base.router.add(route);

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
//     base.router.resume(route, ele);

//     this.trackRoute(ele, route);
// };

/**
 * This will track a route.
 *
 * @param {object} ele
 * @param {object} route
 */
const trackRoute = (ele, route) =>
{
    base.dataTracker.add(ele, 'routes',
    {
        route
    });
};