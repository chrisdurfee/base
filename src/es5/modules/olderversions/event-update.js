/* base framework module */
(function(global)
{
	"use strict"; 
	
	var DataTracker = base.DataTracker; 
	
	/* this will register the event system to the 
	data tracker to remove events that have been 
	added in layouts. */ 
	DataTracker.addType('events', function(data)
	{
		base.events.removeEvent(data);
	});
	
	base.extend.events = 
	{ 
		getEvents: function(obj)
		{
			if(!obj || typeof obj !== 'object')
			{
				return false; 
			}
			return DataTracker.get(obj, 'events'); 
		}, 
		
		/* this will  create an object to use through the event 
		tracker. 
		@param string event = the name of the event to listen 
		@param object obj = obj to add the listener 
		@param function fn = function to perform on event 
		@param bool capture = event capture
		@param bool swapped = tells if the even return was 
		swapped with a standardized function. 
		@param function originalFn = the original function  
		return function was swapped.  
		*/ 
		createEventObj: function(event, obj, fn, capture, swapped, originalFn) 
		{ 
			/* we want to check if the swapped param was set */ 
			swapped = (swapped === true); 

			return { 
				event: event, 
				obj: obj, 
				fn: fn, 
				capture: capture, 
				swapped: swapped, 
				originalFn: originalFn 
			}; 
		}, 

		/* this will setup the add function to cache the 
		proper function so we only check one time. 
		@return (function) the function */ 
		_add: function() 
		{ 
			/* create a local function to perform the check 
			once then override the function */ 
			var addEvent;  
			if(typeof global.addEventListener === 'function') 
			{ 
				// modern browsers
				addEvent = function(obj, event, fn, capture) 
				{ 
					obj.addEventListener(event, fn, capture);
				}; 
			} 
			else if(typeof document.attachEvent === 'function') 
			{ 
				// old ie 
				addEvent = function(obj, event, fn, capture) 
				{ 
					obj.attachEvent("on" + event, fn);
				}; 
			} 
			else 
			{ 
				addEvent = function(obj, event, fn, capture) 
				{ 
					obj["on" + event] = fn;
				}; 
			} 

			/* this will override method with cached method 
			and we need to return and call with object */ 
			return base.overrideMethod(this, '_add', addEvent, arguments);
		}, 

		/* this will and an event listener and add 
		to the event tracker. 
		@param string event = the name of the event to listen 
		@param object obj = obj to add the listener 
		@param function fn = function to perform on event 
		@param bool capture = event capture
		@param bool swapped = tells if the even return was 
		swapped with a standardized function. 
		@param function originalFn = the original function */ 
		add: function(event, obj, fn, capture, swapped, data) 
		{ 
			if(!obj || typeof obj !== 'object') 
			{ 
				return this; 
			}
				  
			capture = (typeof capture !== 'undefined')? capture : false; 

			/* we want to create an event object and add it the 
			the active events to track */ 
			var data = this.createEventObj(event, obj, fn, capture, swapped, data);  
			DataTracker.add(obj, 'events', data); 

			this._add(obj, event, fn, capture); 

			return this; 
		}, 

		/* this remove the event and remove from the tracker. 
		@param string event = the name of the event to listen 
		@param object obj = obj to add the listener 
		@param function fn = function to perform on event 
		@param bool capture = event capture */ 
		remove: function(event, obj, fn, capture) 
		{ 
			capture = (typeof capture !== 'undefined')? capture : false; 

			/* we want to select the event from the active events array */ 
			var result = this.getEvent(event, obj, fn, capture); 
			if(result === false) 
			{ 
				return this; 
			}
				 
			if(typeof result === 'object') 
			{ 
				/* we want to use the remove event method and just 
				pass the listener object */ 
				this.removeEvent(result);  
			} 
			return this; 
		}, 

		/* this will setup the remove function to cache the 
		proper function so we only check one time. 
		@return (function) the function */ 
		_remove: function() 
		{ 
			/* create a local function to perform the check 
			once then override the function */ 
			var removeEvent;  
			if(typeof global.removeEventListener === 'function') 
			{ 
				// modern browsers
				removeEvent = function(obj, event, fn, capture) 
				{ 
					obj.removeEventListener(event, fn, capture);
				};
			} 
			else if(typeof document.detachEvent === 'function') 
			{ 
				// old ie 
				removeEvent = function(obj, event, fn, capture) 
				{ 
					obj.detachEvent("on" + event, fn);
				};
			} 
			else 
			{ 
				removeEvent = function(obj, event, fn, capture) 
				{ 
					obj["on" + event] = null; 
				};
			} 

			/* this will override method with cached method 
			and we need to return and call with object */ 
			return base.overrideMethod(this, '_remove', removeEvent, arguments);
		},

		/* this will remove an event object and the listener 
		from the active events array.   
		@param (object) listener = the listener object from 
		the active events array */ 
		removeEvent: function(listener) 
		{ 
			if(typeof listener === 'object') 
			{ 
				this._remove(listener.obj, listener.event, listener.fn, listener.capture); 
			} 
			return this;  
		}, 

		/* this will search for an return an active event or return 
		false if nothing found. 
		@param string event = the name of the event to listen 
		@param object obj = obj to add the listener 
		@param function fn = function to perform on event 
		@param bool capture = event capture
		@return (mixed) the event object or false if not found */ 
		getEvent: function(event, obj, fn, capture) 
		{ 
			if(typeof eventObj !== 'object') 
			{ 
				return false; 
			}
			
			var events = this.getEvents(obj); 
			if(!events || events.length < 1)
			{
				return false; 
			}
				
			var eventObj = this.createEventObj(event, obj, fn, capture); 
			/* if the search returns anything but false we 
			found our active event */ 
			return this.searchEvents(eventObj, events);  
		}, 

		/* this will search for an return an active event or return 
		false if nothing found. 
		@param object eventObj = the listener object to search */
		searchEvents: function(eventObj, events) 
		{ 
			var swappable = this.isSwappedEventType(eventObj.event); 
			for(var i = 0, maxLength = events.length; i < maxLength; i++) 
			{ 
				var listener = events[i]; 
				if(listener.event !== eventObj.event || listener.obj !== eventObj.obj)
				{
					continue; 
				}
				
				if(listener.fn === eventObj.fn || (swappable === true && listener.originalFn === eventObj.fn))
				{
					return listener; 
				}
			} 

			return false; 
		}, 	

		/* this will remove all events added to an element through 
		the base framework.  

		@param (object) obj = the element object */
		removeEvents: function(obj) 
		{ 
			if(!obj || typeof obj !== 'object') 
			{ 
				return this; 
			}
				 
			DataTracker.remove(obj, 'events'); 
			
			return this; 
		}, 

		swappedEvents: [  
			'DOMMouseScroll', 
			'wheel', 
			'mousewheel', 
			'mousemove', 
			'popstate' 
		], 

		addSwappedType: function(type)
		{
			this.swappedEvents.push(type); 
		}, 

		/* this will check if an event type could be swapped. 
		@param string event = the type of event
		 */ 
		isSwappedEventType: function(event) 
		{ 
			/* we want to check if the event type is in the 
			swapped event array */ 
			var index = base.inArray(this.swappedEvents, event); 
			return (index > -1);  
		}
	}; 
	
	base.augment(
	{
		/* this will add an event listener. 
		@param string event = the name of the event to listen 
		@param object obj = obj to add the listener 
		@param function fn = function to perform on event 
		@param bool capture = event capture
		@return (object) a reference to the base object */
		addListener: function(event, obj, fn, capture) 
		{  
			/* we want to add this to the active events */ 
			this.events.add(event, obj, fn, capture);  
			
			return this; 
		}, 
		
		/* this will add an event listener. 
		@param mixed event = the name of the event to listen 
		@param object obj = obj to add the listener 
		@param function fn = function to perform on event 
		@param bool capture = event capture
		@return (object) a reference to the base object */
		on: function(event, obj, fn, capture) 
		{  
			var events = this.events;
			if(this.isArray(event)) 
			{ 
				for(var i = 0, length = event.length; i < length; i++) 
				{ 
					var evt = event[i]; 
					events.add(evt, obj, fn, capture);
				} 
			} 
			else 
			{ 
				events.add(event, obj, fn, capture); 
			}			
			return this; 
		}, 
		
		/* this will remove an event listener. 
		@param mixed event = the name of the event to listen 
		@param object obj = obj to remove the listener 
		@param function fn = function to perform on event 
		@param bool capture = event capture
		@return (object) a reference to the base object */
		off: function(event, obj, fn, capture) 
		{  
			var events = this.events;
			if(this.isArray(event)) 
			{ 
				for(var i = 0, length = event.length; i < length; i++) 
				{ 
					var evt = event[i]; 
					events.remove(evt, obj, fn, capture);
				} 
			} 
			else 
			{ 
				events.remove(event, obj, fn, capture); 
			}			
			return this; 
		},
		
		/* this will remove an event listener. 
		@param string event = the name of the event to listen 
		@param object obj = obj to add the listener 
		@param function fn = function to perform on event 
		@param bool capture = event capture
		@return (object) a reference to the base object */
		removeListener: function(event, obj, fn, capture) 
		{ 
			/* we want to remove this from the active events */ 
			this.events.remove(event, obj, fn, capture);  
			
			return this; 
		}, 
		
		_createEvent: function() 
		{ 
			/* create a local function to perform the check 
			once then override the function */ 
			var createEvent;  
			if('CustomEvent' in window) 
			{ 
				createEvent = function(obj, event, eventType, settings, params) 
				{ 
					var e;
					if(eventType === 'HTMLEvents') 
					{ 
						e = new Event(event); 
					} 
					else if(eventType === 'MouseEvents') 
					{ 
						e = new MouseEvent(event, settings); 
					} 
					else 
					{ 
						e = new CustomEvent(event, params);
					}
					return e; 
				};
			} 
			else if('createEventObject' in document)
			{ 
				createEvent = function(obj, event, eventType, settings, params) 
				{ 
					var e = document.createEventObject(); 
					e.eventType = event;
					return e; 
				};
			} 
			else
			{ 
				createEvent = function(obj, event, eventType, settings, params) 
				{ 
					var e = document.createEvent(eventType); 
					if (eventType === 'HTMLEvents')
					{
						obj.initEvent(event, settings.bubbles, settings.cancelable);
					}
					else if(eventType === 'MouseEvents')
					{ 
						e.initMouseEvent(
							event, 
							settings.canBubble,
							settings.cancelable,
							settings.view,
							settings.detail,
							settings.screenX,
							settings.screenY,
							settings.clientX,
							settings.clientY,
							settings.ctrlKey,
							settings.altKey,
							settings.shiftKey,
							settings.metaKey,
							settings.button,
							settings.relatedTarget
						);
					}
					else if(eventType === 'CustomEvent')
					{ 
						e.initCustomEvent(event, settings.bubbles, settings.cancelable, params);
					}
					return e; 
				};
			}

			/* this will override method with cached method 
			and we need to return and call with object */ 
			return this.overrideMethod(this, '_createEvent', createEvent, arguments);
		},
		
		/* this will create an event object that can be used 
		to dispatch events. this supports html mouse and cu-
		stom events. 
		@param (string) event = the name of the event 
		@param (object) obj = obj to trigger the listener 
		@param (object) options = event settings options
		@param [(object)] params = custom event params object
		@return (object | false) the event or false */ 
		createEvent: function(event, obj, options, params) 
		{ 
			if(!obj || typeof obj !== 'object')
			{ 
				return false;  
			} 
			
			var settings = {
				pointerX: 0,
				pointerY: 0,
				button: 0,
				view: window,
				detail: 1, 
				screenX: 0, 
				screenY: 0, 
				clientX: 0, 
				clientY: 0, 
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				metaKey: false,
				bubbles: true,
				cancelable: true, 
				relatedTarget: null
			}; 

			if(options && typeof options === 'object')
			{ 
				settings = base.extendObject(settings, options); 
			}

			var eventType = this._getEventType(event); 
			return this._createEvent(obj, event, eventType, settings, params);
		}, 
		
		_getEventType: function(event)
		{
			var eventTypes = {
				'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
				'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
			}; 

			var eventType = 'CustomEvent'; 
			for(var prop in eventTypes)
			{ 
				if(eventTypes.hasOwnProperty(prop))
				{ 
					var value = eventTypes[prop]; 
					if(event.match(value))
					{ 
						eventType = prop; 
						break; 
					}
				}
			}
			return eventType; 
		}, 
		 
		_trigger: function() 
		{ 
			/* create a local function to perform the check 
			once then override the function */ 
			var trigger;  
			if('createEvent' in document) 
			{ 
				trigger = function(obj, event) 
				{ 
					obj.dispatchEvent(event);
				};
			} 
			else 
			{ 
				// old ie 
				trigger = function(obj, event) 
				{ 
					var type = event.type; 
					obj.fireEvent('on' + type, event);
				};
			} 

			/* this will override method with cached method 
			and we need to return and call with object */ 
			return this.overrideMethod(this, '_trigger', trigger, arguments);
		},
		
		/* this will trigger an event. 
		@param (mixed) event = the name of the event or event object 
		@param object obj = obj to trigger the listener 
		@param object params = event params object 
		@return (object) a reference to the base object */
		trigger: function(event, obj, params) 
		{ 
			if(!obj || typeof obj !== 'object') 
			{ 
				return this; 
			}
				 
			var e = (typeof event === 'string')? this.createEvent(event, obj, null, params) : event;  
			this._trigger(obj, e); 
			return this; 
		}, 
		
		/* this will store the mouse wheel event name */ 
		mouseWheelEventType: null, 
		
		/* this will get theclientmouse wheel event name. 
		@return (string) */ 
		getMouseWheelEventType: function()
		{ 
			/* this will check what mouse wheel type 
			the client supports
			@return (string) the event name */ 
			var getMouseWheelType = function()
			{ 
				var type = 'wheel'; 
				if('onmousewheel' in global)
				{ 
					type = 'mousewheel'; 
				} 
				else if('DOMMouseScroll' in global)
				{ 
					type = 'DOMMouseScroll'; 
				}
				return type; 
			};
			
			/* this will get the event type or 
			one time set the type and return the type */ 
			return this.mouseWheelEventType || (
				this.mouseWheelEventType = getMouseWheelType()
			);
		}, 
		
		onMouseWheel: function(callBackFn, obj, cancelDefault, capture) 
		{ 
			if(typeof obj === "undefined") 
			{ 
				 obj = window; 
			} 
			
			var self = this;  
			
			/* we want to return the mousewheel data 
			to this private callback function before 
			returning to the call back function*/ 
			var mouseWeelResults = function(e) 
			{
				e = e || window.event; 
				var delta = Math.max(-1, Math.min(1, (-e.deltaY || e.wheelDelta || -e.detail))); 
				
				/* we can now send the mouse wheel results to 
				the call back function */ 
				if(typeof callBackFn === 'function') 
				{ 
					callBackFn(delta, e); 
				} 
				
				/* we want to check to cancel default */ 
				if(typeof cancelDefault !== 'undefined' && cancelDefault === true) 
				{ 
					self.preventDefault(e); 
				} 
			};  
			
			var event = this.getMouseWheelEventType(); 
			this.events.add(event, obj, mouseWeelResults, capture, true, callBackFn); 
			
			return this; 
		}, 
		
		offMouseWheel: function(callBackFn, obj, capture)
		{ 
			if(typeof obj === "undefined")
			{ 
				obj = window; 
			}
			
			var event = this.getMouseWheelEventType(); 
			this.off(event, obj, callBackFn, capture); 
		}, 
		
		/* this will prevent the default action 
		of an event 
		@param (object) e = the event object 
		@return (object) a reference to the base object */ 
		preventDefault: function(e) 
		{ 
			e = e || window.event; 
			
			if(typeof e.preventDefault === 'function') 
			{ 
				e.preventDefault(); 
			} 
			else 
			{ 
				e.returnValue = false; 
			} 
			
			return this; 
		}, 
		
		/* this will cancel the propagation of an event.
		@param (object) e = the event object 
		@return (object) a reference to the base object */
		stopPropagation: function(e) 
		{ 
			e = e || window.event; 
		
			if(typeof e.stopPropagation === 'function') 
			{ 
				e.stopPropagation();
			}
			else 
			{
				e.cancelBubble = true;
			} 
			
			return this; 
		}
	}); 
	
})(this);