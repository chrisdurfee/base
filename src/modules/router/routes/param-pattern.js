/**
 * This will get the default route params.
 *
 * @param {array} params
 * @return {(object|null)}
 */
export const getParamDefaults = (params) =>
{
	if (!params.length)
	{
		return null;
	}

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
 * @return {array}
 */
export const paramPattern = (uri) =>
{
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