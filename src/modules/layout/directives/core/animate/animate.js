import { Dom } from "../../../../../base.js";
import { DataTracker } from "../../../../../main/data-tracker/data-tracker.js";
import { Events } from "../../../../../main/events/events.js";

/**
 * This will add the aniamtion class then remove it
 * when the aniamtion has ended.
 *
 * @param {object} ele
 * @param {string} className
 * @param {function|null} doneCallBack
 * @returns {void}
 */
const addAnimationClass = (ele, className, doneCallBack = null) =>
{
	Events.on('animationend', ele, function animateEnd()
	{
		Dom.removeClass(ele, className);
		Events.off('animationend', ele, animateEnd);

		if (doneCallBack)
		{
			doneCallBack();
		}
	});

	Dom.addClass(ele, className);
};

/**
 * This will add the animation on creation.
 *
 * @param {object} ele
 * @param {string} animationClass
 * @param {object} parent
 * @returns {void}
 */
export const animateIn = (ele, animationClass, parent) =>
{
	addAnimationClass(ele, animationClass);
};

/**
 * This will add the animation on deletion.
 *
 * @param {object} ele
 * @param {string} animationClass
 * @param {object} parent
 * @returns {void}
 */
export const animateOut = (ele, animationClass, parent) =>
{
	const remove = () => (ele && ele.remove());
	track(ele, () => addAnimationClass(ele, animationClass, remove), parent);
};

/**
 * This will register the directive with the data tracker
 * to call the callback when the element is destroyed.
 */
DataTracker.addType('manual-destroy', (data) =>
{
	if (!data)
	{
		return false;
	}

	data.callBack(data.ele, data.parent);
});

/**
 * This will track the animation to add the animation before destroy.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 * @returns {void}
 */
const track = (ele, callBack, parent) =>
{
	DataTracker.add(ele, 'manual-destroy',
	{
		ele,
		callBack,
		parent
	});
};