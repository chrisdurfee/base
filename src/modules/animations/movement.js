import { Value } from './value.js';

/**
 * Movement
 *
 * This class manages animation movements for DOM elements,
 * handling property updates and value calculations.
 *
 * @class
 */
export class Movement
{
	/**
	 * Creates a new Movement instance.
	 *
	 * @constructor
	 * @param {HTMLElement} element - The DOM element to animate
	 * @param {object} settings - The movement settings
	 */
	constructor(element, settings)
	{
		this.element = element;
		this.property = null;
		/**
		 * @type {any}
		 */
		this.value = null;

		this.setup(settings);
	}

	/**
	 * Sets up the movement with the given settings.
	 *
	 * @param {object} settings - The movement settings
	 * @returns {void}
	 */
	setup(settings)
	{
		this.setupProperty(settings);
	}

	/**
	 * Creates a Value instance for the movement.
	 *
	 * @param {object} settings - The settings containing start and end values
	 * @returns {any} A Value instance or array of Value instances
	 */
	createValue(settings)
	{
		const values = this.getValue(settings);
		return new Value(values);
	}

	/**
	 * Gets the start and end values from settings.
	 *
	 * @param {object} settings - The settings containing startValue and endValue
	 * @returns {object} Object with start and end properties
	 */
	getValue(settings)
	{
		let endValue = this.getEndValue(settings.endValue),
		startValue = this.getStartValue(settings.startValue, endValue);

		return {
			start: startValue,
			end: endValue
		};
	}

	/**
	 * Gets the start value for the animation.
	 *
	 * @param {*} value - The start value
	 * @param {*} end - The end value
	 * @returns {*} The start value
	 */
	getStartValue(value, end)
	{
		return value;
	}

	/**
	 * Gets the end value for the animation.
	 *
	 * @param {*} text - The end value
	 * @returns {*} The end value
	 */
	getEndValue(text)
	{
		return text;
	}

	/**
	 * Sets up the property and value for the movement.
	 *
	 * @param {object} settings - The settings containing property and values
	 * @returns {void}
	 */
	setupProperty(settings)
	{
		this.property = settings.property;
		this.value = this.createValue(settings);
	}

	/**
	 * Updates the value based on the animation delta.
	 *
	 * @param {number} delta - The delta value (0-1) representing animation progress
	 * @returns {any} The updated value (string or array of strings)
	 */
	updateValue(delta)
	{
		if (!this.value)
		{
			return '';
		}

		return this.value.update(delta);
	}

	/**
	 * Performs a step in the animation.
	 *
	 * @param {number} delta - The delta value (0-1) representing animation progress
	 * @returns {void}
	 */
	step(delta)
	{
		var value = this.updateValue(delta);
		this.update(value);
	}

	/**
	 * Updates the element with the new value.
	 * Override this method in subclasses to implement specific update logic.
	 *
	 * @param {*} value - The value to apply
	 * @returns {void}
	 */
	update(value)
	{

	}
}