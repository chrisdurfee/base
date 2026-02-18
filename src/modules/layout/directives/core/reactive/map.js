import { Builder } from "../../../builder.js";

/**
 * This will map children to the element.
 *
 * @param {object} ele
 * @param {Array<any>} settings
 * @param {object} parent
 * @returns {void}
 */
export const map = (ele, settings, parent) =>
{
	const items = settings[0];
	if (!items || items.length < 1)
	{
		return;
	}

	const item = settings[1];
	const children = [];

	// Classic for loop - faster than forEach in hot path
	for (let i = 0, len = items.length; i < len; i++)
	{
		const row = items[i];
		if (!row)
		{
			continue;
		}

		const layout = item(row, i);
		if (layout === null)
		{
			continue;
		}

		children.push(layout);
	}

	Builder.build(children, ele, parent);
};