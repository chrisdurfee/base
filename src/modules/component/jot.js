import { Component } from './component.js';
import { SHORTHAND_METHODS } from './shorthand-methods.js';

/**
 * This will get the jot method by value. If the method is an
 * object, it will be nested in a function.
 *
 * @param {object|function} value
 * @returns {function}
 */
const getJotShorthandMethod = (value) =>
{
	return (typeof value === 'function')? value : () => value;
};

/**
 * This will create a jot component object that will be used
 * to create the jot component.
 *
 * @param {object} settings
 * @returns {object}
 */
const JotComponent = (settings) =>
{
	const component = {};
	if (!settings)
	{
		return component;
	}

	Object.entries(settings).forEach(([prop, value]) =>
	{
		const alias = SHORTHAND_METHODS[prop] || prop;
		component[alias] = getJotShorthandMethod(value);
	});

	return component;
};

/**
 * This will create a class.
 *
 * @param {typeof Component} Base
 * @param {object} settings
 * @returns {typeof Component} Child - The child class that extends the base class.
 */
const createClass = (Base, settings) =>
{
	class Child extends Base {}
	Object.assign(Child.prototype, settings);
	return Child;
};

/**
 * This will create a shorthand component.
 *
 * @param {object|function} layout
 * @param {typeof Component} [extend=Component]
 * @returns {typeof Component|null} A class (constructor) or `null` if no layout is given.
 */
export const Jot = (layout, extend = Component) =>
{
	if (!layout)
	{
		return null;
	}

	let settings;
	const layoutType = typeof layout;

	/**
	 * This will handle the layout components that are objects.
	 */
	if (layoutType === 'object' && layout.render)
	{
		settings = JotComponent(layout);
		return createClass(extend, settings);
	}

	/**
	 * This will handle non component layouts. If the layout is not
	 * a function, it will be wrapped in a function to be used as
	 * the render method.
	 */
	const render = (layoutType === 'function')? layout : () => layout;
	settings = { render };
	return createClass(extend, settings);
};