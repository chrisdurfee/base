/* base framework module */ 
/* 
	javascript animation add and remove with full object 
	animation tracking 
*/ 
(function() 
{
	"use strict"; 
	
	var math = 
	{ 
		round: function(number) 
		{ 
			return ~~ (0.5 + number); 
		}, 

		floor: function(number) 
		{ 
			return ~~number; 
		}
	}; 
	
	/* this will add and remove animations */ 
	base.extend.animations = 
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
			add: function(obj) 
			{  
				var animation = null, 
				self = this;  
				
				/* we want to setup the animation to remove itself when 
				finished */ 
				var removeAnimation = function(status) 
				{
					self.remove(animation); 
					/* this will check to return the animation call back 
					and return the status */ 
					var callBack = obj.callBack;
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
			remove: function(obj) 
			{ 
				this.stopAnimation(obj); 
				
				var objects = this.objects;
				var indexNumber = base.inArray(objects, obj);
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
			removeByElement: function(element) 
			{ 
				if(element) 
				{ 
					var animating = this.checkAnimating(element); 
					if(animating !== false) 
					{ 
						var animations = animating; 
						for(var i = 0, maxLength = animations.length; i < maxLength; i++) 
						{ 
							/* we want to remove the animation fron the object array */ 
							this.remove(animations[i]); 
						}
					}  
				} 
				return this;
			}, 
			
			/* this will stop an animation if its still active. 
			@param (object) animation = the animation object 
			@return (object) an instance of the animating object */ 
			stopAnimation: function(animation) 
			{ 
				if(animation && typeof animation === 'object') 
				{ 
					if(animation.status !== 'stopped') 
					{ 
						/* we want to stop the animation */  
						animation.stop(); 
					} 
				} 
				return this; 
			}, 
			
			/* this will get all active aniamtion objects for an element. 
			@param (object) element 
			@return (array) an array of animation objects */ 
			checkAnimating: function(element) 
			{ 
				var animationArray = []; 
				
				if(element && typeof element === 'object') 
				{ 
					/* we want to get any timers set for our object */ 
					var objects = this.objects;
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
			stopPreviousAnimations: function(element) 
			{ 
				/* we want to remove the timers and class names 
				from the object */ 
				this.removeByElement(element); 
				return this; 
			}, 
			
			reset: function() 
			{ 
				this.objects = [];  
				return this; 
			}
		}, 
		
		add: function(obj) 
		{ 
			return this.animating.add(obj); 
		}, 
		
		remove: function(obj) 
		{ 
			this.animating.remove(obj); 
		}, 
		
		/* this will setup the request animation frame to 
		allow backwards compat. */ 
		setupAnimationFrame: function() 
		{ 
			var w = window;
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
		
		stop: function(element) 
		{ 
			this.animating.stopPreviousAnimations(element); 
		}
	}; 
	
	/* we want to setup the animation frame to support 
	all browsers */ 
	base.animations.setupAnimationFrame(); 
	
	/* 
		Animation class 
		
		this will create a new animation object to animate 
		attr, css, or css method properties. 
		
		animations can update multiple properties in one 
		aniamtion. 
		@param (object) element 
		@param (object) settings 
	*/ 
	var Animation = base.Class.extend(
	{ 
		constructor: function(element, settings)
		{ 
			this.element = element; 

			/* this will track the animation properties being 
			animated */ 
			this.movements = [];
			this.setupMovements(settings);
		}, 
		
		setup: function()
		{ 
			this.setupMovements(settings);
		}, 
		
		addMovement: function(property)
		{ 
			this.movements.push(property); 
		}, 
		
		setupMovements: function(settings)
		{ 
			var movement, 
			element = this.element, 
			self = this; 
			
			var addMovement = function(movementSettings)
			{ 
				movement = Movement.create(element, movementSettings); 
				self.addMovement(movement); 
			}; 
			
			/* this will check if we have multiple properties to 
			add or only one property */ 
			var property = settings.property; 
			if(base.isArray(property))
			{ 
				for(var i = 0, length = property.length; i < length; i++)
				{ 
					addMovement(property[i]); 
				}
			}
			else
			{ 
				addMovement(settings); 
			}
		}, 
		
		/* this will step the animation movements by the 
		delta. 
		@param (number) delta */ 
		step: function(delta)
		{ 
			var movements = this.movements, 
			length = movements.length; 
			for(var i = 0; i < length; i++)
			{ 
				movements[i].step(delta); 
			}
		}
	}); 
	
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
	var Value = base.Class.extend(
	{ 
		constructor: function(settings)
		{ 
			this.value = null; 
			this.setup(settings); 
		},
		
		setup: function(settings)
		{ 
			var value = this.value = this.createValue(settings);
			/* we want to check if we are increasing or 
			decreasing the target */
			value.increasing = this.isIncreasing(settings.end);
		}, 
		
		createValue: function(settings)
		{ 
			/* we need to get the end value with any extra data 
			to check for combining and to get the units */ 
			var endValue = settings.end, 
			startValue = this.getValue(settings.start), 
			value = this.getValue(endValue);
			
			return {
				combining: this.checkCombind(endValue),
				start: startValue, 
				end: value,  
				units: this.getUnits(endValue),
				difference: (Math.abs(startValue - value))
			}; 
		}, 
		
		/* this will get the units of the property being animated. 
		@param (string) text = the value being modified 
		@return (string) the type of units */ 
		getUnits: function(text) 
		{ 
			if(typeof text !== 'undefined') 
			{ 
				text = this.getString(text); 
				
				/* we need to remove the numbers or plus or minus equals 
				to get the units */ 
				var pattern = /([0-9.\-\+=])/g;  
				return text.replace(pattern, ''); 
			} 
			return ''; 
		}, 
		
		checkCombind: function(end)
		{ 
			if(typeof end !== 'undefined') 
			{  
				end = this.getString(end); 
				/* we want to check if we have a plus or minus equals to 
				show that we are using the current position as the start */ 
				var pattern = /(\+=|-=)/g, 
				matches = end.match(pattern); 
				if(matches) 
				{ 
					return true; 
				}  
			}
			return false;
		},  
		
		/* this will convert any type to a string 
		@param (mixed) value = the value to convert 
		@return (string) the value string */ 
		getString: function(value) 
		{ 
			return (typeof value !== 'string')? value.toString() : value; 
		},
		
		/* this will get the number from an value and remove 
		any other marks including chars. 
		@param (mixed) text = the text to get the value from 
		@return (number) the number value */ 
		getValue: function(text) 
		{ 
			if(typeof text !== 'undefined') 
			{  
				/* we need to remove any non numeric data from the value 
				and convert to number after */ 
				var pattern = /(\+=|-=|[^0-9.-])/g;  
				text = this.getString(text);
				return (text.replace(pattern, '') * 1); 
			} 
			return 0; 
		}, 
		
		/* this will check if the element is increasing or decreasing the 
		target. 
		@return (bool) true or false */ 
		isIncreasing: function(endValue) 
		{ 
			/* we want to check if we are adding to the start or 
			just modifying the value */
			var value = this.value; 
			var endTotal = value.end; 
			var startValue = value.start;
			if(value.combining === true) 
			{ 
				endTotal = (this.getString(endValue).indexOf("-") === -1)? (startValue + endTotal) : startValue - endTotal; 
			}
			return (endTotal >= startValue)? true : false; 
		}, 
		
		/* this will setup theproper method to step the 
		value by checking for combining and currying 
		theproper function to step the value. 
		@param (number) delta 
		@return (number) the value step */ 
		step: function(delta)
		{ 
			var step; 
			var value = this.value; 
			if(value.combining === true)
			{ 
				step = function(delta)
				{ 
					return (value.end * delta);
				}; 
			}
			else 
			{ 
				step = function(delta)
				{ 
					return (value.difference * delta);
				};
			}
			return (this.step = step).apply(this, base.listToArray(arguments)); 
		}, 
		
		update: function(delta)
		{ 
			var step = this.step(delta); 
			var value = this.value;
			
			/* we want to check to add or subtract the step 
			by the increase prop */ 
			return this.applyStep(value, step);  
		}, 
		 
		/* this will setup the proper method to apply the 
		step by checking for increasing and currying 
		the proper function to applyu the step value. 
		@param (object) value 
		@return (number) the value step */
		applyStep: function(value, step)
		{ 
			var applyStep; 
			if(value.increasing === true)
			{ 
				/* this will add the step to the value */ 
				applyStep = function(value, step)
				{ 
					var start = value.start;
					return (start + step) + value.units; 
				}; 
			}
			else 
			{ 
				applyStep = function(value, step)
				{ 
					var start = value.start;
					return (start - step) + value.units; 
				};
			}
			return (this.applyStep = applyStep).apply(this, base.listToArray(arguments)); 
		}
	}); 
	
	/* 
		Movement class 
		
		this will create a movement object that can 
		update the property when animated. this is an abstract 
		class and should be extended to use. 
		 
		@param (object) element 
		@param (object) settings 
	*/
	var Movement = base.Class.extend(
	{ 
		constructor: function(element, settings)
		{ 
			this.element = element; 
			this.property = null; 
			this.value = null; 

			this.setup(settings);  
		}, 
		
		setup: function(settings)
		{ 
			this.setupProperty(settings); 
		}, 
		
		/* this will return a new movement object by the
		property type. 
		@param (object) element 
		@param (object) settings 
		@return (object) the new movement */ 
		setupMovementType: function(element, settings)
		{ 
			var movement,
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
		}, 
		
		getType: function(element, settings) 
		{ 
			return (element.style && settings.property in element.style)? 'css' : 'attr'; 
		},
		
		/* this will create a new value object for the 
		property value to be updated. 
		@param (object) settings 
		@return (object) the value object */ 
		createValue: function(settings)
		{ 
			var values = this.getValue(settings); 
			return new Value(values);  
		}, 
		
		/* this will get the start and end values of the
		movement to be used to create a new value object. 
		@param (object) settings 
		@return (object) the start and end values */
		getValue: function(settings)
		{ 
			var endValue = this.getEndValue(settings.endValue), 
			startValue = this.getStartValue(settings.startValue, endValue);
			
			return { 
				start: startValue, 
				end: endValue
			};
		}, 
		
		/* this will get start value of the property being animated. 
		@param (string) value = the value being modified 
		@return (string) the type of units */
		getStartValue: function(value, end) 
		{ 
			return value;  
		}, 
		
		getEndValue: function(text)
		{ 
			return text;
		},  
		
		setupProperty: function(settings)
		{ 
			this.property = settings.property;   
			this.value = this.createValue(settings);
		}, 
		
		/* this will update the value object
		@param (number) delta 
		return (mixed) the proprety value */ 
		updateValue: function(delta)
		{ 
			return this.value.update(delta); 
		}, 
		
		step: function(delta)
		{ 
			var value = this.updateValue(delta); 
			this.update(value); 
		}, 
		
		/* this should be overridden by the update 
		property type being animated. 
		@param (mixed) value */
		update: function(value)
		{ 
			
		}
	}); 
	
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
	var AttrMovement = Movement.extend(
	{ 
		/* this will get start value of the property being animated. 
		@param (string) value = the value being modified 
		@return (string) the type of units */
		getStartValue: function(value, end) 
		{ 
			var start = 0;   
			if(typeof value === 'undefined') 
			{ 
				start = this.element[this.property]; 
			}
			else 
			{ 
				start = this.getValue(value); 
			} 
			return start; 
		}, 
		
		update: function(value)
		{ 
			this.element[this.property] = value;
		}
	});
	
	var CssMovement = Movement.extend(
	{ 
		constructor: function(element, settings)
		{ 
			this.style = element.style; 
			Movement.call(this, element, settings); 
		}, 
		
		/* this will get start value of the property being animated. 
		@param (string) value = the value being modified 
		@return (string) the type of units */
		getStartValue: function(value, end) 
		{ 
			var start = 0;   
			if(typeof value === 'undefined') 
			{ 
				var element = this.element,
				property = this.property, 
				method = this.method; 
				if(method)
				{ 
					var values = base.css(element, property); 
					if(values !== 'none')
					{ 
						var cssPattern = new RegExp('(?:' + method + '\((.+)\))', 'g');
						values.replace(cssPattern, function(fullMatch, params)
						{ 
							start = (typeof params === 'string')? params.split(',') : null;  
						});
					}
					else 
					{ 
						var unit; 
						var pattern = /\d+/g; 
						var length = end.length; 
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
					var params = base.css(element, property); 
					start = (typeof params === 'string')? params.split(' ') : null;
				} 
			}
			else 
			{ 
				start = this.getCssValue(value); 
			} 
			return start; 
		}, 
		
		getEndValue: function(text)
		{ 
			return this.getCssValue(text);
		},
		
		/* this will get the number from an value and remove 
		any other marks including chars. 
		@param (mixed) text = the text to get the value from 
		@return (number) the number value */ 
		getCssValue: function(text) 
		{ 
			var textType = typeof text; 
			if(textType !== 'undefined') 
			{  
				var value, 
				self = this; 
				
				if(textType === 'string')
				{ 
					/* this will check to setup the css value by 
					checking if we are using a css method 
					e.g. transform: translate3d() */ 
					var cssPattern = /(?:(\w+\s*)\((.+)\))/g;
					text.replace(cssPattern, function(fullMatch, method, params)
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
		}, 
		
		/* this will create a new value object array for the 
		property values to be updated. 
		@param (object) settings 
		@return (array) the values array */
		createValue: function(settings)
		{ 
			var valueArray = []; 
			var values = this.getValue(settings); 
			if(values)
			{ 
				if(base.isArray(values.end))
				{ 
					var start = values.start, 
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
		}, 
		
		setMethod: function(method)
		{ 
			if(typeof this.method !== 'string')
			{ 
				this.method = method;
			}
		}, 
		
		updateValue: function(delta)
		{ 
			var valueArray = []; 
			var values = this.value; 
			if(values.length)
			{ 
				for(var i = 0, length = values.length; i < length; i++)
				{ 
					valueArray.push(values[i].update(delta)); 
				}
			}
			return valueArray; 
		}, 
		
		update: function(value)
		{ 
			var method = this.method; 
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
	});  
	
	/* 
		AnimationController 
		
		this will create an animation controller object 
		that will animate a target property or properties
		on an element over a duration. 
		
		@param (object) settings = the animation settings 
		@param [(function)] callBack = the function to call back 
		when the animation is done 
	*/ 
	var AnimationController = base.Class.extend( 
	{ 
		constructor: function(settings, callBack) 
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
		}, 
		
		setup: function(settings) 
		{ 
			this.animationCallBack = this.animate.bind(this);
			
			var element = this.element;
			if(typeof element === 'object') 
			{ 
				/* we want to start the animation by the animation 
				delay settings */ 
				var callBack = base.createCallBack(this, this.setupAnimation, [element, settings]); 
				this.delayTimer = window.setTimeout(callBack, this.delay); 
			} 
			else 
			{ 
				/* we do not have an element or property to 
				animate so we wantto return an error */ 
				this.updateStatus('error'); 
			} 
			return this;
		},
		
		setupAnimation: function(element, settings)
		{ 
			this.animation = new Animation(element, settings);
			this.start(settings); 
		}, 
		
		/* this will start the animation by getting the start time 
		and starting the animation timer */ 
		start: function() 
		{ 
			/* this will track the time passed and the progress
			of the animation */  
			this.startTime = new Date(); 
			this.timePassed = 0; 
			this.progress = 0; 
			this.timer = null;
			 
			this.startTimer(); 
			return this; 
		}, 
		
		stop: function() 
		{ 
			this.stopTimer(); 
			return this; 
		},  
		
		/* this will get the element that is being used. 
		@param (mixed) element = the element selector or object 
		@return (object) the element */ 
		getElement: function(element) 
		{ 
			return (typeof element === 'string')? document.querySelector(element) : element; 
		}, 
		
		/* this will get the delta to be used with the animation. 
		@return (number) the current delta */ 
		delta: function(t) 
		{ 
			var delta = Ease.get(this.ease);
			return (this.delta = delta).apply(this, base.listToArray(arguments)); 
		}, 
		
		/* this will perform the animation on the element by 
		incrementally updating the element object property 
		by the timed progress. */ 
		animate: function() 
		{ 
			this.timePassed = new Date() - this.startTime; 
			var percent = this.timePassed / this.duration; 
			var progress = this.progress = (percent > 1)? 1 : percent; 
			
			var delta = this.delta(progress); 
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
		}, 
		
		updateStatus: function(status) 
		{ 
			var self = this; 
			var action = function() 
			{ 
				switch(status) 
				{ 
					case 'started': 
						break; 
					case 'stopped': 
						break; 
					case 'completed':  
					case 'error': 
						self.checkCallBack(); 
						break; 
				} 
			}; 
			
			/* we want to save the status and call the 
			action function */ 
			this.status = status; 
			action(); 
		}, 
		
		checkCallBack: function() 
		{ 
			var callBack = this.callBack;
			if(typeof callBack === 'function') 
			{ 
				callBack.call(null, this.status); 
			} 
		}, 
		
		/* this will start the animation by setting up the 
		animation timer. */ 
		startTimer: function() 
		{  
			/* this will check to stop any previous timer before 
			creating a new timer */ 
			this.stopTimer(); 
			
			/* we want to call the animation first to not show a 
			delay in the animation before the callback is called */ 
			this.updateStatus('started');
			this.animate();   
			return this;  
		}, 
		
		/* this will stop the animation timer if still setup */ 
		stopTimer: function() 
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
	}); 
	
	var Ease = 
	{
		get: function(ease)
		{
			var method = this[ease]; 
			if(!method)
			{
				method = this.linear; 
			}
			return method; 
		}, 

		easeInOut: function(t)
		{
			var delta = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
			return delta;
		}, 

		easeInOutQuad: function(t)
		{
			return this.easeInOut(t); 
		}, 

		easeIn: function(t)
		{
			var delta = (t * t);
			return delta; 
		}, 

		easeInQuad: function(t)
		{
			return this.easeIn(t); 
		}, 

		easeInCubic: function(t)
		{
			var delta = (t * t * t); 
			return delta; 
		}, 

		easeInQuart: function(t)
		{
			var delta = (t * t * t * t);
			return delta; 
		}, 

		easeInCirc: function(t)
		{
			var delta = (1 - Math.sin(Math.acos(t))); 
			return delta; 
		}, 

		easeOut: function(t)
		{
			var delta = (t * (2 - t));
			return delta;
		}, 

		easeOutQuad: function(t)
		{
			return this.easeOut(t); 
		}, 

		easeOutCubic: function(t)
		{
			var delta = ((--t) * t * t + 1); 
			return delta; 
		}, 

		easeOutQuart: function(t)
		{
			var delta = (1 - (--t) * t * t * t); 
			return delta; 
		}, 

		linear: function(t)
		{
			var delta = t; 
			return delta; 
		}
	};
	
	/* this will add an animation to an element. 
	@param (object) paramsObj = the animation params 
	@return (object) the animation object */ 
	base.extend.addAnimation = function(paramsObj) 
	{ 
		return base.animations.add(paramsObj); 
	}; 
	
	/* this will stop all animations on an element. 
	@param (object) element = the element */
	base.extend.stopAnimations = function(element) 
	{ 
		base.animations.stop(element); 
	};
})();