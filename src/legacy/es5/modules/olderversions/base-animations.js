/* base framework module */ 
/* 
	javascript animation add and remove with full object 
	animation tracking 
*/ 
(function() 
{
	"use strict"; 
	
	/* this will add and remove animations */ 
	base.extend.animations = { 
		
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
				var animationObj = null, 
				self = this;  
				
				/* we want to setup the animation to remove itself when 
				finished */ 
				var removeAnimation = function(status) 
				{
					self.remove(animationObj); 
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
				animationObj = new animation(obj, removeAnimation); 
				this.objects.push(animationObj); 
				return animationObj;  
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
		animation 
		
		this will create an animation object that will 
		animate a target property on an element over a 
		duration. 
		
		@param (object) paramsObj = the animation params 
		@param [(function)] callBack = the function to call back 
		when the animation is done 
	*/ 
	var animation = function(paramsObj, callBack) 
	{ 
		/* this is the delay of the animation in milliseconds */ 
		this.delay = paramsObj.delay || 0; 
		this.delayTimer = null; 
		
		/* this is the animation duration in milliseconds */ 
		this.duration = paramsObj.duration || 0; 
		
		/* this will store the element and the element 
		property to animate */ 
		this.element = this.getElement(paramsObj.element); 
		this.targetProperty = paramsObj.property; 
		this.type = this.getType();  
		this.status = 'stopped';  
		this.ease = paramsObj.ease || 'linear'; 
		
		this.startTime = null; 
		
		/* this will be the call back function to return 
		when the animation is complete or errors */ 
		this.callBack = callBack; 
		
		/* this will setup the fps */ 
		this.fps = paramsObj.fps || 60;    
		
		/* this will setup the new animation object and start 
		the animation if all is correct or stop and return an 
		error */ 
		this.setup(paramsObj); 
	}; 
	
	animation.prototype = 
	{ 
		constructor: animation, 
		
		/* this will setup the animation to start */ 
		setup: function(paramsObj) 
		{ 
			if(typeof this.element === 'object' && this.targetProperty) 
			{ 
				if(this.type === 'css')
				{ 
					this.update = this.updateCss; 
				} 
				else 
				{ 
					this.update = this.updateAttr;
				}
				
				/* we want to start the animation by the animation 
				delay settings */ 
				var callBack = base.createCallBack(this, this.start, [paramsObj]); 
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
		
		/* this will start the animation by getting the start time 
		and starting the animation timer */ 
		start: function(paramsObj) 
		{ 
			/* we want to setup the start and end values of the 
			animation */ 
			this.combining = false; 
			var endValue = paramsObj.endValue;
			this.startValue = this.getStartValue(paramsObj.startValue, endValue); 
			
			this.value = this.getValue(endValue); 
			this.units = this.getUnits(endValue); 
			
			/* we want to check if we are increasing or 
			decreasing the target */  
			this.increasing = this.isIncreasing(endValue); 
			this.difference = (Math.abs(this.startValue - this.value)); 
			this.animationCallBack = this.animate.bind(this);
			
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
		
		getType: function() 
		{ 
			var element = this.element; 
			return (element.style && this.targetProperty in element.style)? 'css' : 'attr'; 
		}, 
		
		/* this will get the element that is being used. 
		@param (mixed) element = the element selector or object 
		@return (object) the element */ 
		getElement: function(element) 
		{ 
			return (typeof element === 'string')? document.querySelector(element) : element; 
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
		
		/* this will get start value of the property being animated. 
		@param (string) value = the value being modified 
		@return (string) the type of units */
		getStartValue: function(value, end) 
		{ 
			var start = 0;  
			if(typeof end !== 'undefined') 
			{  
				end = this.getString(end); 
				/* we want to check if we have a plus or minus equals to 
				show that we are using the current position as the start */ 
				var pattern = /(\+=|-=)/g, 
				matches = end.match(pattern); 
				if(matches) 
				{ 
					this.combining = true; 
				}  
			} 
			
			if(typeof value === 'undefined') 
			{ 
				/* we want to get the elements current target value 
				as the starting value but we need to get it by the 
				property type */ 
				if(this.type === 'css') 
				{ 
					start = this.getValue(base.css(this.element, this.targetProperty)); 
				} 
				else 
				{ 
					start = this.element[this.targetProperty]; 
				}
			}
			else 
			{ 
				start = this.getValue(value); 
			} 
			return start; 
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
				var cssPattern = /(?:(\w+\s*)\(.+\))/g;
				
				text.replace(cssPattern, function(a, b, c, d)
				{ 
					console.log(arguments)
				});
				var matches = text.match(cssPattern); 
				if(matches)
				{ 
					console.log(matches)
					var cssValue = 
					{ 
						method: matches[1], 
						params: []
					};
				}
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
			var endTotal = this.value; 
			var startValue = this.startValue;
			if(this.combining === true) 
			{ 
				endTotal = (this.getString(endValue).indexOf("-") === -1)? (startValue + this.value) : startValue - this.value; 
			}
			return (endTotal >= startValue)? true : false; 
		}, 
		
		/* this will get the delta to be used with the animation. 
		@return (number) the current delta */ 
		delta: function() 
		{ 
			var delta = 0, 
			t = this.progress; 
			
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
		}, 
		
		/* this will perform the animation on the element by 
		incrementally updating the element object property 
		by the timed progress. */ 
		animate: function() 
		{ 
			this.timePassed = new Date() - this.startTime; 
			var progress = this.timePassed / this.duration; 
			progress = this.progress = (progress > 1)? 1 : progress; 
			
			var delta = this.delta(); 
			
			/* this will get the next stop in our animation 
			that should be added to the target prop */ 
			var step = this.step(delta);  
			 
			/* we want to check to add or subtract the step 
			by the increase prop */ 
			var start = this.startValue;
			var totalValue = (this.increasing)? (start + step) : (start - step), 
			propValue = (totalValue) + this.units; 
			
			/* we want to check if we are animating a css prop or 
			a other property */ 
			this.update(propValue);
			
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
		
		step: function(delta)
		{ 
			var step; 
			
			var self = this;
			if(this.combining === true)
			{ 
				step = function(delta)
				{ 
					return (self.value * delta);
				}; 
			}
			else 
			{ 
				step = function(delta)
				{ 
					return (self.difference * delta);
				};
			}
			return (this.step = step).apply(this, base.listToArray(arguments)); 
		},  
		
		/* this should be overridden by the update 
		property type being animated. 
		@param (mixed) value */
		update: function(value)
		{ 
			
		}, 
		
		updateCss: function(value)
		{ 
			this.element.style[this.targetProperty] = value;
		}, 
		
		updateAttr: function(value)
		{ 
			this.element[this.targetProperty] = value;
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