import { DataTracker } from "../../../../../main/data-tracker/data-tracker.js";
import { dataBinder } from "../../../../data-binder/data-binder.js";
import { Builder } from "../../../builder.js";
import { getParentData } from './get-parent-data.js';

/**
 * This will release every scoped row data source and empty the
 * list so the same record can be reused by the next render.
 *
 * @param {Array<object>} scopes
 * @returns {void}
 */
const releaseScopes = (scopes) =>
{
	for (let i = 0, len = scopes.length; i < len; i++)
	{
		const scoped = scopes[i];
		if (scoped)
		{
			scoped.remove();
		}
	}
	scopes.length = 0;
};

/**
 * This will register the scoped row data with the data tracker so
 * the links back to the parent source are released when the host
 * element is destroyed.
 */
DataTracker.addType('forScopes', (data) =>
{
	if (!data)
	{
		return false;
	}

	releaseScopes(data.scopes);
});

/**
 * This will watch a data attr and update the
 * children to the element when the attr value is updated.
 *
 * Scoped row data is opt-in. `data.scope()` allocates a Data instance and two
 * link subscriptions per row per render, and most row callBacks never touch
 * the third argument, so it is only built when the settings ask for it:
 * `['items', callBack, true]`.
 *
 * @param {object} ele
 * @param {Array<any>} settings
 * @param {object} parent
 * @returns {void}
 */
export const forEach = (ele, settings, parent) =>
{
	let data, prop, item, scope;

	/**
	 * Detect the form by the first element's type instead of by
	 * length so the parent-data form can pass the scope flag:
	 * `['items', callBack, true]`. Length alone misread that as
	 * the explicit-data form `[data, prop, callBack]`.
	 */
	if (typeof settings[0] === 'string' || settings.length < 3)
	{
		const parentData = getParentData(parent);
		if (!parentData)
		{
			return;
		}

		data = parentData;
		[prop, item, scope] = settings;
	}
	else
	{
		[data, prop, item, scope] = settings;
	}

	const scopeData = (scope === true);
	const pathPrefix = prop + '[';

	/**
	 * The scoped row sources of the current render are held in one
	 * tracked record. Every re-render releases the previous set, and
	 * the tracker releases the last set when the element goes away.
	 */
	const tracked = (scopeData)? { scopes: [] } : null;
	if (tracked)
	{
		DataTracker.add(ele, 'forScopes', tracked);
	}

	dataBinder.watch(ele, data, prop, (items) =>
	{
		Builder.removeAll(ele);
		if (tracked)
		{
			releaseScopes(tracked.scopes);
		}

		if (!items || items.length < 1)
		{
			return;
		}

		const children = [];
		for (let i = 0, len = items.length; i < len; i++)
		{
			const scoped = (scopeData)? data.scope(pathPrefix + i + ']') : null;
			if (scoped && tracked)
			{
				tracked.scopes.push(scoped);
			}

			const layout = item(
				items[i],
				i,
				scoped,
				children
			);
			if (layout === null)
			{
				continue;
			}
			children.push(layout);
		}

		return Builder.build(children, ele, parent);
	});
}