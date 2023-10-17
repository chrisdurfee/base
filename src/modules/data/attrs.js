import { Objects } from "../../shared/objects";

/**
 * This will get the data attribute settings.
 *
 * @param {object} settings
 * @return {object}
 */
export const setupAttrSettings = (settings) =>
{
	const attributes = {};
	if (!settings || typeof settings !== 'object')
	{
		return attributes;
	}

	settings = Objects.clone(settings);
	for (var prop in settings)
	{
		if (!settings.hasOwnProperty(prop))
		{
			continue;
		}

		var setting = settings[prop];
		if (typeof setting !== 'function')
		{
			attributes[prop] = setting;
			delete settings[prop];
		}
	}
	return attributes;
};