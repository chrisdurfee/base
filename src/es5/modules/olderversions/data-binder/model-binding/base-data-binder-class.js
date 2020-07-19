/* base framework module */
(function()
{
	"use strict"; 

	/*
		DataBinder

		this create a data bind module to add 
		two way data binding to base models. 
		
		no initialize but removeal needed 
		jsfiddle https://jsfiddle.net/kz383fq8/164/

	*/
	var DataBinder = function(attr) 
	{ 
		this.attr = attr || 'data-bind'; 
		/* this will create a new pub sub object 
		that will be used to propagate the changes */ 
		this.pubSub = new DataPubSub(); 
	}; 

	DataBinder.prototype = 
	{ 
		constructor: DataBinder, 

		setup: function() 
		{ 
			this.setupEvents(); 
			this.pubSub.callBack = base.bind(this, this.messageChange);
		},

		/* this will setup the binder events that will 
		use the pub sub object to modify the bound elements */ 
		bind: function(model) 
		{ 
			var modelId = model.getModelId(), 
			message = modelId + ":change";  

			/* we need to setup the pub sub on call back 
			to modify our elements with the new data value */ 
			var self = this; 
			this.pubSub.on( message, function(evt, prop, value, committer) 
			{
				self.updateElements(modelId, prop, value, committer);
			}); 
		}, 
		
		/* this will setup the binder events that will 
		use the pub sub object to modify the bound elements */ 
		unbind: function(model) 
		{ 
			var id = model.getModelId(), 
			message = id + ":change";  

			this.pubSub.remove(message);  
		}, 
		
		messageChange: function(message, prop, value, committer)
		{ 
			var parts = message.split(':'); 
			var modelId = parts[0]; 
			
			this.updateElements(modelId, prop, value, committer); 
		},
		
		/* this will update all elements with the model id 
		attr. 
		@param (string) modelId
		@param (string) prop 
		@param (mixed) value 
		@param (object) committer */ 
		updateElements: function(modelId, prop, value, committer)
		{ 
			var elements = document.querySelectorAll("[" + this.attr + "='" + modelId + '.' + prop + "']");
			if(elements)
			{ 
				for(var i = 0, len = elements.length; i < len; i++ ) 
				{
					var element = elements[i]; 
					if(committer !== element); 
					{ 
						this.set(element, value);
					}
				}
			}
		}, 

		/* this will set a value on an elememnt. 
		@param (object) element 
		@param (mixed) value */ 
		set: function(element, value) 
		{ 
			if(element && typeof element === 'object') 
			{ 
				var tagName = element.tagName.toLowerCase();
				if (tagName === "input" || tagName === "textarea" || tagName === "select" ) 
				{
					var type = element.type; 
					if(type && (type === 'checkbox' || type === 'radio')) 
					{ 
						element.checked = value; 
					}
					else 
					{ 
						element.value = value;
					}
				} 
				else 
				{
					element.textContent = value;
				}
			} 
		}, 

		/* this will get a value on an elememnt. 
		@param (object) element 
		@param (mixed) value 
		@return (mixed) the element value */ 
		get: function(element) 
		{ 
			var value = ''; 
			if(element && typeof element === 'object') 
			{ 
				var tagName = element.tagName.toLowerCase();
				if (tagName === "input" || tagName === "textarea" || tagName === "select" ) 
				{
					var type = element.type; 
					if(type && (type === 'checkbox' || type === 'radio')) 
					{ 
						value = element.checked; 
					}
					else 
					{ 
						value = element.value;
					}
				} 
				else 
				{
					value = element.textContent;
				}
			} 
			return value;
		}, 
		
		/* this will add the data bind attr on an 
		element for a model property. 
		@param (object) element 
		@param (object) model 
		@param (string) prop */
		bindElement: function(element, model, prop) 
		{ 
			/* this will add the data binding 
			attr to out element so it will subscribe to 
			the two model changes */ 
			var modelId = model.getModelId(); 
			base.attr(element, this.attr, modelId + '.' + prop); 

			/* we want to get the staring value of the 
			model and set it on our element */ 
			var value = model.get(prop); 
			if(typeof value !== 'undefined') 
			{ 
				this.set(element, value); 
			}
		}, 
		
		/* this will publish a change to the data binder. 
		@param (string) modleId 
		@param (string) attrName = the model prop name 
		@param (mixed) the prop value 
		@param (object) the object committing the change */ 
		publish: function(modelId, attrName, value, committer)
		{ 
			var message = modelId + ':change'; 
			this.pubSub.publish(message, attrName, value, committer); 
		}, 
		
		onChange: function(modelId, callBack)
		{ 
			var message = modelId + ':change';
			this.pubSub.on(message, callBack); 
		}, 

		/* this will setup the on change handler and 
		add the events. this needs to be setup before adding 
		the events. */ 
		changeHandler: null, 
		setupEvents: function() 
		{ 
			var dataAttr = this.attr; 
			var isDataBound = function(element) 
			{ 
				if(element)
				{ 
					var value = base.data(element, dataAttr); 
					if(value)
					{ 
						var parts = value.split(".");
						if(parts.length)
						{ 
							return { 
								id: parts[0], 
								value: parts[1]
							};
						}
					}
				}
				return false; 
			}; 

			/* this will create a closure scope to the object 
			by using a local call back function. */ 
			var self = this, pubSub = this.pubSub; 
			this.changeHandler = function(evt) 
			{
				if(evt.type === 'keyup')
				{ 
					var blockedKeys = [
						17, //ctrl 
						9, //tab 
						16, //shift
						18, //alt 
						20, //caps lock 
						37, //arrows 
						38, 
						39, 
						40 
					];
					/* this will check to block ctrl, shift or alt + 
					buttons */ 
					if(evt.ctrlKey !== false || evt.shiftKey !== false || evt.altKey !== false || base.inArray(blockedKeys, evt.keyCode) !== -1)
					{ 
						return true; 
					}
				} 
				
				var target = evt.target || evt.srcElement; 
				var settings = isDataBound(target); 
				if(settings)
				{ 
					var prop = settings.value;
					if(prop && prop !== "") 
					{
						pubSub.publish(settings.id + ':change', prop, self.get(target), target);
					}
				}
				evt.stopPropagation();
			}; 

			this.addEvents();  
		}, 

		/* this will add the binder events */ 
		addEvents: function() 
		{ 
			base.on(["change", "keyup"], document, this.changeHandler, false); 
		}, 

		/* this will remove the binder events */
		removeEvents: function() 
		{ 
			base.off(["change", "keyup"], document, this.changeHandler, false);
		}
	};  

	/* 
		DataPubSub 
		
		this will create a pub sub object 
		to allow messages to be subscribed to and 
		publish changes that will be pushed to the 
		subscribers. 
	*/ 
	var DataPubSub = function()
	{ 
		this.callBacks = {}; 
	}; 

	DataPubSub.prototype =
	{ 
		constructor: DataPubSub, 

		/* this will get the subscriber array for the 
		message or create a new subscriber array if none 
		is setup already. 
		@param (string) msg 
		@return (array) subscriber array */ 
		get: function(msg) 
		{ 
			var callBacks = this.callBacks;
			return (callBacks[msg] = callBacks[msg] || []);
		}, 

		reset: function() 
		{ 
			this.callBacks = []; 
		}, 

		on: function(msg, callBack) 
		{ 
			var list = this.get(msg);
			list.push(callBack);
		}, 
		
		off: function(msg, callBack) 
		{ 
			var list = this.get(msg);
			var index = base.inArray(list, callBack); 
			if(index > -1)
			{ 
				list.splice(index, 1); 
			}
		}, 
		
		remove: function(msg) 
		{ 
			var list = this.get(msg);
			var index = base.inArray(this.callBacks, list); 
			if(index > -1)
			{ 
				list.splice(this.callBacks, 1); 
			}
		},
		
		callBack: null, 

		publish: function(msg) 
		{ 
			var list = this.get(msg); 
			for ( var i = 0, len = list.length; i < len; i++ ) 
			{
				list[i].apply(this, arguments);
			}
			
			if(typeof this.callBack === 'function')
			{ 
				var params = [msg]; 
				for(var i = 0, length = arguments.length; i < length; i++) 
				{ 
					params[i] = arguments[i]; 
				}
				this.callBack.apply(null, params); 
			}
		}
	};
	
	base.extend.DataPubSub = DataPubSub; 

	var dataBinder = base.extend.DataBinder = new DataBinder(); 
	dataBinder.setup();
})();