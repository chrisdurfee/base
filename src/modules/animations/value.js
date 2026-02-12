
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

	getString(value)
	{
		return (typeof value !== 'string')? value.toString() : value;
	}

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

	combindValue(delta)
	{
		return (this.value?.end ?? 0) * delta;
	}

	calcValue(delta)
	{
		return (this.value?.difference ?? 0) * delta;
	}

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

	applyStep(value, step)
	{
		const applyStep = (value.increasing === true)? this.increaseValue : this.decreaseValue;
		return (this.applyStep = applyStep).call(this, value, step);
	}
}