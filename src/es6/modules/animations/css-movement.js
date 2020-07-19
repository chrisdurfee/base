import {Movement} from './movement.js';
import {base} from '../../core.js';

export class CssMovement extends Movement
{ 
	constructor(element, settings)
	{ 
		this.style = element.style;
		super(element, settings); 
	} 
	
	/* this will get start value of the property being animated. 
	@param (string) value = the value being modified 
	@return (string) the type of units */
	getStartValue(value, end) 
	{ 
		let start = 0;   
		if(typeof value === 'undefined') 
		{ 
			let element = this.element,
			property = this.property, 
			method = this.method; 
			if(method)
			{ 
				let values = base.getCss(element, property); 
				if(values !== 'none')
				{ 
					let cssPattern = new RegExp('(?:' + method + '\((.+)\))', 'g');
					values.replace(cssPattern, (fullMatch, params) =>
					{ 
						start = (typeof params === 'string')? params.split(',') : null;  
					});
				}
				else 
				{ 
					let unit,
					pattern = /\d+/g,
					length = end.length; 
					start = []; 
					for(var i = 0; i < length; i++)
					{ 
						/* we want to ensure that we add the same units */ 
						unit = end[i].replace(pattern, ''); 
						start.push(0 + unit);
					}
				}
			} 
			else 
			{ 
				let params = base.getCss(element, property); 
				start = (typeof params === 'string')? params.split(' ') : null;
			} 
		}
		else 
		{ 
			start = this.getCssValue(value); 
		} 
		return start; 
	} 
	
	getEndValue(text)
	{ 
		return this.getCssValue(text);
	}
	
	/* this will get the number from an value and remove 
	any other marks including chars. 
	@param (mixed) text = the text to get the value from 
	@return (number) the number value */ 
	getCssValue(text) 
	{ 
		let textType = typeof text; 
		if(textType !== 'undefined') 
		{  
			let value; 
			
			if(textType === 'string')
			{ 
				/* this will check to setup the css value by 
				checking if we are using a css method 
				e.g. transform: translate3d() */ 
				let cssPattern = /(?:(\w+\s*)\((.+)\))/g;
				text.replace(cssPattern, (fullMatch, method, params) =>
				{ 
					value = (typeof params === 'string')? params.split(',') : null;  
					self.setMethod(method); 
				}); 

				if(value === undefined)
				{
					/* this will check to split by space to allow 
					short hand */ 
					value = text.split(' ');
				}
				return value;
			}
			else
			{ 
				return text; 
			}
		}
		return 0;
	} 
	
	/* this will create a new value object array for the 
	property values to be updated. 
	@param (object) settings 
	@return (array) the values array */
	createValue(settings)
	{ 
		let valueArray = [],
		values = this.getValue(settings); 
		if(values)
		{ 
			if(Array.isArray(values.end))
			{ 
				let start = values.start, 
				end = values.end; 
				for(var i = 0, length = end.length; i < length; i++)
				{ 
					valueArray.push(new Value({ 
						start: start[i], 
						end: end[i]
					})); 
				}
			}
			else 
			{ 
				valueArray.push(new Value(values)); 
			}
		}
		return valueArray;  
	} 
	
	setMethod(method)
	{ 
		if(typeof this.method !== 'string')
		{ 
			this.method = method;
		}
	} 
	
	updateValue(delta)
	{ 
		let valueArray = [],
		values = this.value; 
		if(values.length)
		{ 
			for(var i = 0, length = values.length; i < length; i++)
			{ 
				valueArray.push(values[i].update(delta)); 
			}
		}
		return valueArray; 
	} 
	
	update(value)
	{ 
		let method = this.method; 
		if(method) 
		{ 
			value = method + '(' + value.join(', ') + ')'; 
		}
		else 
		{ 
			value = value.join(' '); 
		}
		this.style[this.property] = value;
	}
}