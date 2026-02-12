
/**
 * Value
 *
 * This class manages animation values including start, end, units,
 * and calculations for smooth transitions.
 *
 * @class
 */
export class Value
{
	/**
	 * Creates a new Value instance.
	 *
	 * @constructor
	 * @param {object} settings - The settings object containing start and end values
	 */
	constructor(settings)
	{
		this.value = null;
		this.setup(settings);
	}

	/**
	 * Sets up the value by creating and configuring it.
	 *
	 * @param {object} settings - The settings object containing start and end values
	 * @returns {void}
	 */
	setup(settings)
	{
		let value = this.value = this.createValue(settings);
		/* we want to check if we are increasing or
		decreasing the target */
		value.increasing = this.isIncreasing(settings.end);
	}
	/**
	 * Creates a value object with start, end, units, and difference properties.
	 *
	 * @param {object} settings - The settings object containing start and end values
	 * @returns {object} The value object with combining, start, end, units, and difference properties
	 */	createValue(settings)
	{
		/* we need to get the end value with any extra data
		to check for combining and to get the units */
		let endValue = settings.end,
		startValue = this.getValue(settings.start),
		value = this.getValue(endValue);

		return {
			combining: this.checkCombind(endValue),
			start: startValue,
			end: value,
			units: this.getUnits(endValue),
			difference: (Math.abs(startValue - value))
		};
	}

	/**
	 * Extracts the units from a value string (e.g., 'px', 'em', '%').
	 *
	 * @param {*} text - The text to extract units from
	 * @returns {string} The extracted units or empty string
	 */
	getUnits(text)
	{
		if (typeof text !== 'undefined')
		{
			text = this.getString(text);

			/* we need to remove the numbers or plus or minus equals
			to get the units */
			let pattern = /([0-9.\-+=])/g;
			return text.replace(pattern, '');
		}
		return '';
	}

	/**
	 * Checks if the value should be combined with the current value (+= or -=).
	 *
	 * @param {*} end - The end value to check
	 * @returns {boolean} True if combining, false otherwise
	 */
	checkCombind(end)
	{
		if (typeof end !== 'undefined')
		{
			end = this.getString(end);
			/* we want to check if we have a plus or minus equals to
			show that we are using the current position as the start */
			let pattern = /(\+=|-=)/g,
			matches = end.match(pattern);
			if (matches)
			{
				return true;
			}
		}
		return false;
	}

	/**
	 * Converts a value to a string.
	 *
	 * @param {*} value - The value to convert
	 * @returns {string} The string representation of the value
	 */
	getString(value)
	{
		return (typeof value !== 'string')? value.toString() : value;
	}

	/**
	 * Extracts the numeric value from a string.
	 *
	 * @param {*} text - The text to extract numeric value from
	 * @returns {number} The numeric value or 0
	 */
	getValue(text)
	{
		if (typeof text !== 'undefined')
		{
			/* we need to remove any non numeric data from the value
			and convert to number after */
			let pattern = /(\+=|-=|[^0-9.-])/g;
			text = this.getString(text);
			return (text.replace(pattern, '') * 1);
		}
		return 0;
	}

	/**
	 * Determines if the animation value is increasing or decreasing.
	 *
	 * @param {*} endValue - The end value to check against
	 * @returns {boolean} True if increasing, false if decreasing
	 */
	isIncreasing(endValue)
	{
		/* we want to check if we are adding to the start or
		just modifying the value */
		let value = this.value;
		if (!value)
		{
			return false;
		}
		let endTotal = value.end,
		startValue = value.start;
		if (value.combining === true)
		{
			endTotal = (this.getString(endValue).indexOf("-") === -1)? (startValue + endTotal) : startValue - endTotal;
		}
		return (endTotal >= startValue);
	}

	/**
	 * Calculates the combined value for += or -= operations.
	 *
	 * @param {number} delta - The delta value (0-1) representing animation progress
	 * @returns {number} The calculated combined value
	 */
	combindValue(delta)
	{
		return (this.value?.end ?? 0) * delta;
	}

	/**
	 * Calculates the value based on the difference between start and end.
	 *
	 * @param {number} delta - The delta value (0-1) representing animation progress
	 * @returns {number} The calculated value
	 */
	calcValue(delta)
	{
		return (this.value?.difference ?? 0) * delta;
	}

	/**
	 * Calculates the step value for the current animation frame.
	 *
	 * @param {number} delta - The delta value (0-1) representing animation progress
	 * @returns {number} The calculated step value
	 */
	step(delta)
	{
		let step,
		value = this.value;
		if (!value)
		{
			return 0;
		}
		if (value.combining === true)
		{
			step = this.combindValue;
		}
		else
		{
			step = this.calcValue;
		}
		return (this.step = step).call(this, delta);
	}

	/**
	 * Updates the value based on the animation delta.
	 *
	 * @param {number} delta - The delta value (0-1) representing animation progress
	 * @returns {string} The updated value with units
	 */
	update(delta)
	{
		let step = this.step(delta),
		value = this.value;

		/* we want to check to add or subtract the step
		by the increase prop */
		return this.applyStep(value, step);
	}

	/**
	 * Increases a value by the given step.
	 *
	 * @param {object} value - The value object containing start and units
	 * @param {number} step - The step amount to add
	 * @returns {string} The increased value with units
	 */
	increaseValue(value, step)
	{
		let start = value.start;
		return (start + step) + value.units;
	}

	/**
	 * Decreases a value by the given step.
	 *
	 * @param {object} value - The value object containing start and units
	 * @param {number} step - The step amount to subtract
	 * @returns {string} The decreased value with units
	 */
	decreaseValue(value, step)
	{
		let start = value.start;
		return (start - step) + value.units;
	}

	/**
	 * Applies the step to the value (increase or decrease).
	 *
	 * @param {object} value - The value object
	 * @param {number} step - The step amount
	 * @returns {string} The updated value with units
	 */
	applyStep(value, step)
	{
		const applyStep = (value.increasing === true)? this.increaseValue : this.decreaseValue;
		return (this.applyStep = applyStep).call(this, value, step);
	}
}