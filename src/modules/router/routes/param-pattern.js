/**
 * This will get the default route params.
 *
 * @param {Array<string>} params
 * @returns {object|null}
 */
export const getParamDefaults = (params) =>
{
	if (!params.length)
	{
		return null;
	}

	/**
	 * @type {Record<string, any>} defaults
	 */
	const defaults = {};
	params.forEach((param) =>
	{
		defaults[param] = null;
	});

	return defaults;
};

/**
 * This will get the param keys from the uri.
 *
 * @param {string} uri
 * @returns {Array<string>}
 */
export const paramPattern = (uri) =>
{
	/**
	 * @type {Array<string>} params
	 */
	const params = [];
	if (!uri)
	{
		return params;
	}

	const filter = /[*?]/g;
	uri = uri.replace(filter, '');

	const pattern = /:(.[^./?&($]+)\?*/g,
	matches = uri.match(pattern);
	if (matches === null)
	{
		return params;
	}

	matches.forEach((param) =>
	{
		if (param)
		{
			param = param.replace(':', '');
			params.push(param);
		}
	});

	return params;
};