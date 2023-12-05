/**
 * This will prepare the children.
 *
 * @param {mixed} value
 * @returns {mixed}
 */
const prepareChildren = (value) =>
{
	if (typeof value !== 'string')
	{
		return value;
	}

	return setChildString(value);
};

/**
 * This will set the child string.
 *
 * @param {string} value
 * @returns {array}
 */
const setChildString = (value) =>
{
	return [{
		tag: 'text',
		textContent: value
	}];
};

/**
 * This will parse the arguments passed to the atom.
 *
 * @param {Array} args
 * @returns {Object}
 */
export const parseArgs = (args) =>
{
	if (!args)
    {
		return {
			props: {},
			children: []
		};
    }

    const first = args[0];
    if (typeof first === 'string')
    {
		return {
			props: {},
            children: setChildString(first)
        };
    }

	if (Array.isArray(first))
	{
		return {
            props: {},
            children: first
        };
	}

    return {
		props: first || {},
        children: prepareChildren(args[1])
    };
};