import { Types } from "../../../../shared/types.js";

/**
 * This will get the data attribute settings.
 *
 * @param {object} [settings={}]
 * @returns {object}
 */
export const setupAttrSettings = (settings = {}) =>
{
	const attributes = {};
	if (!Types.isObject(settings))
	{
		return attributes;
	}

	/* Iterate the settings directly — no need to clone first since we're
	 * constructing a new `attributes` object from each property value
	 * and already skip functions. Cloning here was the source of
	 * structuredClone failures when items (e.g. scoped for-directive rows)
	 * contained function properties or non-serialisable values. */
	const keys = Object.keys(settings);
	for (let i = 0, len = keys.length; i < len; i++)
	{
		const prop = keys[i];
		const settingValue = settings[prop];
		if (typeof settingValue !== 'function')
		{
			attributes[prop] = settingValue;
		}
	}
	return attributes;
};