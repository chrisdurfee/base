import { DataTracker } from "../../../../main/data-tracker/data-tracker.js";
import { getRouter } from "../../../router/router-registry.js";

/**
 * This will register the switch system to the data
 * tracker to remove switches that have been nested
 * in layouts.
 */
DataTracker.addType('switch', (data) =>
{
	if (!data)
	{
		return false;
	}

	const router = getRouter();
	if (!router)
	{
		return false;
	}

	router.removeSwitch(data.id);
});

/**
 * This will add a switch.
 *
 * @protected
 * @param {object} ele
 * @param {Array<any>} group
 * @param {object} parent
 * @returns {void}
 */
export const addSwitch = (ele, group, parent) =>
{
	const router = getRouter();
	if (!router)
	{
		return;
	}

	for (let i = 0, len = group.length; i < len; i++)
	{
		const item = group[i];
		if (!item)
		{
			continue;
		}

		item.container = ele;
		item.parent = parent;
	}

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
 * @param {number} id
 * @returns {void}
 */
const trackSwitch = (ele, id) =>
{
	DataTracker.add(ele, 'switch',
	{
		id
	});
};