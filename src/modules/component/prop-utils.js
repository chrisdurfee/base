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
 * @returns {Array<object>}
 */
const setChildString = (value) =>
{
	return [{
		tag: 'text',
		textContent: value
	}];
};

/**
 * This will set the default props.
 *
 * @returns {object}
 */
export const DefaultProps = () => ({
    props: {},
    children: []
});

/**
 * This will set the string prop.
 *
 * @param {string} value
 * @returns {object}
 */
export const StringProp = (value) => ({
    props: {},
    children: setChildString(value)
});

/**
 * This will set the array prop.
 *
 * @param {array} value
 * @returns {object}
 */
export const ArrayProp = (value) => ({
    props: {},
    children: value
});

/**
 * This will set the object prop.
 *
 * @param {array} args
 * @returns {object}
 */
export const ObjectProp = (args) => ({
    props: args[0] || {}, // this will set an empty object if no props are passed.
    children: prepareChildren(args[1])
});