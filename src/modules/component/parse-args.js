/**
 * This will prepare the children.
 *
 * @param {*} value
 * @returns {*}
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
 * @param {array} args
 * @returns {object}
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