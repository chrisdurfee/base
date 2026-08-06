import { dataBinder } from "../../../../data-binder/data-binder.js";
import { Builder } from "../../../builder.js";
import { getParentData } from './get-parent-data.js';

/**
 * This will watch a data attr and update the
 * children to the element when the attr value is updated.
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
	 * `['items', callBack, false]`. Length alone misread that as
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

	const scopeData = (scope !== false);
	const pathPrefix = prop + '[';
	dataBinder.watch(ele, data, prop, (items) =>
	{
		Builder.removeAll(ele);
		if (!items || items.length < 1)
		{
			return;
		}

		const children = [];
		for (let i = 0, len = items.length; i < len; i++)
		{
			/* scope() allocates a full Data instance and two link
			 * subscriptions per top-level key of the row; pass
			 * `false` as the scope flag to skip it when the row
			 * callBack does not use scoped data. */
			const scoped = (scopeData)? data.scope(pathPrefix + i + ']') : null;
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