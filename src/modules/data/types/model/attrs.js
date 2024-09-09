import { Objects } from "../../../../shared/objects.js";
import { Types } from "../../../../shared/types.js";

/**
 * This will get the data attribute settings.
 *
 * @param {object} settings
 * @returns {object}
 */
export const setupAttrSettings = (settings) =>
{
	const attributes = {};
	if (!Types.isObject(settings))
	{
		return attributes;
	}

	const clonedSettings = Objects.clone(settings);
	Object.keys(clonedSettings).forEach(prop =>
	{
		const settingValue = clonedSettings[prop];
        if (typeof settingValue !== 'function')
		{
            attributes[prop] = settingValue;
        }
	});
	return attributes;
};