import { Value } from './value.js';

export class Movement
{
	constructor(element, settings)
	{
		this.element = element;
		this.property = null;
		this.value = null;

		this.setup(settings);
	}

	setup(settings)
	{
		this.setupProperty(settings);
	}

	createValue(settings)
	{
		const values = this.getValue(settings);
		return new Value(values);
	}

	getValue(settings)
	{
		let endValue = this.getEndValue(settings.endValue),
		startValue = this.getStartValue(settings.startValue, endValue);

		return {
			start: startValue,
			end: endValue
		};
	}

	getStartValue(value, end)
	{
		return value;
	}

	getEndValue(text)
	{
		return text;
	}

	setupProperty(settings)
	{
		this.property = settings.property;
		this.value = this.createValue(settings);
	}

	updateValue(delta)
	{
		return this.value.update(delta);
	}

	step(delta)
	{
		var value = this.updateValue(delta);
		this.update(value);
	}

	update(value)
	{

	}
}