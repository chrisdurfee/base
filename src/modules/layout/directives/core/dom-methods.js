import { dataBinder } from "../../../data-binder/data-binder.js";
import { getBindAttr } from "../../../data-binder/sources/get-bind-attr.js";
import { Html } from "../../../html/html.js";
import { Builder } from "../../builder.js";

/**
 * This will setup a data watcher.
 *
 * @param {object} ele
 * @param {object} data
 * @param {(function|object)} settings
 * @param {string} parent
 * @returns {void}
 */
export const onUpdate = (ele, data, settings, parent) =>
{
	if (Array.isArray(settings[0]))
	{
		settings.forEach((itemSettings) =>
		{
			if (!itemSettings)
			{
				return;
			}

			onUpdate(ele, data, itemSettings, parent);
		});

		return;
	}

	setWatcher(ele, data, settings, parent);
};

/**
 * This will setup a data watcher.
 *
 * @param {object} ele
 * @param {object} data
 * @param {Array<any>} settings
 * @param {string} parent
 * @returns {void}
 */
const setWatcher = (ele, data, settings, parent) =>
{
	let prop,
	callBack;

	if (settings.length < 3)
	{
		[prop, callBack] = settings;
	}
	else
	{
		[data, prop, callBack] = settings;
	}

	if (!data || !prop)
	{
		return;
	}

	if (typeof data.on !== 'function')
	{
		console.warn('Watcher directive: Data source does not have an "on" method. Make sure your component has data, state, or context.data initialized before using watchers like onSet, watch, or [[prop]] syntax.', ele, data);
		return;
	}

	const update = getUpdateMethod(ele, prop, callBack, parent);
	dataBinder.watch(ele, data, prop, update);
};

/**
 * This will get the update method.
 *
 * @param {object} ele
 * @param {object} prop
 * @param {*} callBack
 * @param {object} parent
 * @returns {function}
 */
const getUpdateMethod = (ele, prop, callBack, parent) =>
{
	if (typeof callBack === 'object')
	{
		return (value) =>
		{
			addClass(ele, callBack, value);
		};
	}

	return (value) =>
	{
		updateElement(ele, callBack, prop, value, parent);
	};
};

/**
 * This will setup a data watcher.
/**
 * Tracks elements we've already warned about so the dev
 * console isn't spammed every time a watcher fires.
 *
 * @type {WeakSet<object>}
 */
const _rebuildWarnings = new WeakSet();

/**
 * Warn (once per element) when a watcher callback returns a
 * Unit/Component instance. This is the destroy-and-rebuild
 * pattern that scales O(tree size) per update and is the
 * single most common cause of resume/republish lock-ups.
 *
 * Wrapping reactive markup in a Jot/Atom that swaps DOM is
 * fine; instantiating a full Component on every change is
 * almost never what the author intended.
 *
 * @param {object} result
 * @param {string} prop
 * @param {object} ele
 * @returns {void}
 */
const warnIfRebuildingComponent = (result, prop, ele) =>
{
	if (!result || (!result.isUnit && !result.isComponent))
	{
		return;
	}

	if (_rebuildWarnings.has(ele))
	{
		return;
	}
	_rebuildWarnings.add(ele);

	console.warn(
		'[Watcher] Reactive callback for "' + prop + '" returned a Component/Unit instance. ' +
		'The entire subtree will be destroyed and recreated on every change, which can ' +
		'trigger expensive deep publishes during persistence/resume. Consider mounting ' +
		'the component once and exposing a refresh()/update() method, or returning a ' +
		'plain layout object instead.',
		ele
	);
};

/**
 * This will setup a data watcher.
 *
 * @private
 * @param {object} ele
 * @param {function} callBack
 * @param {string} value
 * @param {object} parent
 */
const updateElement = (ele, callBack, prop, value, parent) =>
{
	let result = callBack(value, ele, parent);
	switch (typeof result)
	{
		case 'object':
			warnIfRebuildingComponent(result, prop, ele);
			Builder.rebuild(result, ele, parent);
			break;
		case 'string':
			const attr = getBindAttr(ele);
			if (attr !== 'textContent')
			{
				ele.setAttribute(attr, result);
				break;
			}

			Html.addHtml(ele, result);
			break;
	}
};

const addClass = (ele, stateStyles, newValue) =>
{
	const keys = Object.keys(stateStyles);
	for (let i = 0, len = keys.length; i < len; i++)
	{
		const prop = keys[i];
		if (!prop)
		{
			continue;
		}

		if (stateStyles[prop] === newValue)
		{
			ele.classList.add(prop);
		}
		else
		{
			ele.classList.remove(prop);
		}
	}
};