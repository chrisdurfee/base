import { DataTracker } from "../../../../main/data-tracker/data-tracker.js";

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

	data.callBack(data.ele);
});

/**
 * This will add a callback to be called when
 * the element is destroyed.
 *
 * @protected
 * @param {object} ele
 * @param {(object|array)} route
 * @param {object} parent
 */
export const onDestroyed = (ele, callBack, parent) =>
{
    track(ele, callBack);
};

/**
 * This will track a route.
 *
 * @param {object} ele
 * @param {function} callBack
 */
const track = (ele, callBack) =>
{
    DataTracker.add(ele, 'destroyed',
    {
        ele,
        callBack
    });
};