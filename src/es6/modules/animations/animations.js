import {base} from '../../core.js';

export const animations = 
{ 
	version: '1.0.1', 
	
	/* this class tracks all objects being animated and can 
	add and remove them when completed */  
	animating: 
	{ 
		objects: [], 
		
		/* this will create a new animation obj form the params obj 
		and add it to the objects array to be tracked. 
		@param (object) obj = the animation params 
		@return (object) the animation object */  
		add(obj) 
		{  
			let animation = null;  
			
			/* we want to setup the animation to remove itself when 
			finished */ 
			const removeAnimation = (status) =>
			{
				this.remove(animation); 
				/* this will check to return the animation call back 
				and return the status */ 
				let callBack = obj.callBack;
				if(typeof callBack === 'function') 
				{ 
					callBack(status); 
				} 
			}; 
			
			/* this will create a new animation object and we 
			want to add it to the objects array */ 
			animation = new AnimationController(obj, removeAnimation); 
			this.objects.push(animation); 
			return animation;  
		}, 
		
		/* this will stop and remove an animation obj form the 
		params obj and remove it from being tracked. 
		@param (object) obj = the animation obj 
		@return (object) an instance of the animating object */
		remove(obj) 
		{ 
			this.stopAnimation(obj); 
			
			let objects = this.objects,
			indexNumber = base.inArray(objects, obj);
			if(indexNumber > -1) 
			{ 
				objects.splice(indexNumber, 1); 
			} 
			return this; 
		}, 
		
		/* this will remove and stop any animation still active 
		on an element. 
		@param (object) element 
		@return (object) an instance of the animating object */ 
		removeByElement(element) 
		{ 
			if(!element) 
			{ 
				return this;   
			} 
			
			let animations = this.checkAnimating(element); 
			if(animations !== false) 
			{ 
				for(var i = 0, maxLength = animations.length; i < maxLength; i++) 
				{ 
					/* we want to remove the animation fron the object array */ 
					this.remove(animations[i]); 
				}
			}
			return this;
		}, 
		
		/* this will stop an animation if its still active. 
		@param (object) animation = the animation object 
		@return (object) an instance of the animating object */ 
		stopAnimation(animation) 
		{ 
			if(!animation || typeof animation !== 'object') 
			{ 
				return this;  
			} 
			
			if(animation.status !== 'stopped') 
			{ 
				/* we want to stop the animation */  
				animation.stop(); 
			}
			return this; 
		}, 
		
		/* this will get all active aniamtion objects for an element. 
		@param (object) element 
		@return (array) an array of animation objects */ 
		checkAnimating(element) 
		{ 
			let animationArray = []; 
			
			if(element && typeof element === 'object') 
			{ 
				/* we want to get any timers set for our object */ 
				let objects = this.objects;
				for(var i = 0, maxLength = objects.length; i < maxLength; i++) 
				{ 
						var animation = objects[i]; 
						if(animation.element === element) 
						{ 
						animationArray.push(animation); 
						} 
				} 
			}				
			return (animationArray.length >= 1)? animationArray : false;  
		}, 
		
		/* this will stop all previous aniamtions on an element. 
		@param (object) element = the element 
		@return (object) an instance of the animating object */ 
		stopPreviousAnimations(element) 
		{ 
			/* we want to remove the timers and class names 
			from the object */ 
			this.removeByElement(element); 
			return this; 
		}, 
		
		reset() 
		{ 
			this.objects = [];  
			return this; 
		}
	}, 
	
	add(obj) 
	{ 
		return this.animating.add(obj); 
	}, 
	
	remove(obj) 
	{ 
		this.animating.remove(obj); 
	}, 
	
	/* this will setup the request animation frame to 
	allow backwards compat. */ 
	setupAnimationFrame() 
	{ 
		let w = window;
		/* setup request for prefix or setTimeout if 
		not supported */ 
		w.requestAnimationFrame = (
			w.requestAnimationFrame || 
			w.mozRequestAnimationFrame || 
			w.webkitRequestAnimationFrame || 
			w.msRequestAnimationFrame || 
			function(callBack)
			{
				return w.setTimeout(callBack, 1000 / 60); 
			}
		); 
		
		/* setup cancel for prefix or setTimeout if 
		not supported */
		w.cancelAnimationFrame = (
			w.cancelAnimationFrame ||
			w.mozCancelAnimationFrame || 
			function(requestID)
			{
				w.clearTimeout(requestID); 
			} 
		); 
	}, 
	
	stop(element) 
	{ 
		this.animating.stopPreviousAnimations(element); 
	}
}; 

/* we want to setup the animation frame to support 
all browsers */ 
animations.setupAnimationFrame(); 

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
		return (endTotal >= startValue)? true : false; 
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

/* 
	Movement class 
	
	this will create a movement object that can 
	update the property when animated. this is an abstract 
	class and should be extended to use. 
		
	@param (object) element 
	@param (object) settings 
*/
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
				let values = base.css(element, property); 
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
				let params = base.css(element, property); 
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
			if(base.isArray(values.end))
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

