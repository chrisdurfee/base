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

	if (settings.length < 3)
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
			const scoped = (scopeData)? data.scope(`${prop}[${i}]`) : null;
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