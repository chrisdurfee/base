import {base} from '../../core.js';

/*
	Value class

	this will create a movement property value that can
	update the property value when animated.

	this will automatically get the units of the value
	and check for value combining to inherit the start
	value and add or remove the end value from the
	start.

	@param (object) settings
*/
export class Value
{
	constructor(settings)
	{
		this.value = null;
		this.setup(settings);
	}

	setup(settings)
	{
		let value = this.value = this.createValue(settings);
		/* we want to check if we are increasing or
		decreasing the target */
		value.increasing = this.isIncreasing(settings.end);
	}

	createValue(settings)
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

	/* this will get the units of the property being animated.
	@param (string) text = the value being modified
	@return (string) the type of units */
	getUnits(text)
	{
		if(typeof text !== 'undefined')
		{
			text = this.getString(text);

			/* we need to remove the numbers or plus or minus equals
			to get the units */
			let pattern = /([0-9.\-\+=])/g;
			return text.replace(pattern, '');
		}
		return '';
	}

	checkCombind(end)
	{
		if(typeof end !== 'undefined')
		{
			end = this.getString(end);
			/* we want to check if we have a plus or minus equals to
			show that we are using the current position as the start */
			let pattern = /(\+=|-=)/g,
			matches = end.match(pattern);
			if(matches)
			{
				return true;
			}
		}
		return false;
	}

	/* this will convert any type to a string
	@param (mixed) value = the value to convert
	@return (string) the value string */
	getString(value)
	{
		return (typeof value !== 'string')? value.toString() : value;
	}

	/* this will get the number from an value and remove
	any other marks including chars.
	@param (mixed) text = the text to get the value from
	@return (number) the number value */
	getValue(text)
	{
		if(typeof text !== 'undefined')
		{
			/* we need to remove any non numeric data from the value
			and convert to number after */
			let pattern = /(\+=|-=|[^0-9.-])/g;
			text = this.getString(text);
			return (text.replace(pattern, '') * 1);
		}
		return 0;
	}

	/* this will check if the element is increasing or decreasing the
	target.
	@return (bool) true or false */
	isIncreasing(endValue)
	{
		/* we want to check if we are adding to the start or
		just modifying the value */
		let value = this.value,
		endTotal = value.end,
		startValue = value.start;
		if(value.combining === true)
		{
			endTotal = (this.getString(endValue).indexOf("-") === -1)? (startValue + endTotal) : startValue - endTotal;
		}
		return (endTotal >= startValue);
	}

	combindValue(delta)
	{
		return (this.value.end * delta);
	}

	calcValue(delta)
	{
		return (this.value.difference * delta);
	}

	/* this will setup theproper method to step the
	value by checking for combining and currying
	theproper function to step the value.
	@param (number) delta
	@return (number) the value step */
	step(delta)
	{
		let step,
		value = this.value;
		if(value.combining === true)
		{
			step = this.combindValue;
		}
		else
		{
			step = this.calcValue;
		}
		return (this.step = step).apply(this, base.listToArray(arguments));
	}

	update(delta)
	{
		let step = this.step(delta),
		value = this.value;

		/* we want to check to add or subtract the step
		by the increase prop */
		return this.applyStep(value, step);
	}

	increaseValue(value, step)
	{
		let start = value.start;
		return (start + step) + value.units;
	}

	decreaseValue(value, step)
	{
		let start = value.start;
		return (start - step) + value.units;
	}

	/* this will setup the proper method to apply the
	step by checking for increasing and currying
	the proper function to applyu the step value.
	@param (object) value
	@return (number) the value step */
	applyStep(value, step)
	{
		let applyStep = (value.increasing === true)? this.increaseValue : this.decreaseValue;
		return (this.applyStep = applyStep).apply(this, base.listToArray(arguments));
	}
}