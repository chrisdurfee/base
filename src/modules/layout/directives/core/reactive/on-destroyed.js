import { DataTracker } from "../../../../../main/data-tracker/data-tracker.js";

/**
 * This will register the directive with the data tracker
 * to call the callback when the element is destroyed.
 */
DataTracker.addType('destroyed', (data) =>
{
	if (!data)
	{
		return false;
	}

	data.callBack(data.ele, data.parent);
});

/**
 * This will add a callback to be called when
 * the element is destroyed.
 *
 * @param {object} ele
 * @param {(object|array)} callBack
 * @param {object} [parent]
 * @returns {void}
 */
export const onDestroyed = (ele, callBack, parent) =>
{
    track(ele, callBack, parent);
};

/**
 * This will track a route.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 * @returns {void}
 */
const track = (ele, callBack, parent) =>
{
    DataTracker.add(ele, 'destroyed',
    {
        ele,
        callBack,
        parent
    });
};