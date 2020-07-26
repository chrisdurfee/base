/**
 * This will clone an object.
 *
 * @param {object} obj
 */
export const cloneObject = (obj) =>
{
    return JSON.parse(JSON.stringify(obj));
};

/**
 * This will get the data attribute settings.
 *
 * @param {object} settings
 * @return {object}
 */
export const setupAttrSettings = (settings) =>
{
	let attributes = {};
	if(!settings && typeof settings !== 'object')
	{
		return attributes;
	}

	settings = cloneObject(settings);

	for(var prop in settings)
	{
		if(settings.hasOwnProperty(prop))
		{
			var setting = settings[prop];
			if(typeof setting !== 'function')
			{
				attributes[prop] = setting;
				delete settings[prop];
			}
		}
	}
	return attributes;
};