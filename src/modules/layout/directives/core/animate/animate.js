import { DataTracker } from "../../../../../main/data-tracker/data-tracker.js";
import { Events } from "../../../../../main/events/events.js";

/**
 * Active animation per element so a second in/out can cancel the first.
 *
 * @type {WeakMap<object, { complete: function, className: string, timeoutId: (number|null), onEnd: function }>}
 */
const activeAnimations = new WeakMap();

/**
 * Whether the user asked the OS to reduce motion.
 *
 * @returns {boolean}
 */
const prefersReducedMotion = () =>
	typeof globalThis.matchMedia === 'function'
	&& globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Cancel a running animation on an element without firing its callback.
 *
 * @param {object} ele
 * @returns {void}
 */
const cancelActive = (ele) =>
{
	const active = activeAnimations.get(ele);
	if (!active)
	{
		return;
	}

	activeAnimations.delete(ele);
	Events.off('animationend', ele, active.onEnd);
	if (active.timeoutId)
	{
		clearTimeout(active.timeoutId);
	}
	if (ele && active.className)
	{
		ele.classList.remove(active.className);
	}
};

/**
 * Add an animation class then remove it when the animation has ended.
 * A second call on the same element interrupts the first. Reduced-motion
 * skips the class and still fires the completion callback.
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

	cancelActive(ele);

	let timeoutId = null;
	let hasCompleted = false;

	const complete = () =>
	{
		if (hasCompleted)
		{
			return;
		}

		hasCompleted = true;
		activeAnimations.delete(ele);

		if (timeoutId)
		{
			clearTimeout(timeoutId);
			timeoutId = null;
		}

		Events.off('animationend', ele, animateEnd);

		if (ele && className)
		{
			ele.classList.remove(className);
		}

		if (doneCallBack)
		{
			doneCallBack();
		}
	};

	const animateEnd = (event) =>
	{
		if (event.target === ele)
		{
			complete();
		}
	};

	if (!className || prefersReducedMotion())
	{
		complete();
		return;
	}

	Events.on('animationend', ele, animateEnd);

	requestAnimationFrame(() =>
	{
		if (!ele || hasCompleted)
		{
			complete();
			return;
		}

		ele.classList.add(className);

		try
		{
			const computedStyle = window.getComputedStyle(ele);
			const duration = parseFloat(computedStyle.animationDuration) * 1000 || 1000;
			const delay = parseFloat(computedStyle.animationDelay) * 1000 || 0;
			timeoutId = setTimeout(complete, duration + delay + 100);
		}
		catch (e)
		{
			timeoutId = setTimeout(complete, 1000);
		}

		activeAnimations.set(ele, {
			complete,
			className,
			timeoutId,
			onEnd: animateEnd
		});
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
