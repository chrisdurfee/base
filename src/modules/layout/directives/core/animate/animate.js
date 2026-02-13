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
	if (!ele)
	{
		return;
	}

	let timeoutId = null;
	let hasCompleted = false;

	const complete = () =>
	{
		if (hasCompleted)
		{
			return;
		}

		hasCompleted = true;

		if (timeoutId)
		{
			clearTimeout(timeoutId);
			timeoutId = null;
		}

		Events.off('animationend', ele, animateEnd);

		// Check if element still exists before cleanup
		if (ele)
		{
			Dom.removeClass(ele, className);
		}

		if (doneCallBack)
		{
			doneCallBack();
		}
	};

	const animateEnd = (event) =>
	{
		// Only handle events for this specific element and animation
		if (event.target === ele)
		{
			complete();
		}
	};

	Events.on('animationend', ele, animateEnd);

	// Force browser reflow before adding class to ensure animation triggers
	requestAnimationFrame(() =>
	{
		if (!ele)
		{
			complete();
			return;
		}

		Dom.addClass(ele, className);

		// Fallback timeout in case animationend doesn't fire
		// Get animation duration from computed styles or use a safe maximum
		try
		{
			const computedStyle = window.getComputedStyle(ele);
			const duration = parseFloat(computedStyle.animationDuration) * 1000 || 1000;
			const delay = parseFloat(computedStyle.animationDelay) * 1000 || 0;

			// Add a buffer of 100ms to account for any delays
			timeoutId = setTimeout(complete, duration + delay + 100);
		}
		catch (e)
		{
			// Fallback if getComputedStyle fails
			timeoutId = setTimeout(complete, 1000);
		}
	});
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
	const remove = () =>
	{
		// Only remove if element still exists
		if (ele && ele.remove)
		{
			ele.remove();
		}
	};

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