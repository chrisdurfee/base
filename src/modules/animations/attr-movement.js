import { Movement } from './movement.js';
import { Arrays } from '../../shared/arrays.js';

export class AttrMovement extends Movement
{
	constructor(element, settings)
	{
		super(element, settings);
		this.filter = settings.filter;
	}

	getStartValue(value, end)
	{
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

	update(value)
	{
		value = this.filterValue(value);
		this.element[this.property] = value;
	}
}