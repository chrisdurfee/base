/**
 * This will store the pod shorthand method alaises.
 *
 * @constant
 * @type {object} SHORTHAND_METHODS
 */
export const SHORTHAND_METHODS =
{
	created: 'onCreated',
	setStates: 'setupStates',
	state: 'setupStates',
	events: 'setupEvents',
	before: 'beforeSetup',
	render: 'render',
	after: 'afterSetup',
	destroy: 'beforeDestroy'
};

/**
 * This will get the shorthand method by value. If the value is an
 * object, it will be nested in a function.
 *
 * `state` accepts a plain object as well as a factory, so the
 * object form has to be wrapped before it reaches the component,
 * which always calls setupStates().
 *
 * @param {object|function} value
 * @param {string} alias
 * @returns {function}
 */
export const getShorthandMethod = (value, alias) =>
{
	return (typeof value !== 'function' && alias === 'setupStates')? () => value : value;
};