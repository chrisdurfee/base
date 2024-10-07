import { Arrays } from '../../shared/arrays.js';
import { Movement } from './movement.js';

/**
 * AttrMovement
 *
 * This will animate an attribute.
 *
 * @class
 */
export class AttrMovement extends Movement
{
	/**
	 * Create an attribute movement.
	 *
	 * @param {object} element - The element to animate.
	 * @param {object} settings - The settings
	 */
	constructor(element, settings)
	{
		super(element, settings);
		this.filter = settings.filter;
	}

	/**
	 * This will get the value of the element property.
	 *
	 * @param {*} value - The value to get.
	 * @param {*} end - The end value.
	 * @returns {*} The value.
	 */
	getStartValue(value, end)
	{
		/**
		 * @type {*} start
		 */
		let start = 0;
		if (typeof value === 'undefined')
		{
			start = this.element[this.property];
		}
		else
		{
			start = this.getValue(value);
		}
		return start;
	}

	/**
	 * This will get the value of the element property.
	 *
	 * @param {*} value - The value to get.
	 * @returns {*} The value.
	 */
	filterValue(value)
	{
		let filter,

		callBack = this.filter;
		if (typeof callBack === 'function')
		{
			/* this will add the step to the value */
			filter = function(value)
			{
				return callBack(value);
			};
		}
		else
		{
			filter = function(value)
			{
				return value;
			};
		}
		return (this.filterValue = filter).apply(this, Arrays.toArray(arguments));
	}

	/**
	 * This will update the value of the element property.
	 *
	 * @param {*} value
	 */
	update(value)
	{
		value = this.filterValue(value);
		this.element[this.property] = value;
	}
}