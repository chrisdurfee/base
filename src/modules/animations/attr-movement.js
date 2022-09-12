import {Movement} from './movement.js';
import {base} from '../../core.js';

/*
	AttrMovement class

	this will create an attr movement object that can
	update the property when animated.

	@param (object) element
	@param (object) settings
*/
export class AttrMovement extends Movement
{
	constructor(element, settings)
	{
		super(element, settings);
		this.filter = settings.filter;
	}

	/* this will get start value of the property being animated.
	@param (string) value = the value being modified
	@return (string) the type of units */
	getStartValue(value, end)
	{
		let start = 0;
		if(typeof value === 'undefined')
		{
			start = this.element[this.property];
		}
		else
		{
			start = this.getValue(value);
		}
		return start;
	}

	filterValue(value)
	{
		let filter,

		callBack = this.filter;
		if(typeof callBack === 'function')
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
		return (this.filterValue = filter).apply(this, base.listToArray(arguments));
	}

	update(value)
	{
		value = this.filterValue(value);
		this.element[this.property] = value;
	}
}