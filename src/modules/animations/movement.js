import { AttrMovement } from './attr-movement.js';
import { CssMovement } from './css-movement.js';

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

	setupMovementType(element, settings)
	{
		let movement,
		type = this.getType(element, settings);
		switch(type)
		{
			case 'css':
				movement = new CssMovement(element, settings);
				break;
			case 'attr':
				movement = new AttrMovement(element, settings);
				break;
		}
		return movement;
	}

	getType(element, settings)
	{
		return (element.style && settings.property in element.style)? 'css' : 'attr';
	}

	createValue(settings)
	{
		let values = this.getValue(settings);
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

Movement.create = function(element, settings)
{
	return this.prototype.setupMovementType(element, settings);
};