import { CssMovement } from './css-movement.js';
import { AttrMovement } from './attr-movement.js';

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

	/* this will return a new movement object by the
	property type.
	@param (object) element
	@param (object) settings
	@return (object) the new movement */
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

	/* this will create a new value object for the
	property value to be updated.
	@param (object) settings
	@return (object) the value object */
	createValue(settings)
	{
		let values = this.getValue(settings);
		return new Value(values);
	}

	/* this will get the start and end values of the
	movement to be used to create a new value object.
	@param (object) settings
	@return (object) the start and end values */
	getValue(settings)
	{
		let endValue = this.getEndValue(settings.endValue),
		startValue = this.getStartValue(settings.startValue, endValue);

		return {
			start: startValue,
			end: endValue
		};
	}

	/* this will get start value of the property being animated.
	@param (string) value = the value being modified
	@return (string) the type of units */
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

	/* this will update the value object
	@param (number) delta
	return (mixed) the proprety value */
	updateValue(delta)
	{
		return this.value.update(delta);
	}

	step(delta)
	{
		var value = this.updateValue(delta);
		this.update(value);
	}

	/* this should be overridden by the update
	property type being animated.
	@param (mixed) value */
	update(value)
	{

	}
}

/* this is a static moethod that can create
anewinstance of amovement by thepreopty type.
@param (object) element
@param (object) settings
@return (object) the new movement */
Movement.create = function(element, settings)
{
	return this.prototype.setupMovementType(element, settings);
};