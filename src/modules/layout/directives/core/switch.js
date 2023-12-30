import { DataTracker } from "../../../../main/data-tracker/data-tracker.js";
import { router } from "../../../router/router.js";

/**
 * This will add a switch.
 *
 * @protected
 * @param {object} ele
 * @param {array} group
 * @param {object} parent
 */
export const addSwitch = (ele, group, parent) =>
{
	let route = group[0];
	// this will check to resume switch
	// if (checkResume(route))
	// {
	// 	resumeSwitch(ele, group);
	// 	return;
	// }

	group.forEach((item) =>
	{
		item.container = ele;
		item.parent = parent;
	});

	const id = router.addSwitch(group);
	trackSwitch(ele, id);
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
// const resumeSwitch = (ele, route) =>
// {
//     router.resume(route, ele);

//     trackSwitch(ele, route);
// };

/**
 * This will track a switch.
 *
 * @param {object} ele
 * @param {int} id
 */
const trackSwitch = (ele, id) =>
{
	DataTracker.add(ele, 'switch',
	{
		id
	});
};