/* 
	AnimationController 
	
	this will create an animation controller object 
	that will animate a target property or properties
	on an element over a duration. 
	
	@param (object) settings = the animation settings 
	@param [(function)] callBack = the function to call back 
	when the animation is done 
*/ 
export class AnimationController 
{ 
	constructor(settings, callBack) 
	{ 
		/* this is the delay of the animation in milliseconds */ 
		this.delay = settings.delay || 0; 
		this.delayTimer = null; 
		this.startTime = null; 

		/* this is the animation duration in milliseconds */ 
		this.duration = settings.duration || 0; 

		this.element = this.getElement(settings.element); 
		this.status = 'stopped'; 
		this.animation = null; 

		/* this will be the call back function to return 
		when the animation is complete or errors */ 
		this.callBack = callBack; 

		/* this will setup the fps */ 
		this.fps = settings.fps || 60;    

		/* this will setup the new animation object and start 
		the animation if all is correct or stop and return an 
		error */ 
		this.setup(settings); 
	} 
	
	setup(settings) 
	{ 
		this.animationCallBack = this.animate.bind(this);
		
		let element = this.element;
		if(typeof element === 'object') 
		{ 
			/* we want to start the animation by the animation 
			delay settings */ 
			let callBack = base.createCallBack(this, this.setupAnimation, [element, settings]); 
			this.delayTimer = window.setTimeout(callBack, this.delay); 
		} 
		else 
		{ 
			/* we do not have an element or property to 
			animate so we wantto return an error */ 
			this.updateStatus('error'); 
		} 
		return this;
	}
	
	setupAnimation(element, settings)
	{ 
		this.animation = new Animation(element, settings);
		this.start(settings); 
	} 
	
	/* this will start the animation by getting the start time 
	and starting the animation timer */ 
	start() 
	{ 
		/* this will track the time passed and the progress
		of the animation */  
		this.startTime = new Date(); 
		this.timePassed = 0; 
		this.progress = 0; 
		this.timer = null;
			
		this.startTimer(); 
		return this; 
	} 
	
	stop() 
	{ 
		this.stopTimer(); 
		return this; 
	}  
	
	/* this will get the element that is being used. 
	@param (mixed) element = the element selector or object 
	@return (object) the element */ 
	getElement(element) 
	{ 
		return (typeof element === 'string')? document.querySelector(element) : element; 
	} 
	
	/* this will get the delta to be used with the animation. 
	@return (number) the current delta */ 
	delta(t) 
	{ 
		let delta = 0; 
		
		switch(this.ease) 
		{ 
			case 'easeInOut': 
			case 'easeInOutQuad': 
				delta = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; 					
				break; 
			case 'easeIn': 
			case 'easeInQuad': 
				delta = (t * t); 
				break;
			case 'easeInCubic': 
				delta = (t * t * t); 
				break; 
			case 'easeInQuart': 
				delta = (t * t * t * t); 
				break;
			case 'easeInCirc': 
				delta = (1 - Math.sin(Math.acos(t))); 
				break; 
			case 'easeOut': 
			case 'easeOutQuad': 
				delta = (t * (2 - t)); 
				break; 
			case 'easeOutCubic': 
				delta = ((--t) * t * t + 1); 
				break; 
			case 'easeOutQuart': 
				delta = (1 - (--t) * t * t * t); 
				break;
			case 'linear': 
				delta = t; 
				break; 
			default: 
				delta = t; 
		} 
		return delta; 
	} 
	
	/* this will perform the animation on the element by 
	incrementally updating the element object property 
	by the timed progress. */ 
	animate() 
	{ 
		this.timePassed = new Date() - this.startTime; 

		let percent = this.timePassed / this.duration,
		progress = this.progress = (percent > 1)? 1 : percent; 
		
		let delta = this.delta(progress); 
		this.animation.step(delta); 
		
		/* if the progress is 1 the animation is complete */ 
		if(progress >= 1)  
		{ 
			this.stopTimer(); 
			this.updateStatus('completed'); 
		} 
		else 
		{ 
			this.timer = window.requestAnimationFrame(this.animationCallBack); 
		}
	} 
	
	updateStatus(status) 
	{ 
		let action = () =>
		{ 
			switch(status) 
			{ 
				case 'started': 
					break; 
				case 'stopped': 
					break; 
				case 'completed':  
				case 'error': 
					this.checkCallBack(); 
					break; 
			} 
		}; 
		
		/* we want to save the status and call the 
		action function */ 
		this.status = status; 
		action(); 
	} 
	
	checkCallBack() 
	{ 
		let callBack = this.callBack;
		if(typeof callBack === 'function') 
		{ 
			callBack.call(null, this.status); 
		} 
	} 
	
	/* this will start the animation by setting up the 
	animation timer. */ 
	startTimer() 
	{  
		/* this will check to stop any previous timer before 
		creating a new timer */ 
		this.stopTimer(); 
		
		/* we want to call the animation first to not show a 
		delay in the animation before the callback is called */ 
		this.updateStatus('started');
		this.animate();   
		return this;  
	} 
	
	/* this will stop the animation timer if still setup */ 
	stopTimer() 
	{  
		var w = window;
		if(this.timer) 
		{  
			w.cancelAnimationFrame(this.timer);
			this.updateStatus('stopped'); 
		} 
		
		if(this.delayTimer) 
		{ 
			w.clearTimeout(this.delayTimer); 
		} 
		return this; 
	} 
}

/* this will add an animation to an element. 
@param (object) paramsObj = the animation params 
@return (object) the animation object */ 
export const addAnimation = (paramsObj) =>
{ 
	return animations.add(paramsObj); 
}; 

/* this will stop all animations on an element. 
@param (object) element = the element */
export const stopAnimations = (element) =>
{ 
	animations.stop(element); 
};