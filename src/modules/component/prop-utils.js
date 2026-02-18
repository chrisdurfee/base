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
 * @param {string|number} value - The string or number value to convert
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
 * @returns {{props: object, children: Array}} An object with empty props and children
 */
export const DefaultProps = () => ({
	props: {},
	children: []
});

/**
 * This will set the string prop.
 *
 * @param {string|number} value - The string or number value to convert to children
 * @returns {{props: object, children: Array<object>}} An object with empty props and text node children
 */
export const StringProp = (value) => ({
	props: {},
	children: setChildString(value)
});

/**
 * This will set the array prop.
 *
 * @param {Array<any>} value - The array of children
 * @returns {{props: object, children: Array<any>}} An object with empty props and the children array
 */
export const ArrayProp = (value) => ({
	props: {},
	children: value
});

/**
 * This will set the object prop.
 *
 * @param {Array<any>} args - The arguments array where args[0] is props and args[1] is children
 * @returns {{props: object, children: *}} An object with props and children extracted from args
 */
export const ObjectProp = (args) => ({
	props: args[0] || {}, // this will set an empty object if no props are passed.
	children: prepareChildren(args[1])
});