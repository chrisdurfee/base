/* base framework module */
(function()
{
	"use strict"; 

	/*
		DataBinder

		this create a data bind module to add 
		two way data binding to base models. 
		
		@param [(string)] attr

	*/
	var DataBinder = function(attr) 
	{ 
		this.attr = attr || 'data-bind'; 
		/* this will create a new pub sub object 
		that will be used to propagate the changes */ 
		this.pubSub = new DataPubSub(); 
		this.idCount = 0; 
		this.setup(); 
	}; 

	DataBinder.prototype = 
	{ 
		constructor: DataBinder, 

		setup: function() 
		{ 
			this.setupEvents(); 
			
			/* this will add a callback to our pubsub object 
			to check what has been changed even if the model 
			is not added to the pub sub. this will allow our 
			models to publish changes without being added 
			and requiring them to be removed when deleted */ 
			this.pubSub.callBack = base.bind(this, this.messageChange);
		},

		/* this will add the data bind attr on an 

		element for a model property. 
		@param (object) element 
		@param (object) model 
		@param (string) prop
		@return (object) the instance of the data binder */
		bind: function(element, model, prop) 
		{ 
			/* this will add the data binding 
			attr to out element so it will subscribe to 
			the two model changes */ 
			var modelId = model.getModelId(), 
			attr = this.attr; 
			base.attr(element, attr, modelId + ':' + prop); 
			
			/* this will add a unique id to the element 
			so the model will know when the element has 
			been updated */ 
			var id = 'bs-db-' + this.idCount++; 
			base.attr(element, attr + '-id', id);
			
			/* this will setup the model to update 
			from the pubSub element changes */ 
			this.pubSub.on( id, function(evt, prop, value, committer) 
			{
				model.set(prop, value, committer);
			});

			/* we want to get the starting value of the 
			model and set it on our element */ 
			var value = model.get(prop); 
			if(typeof value !== 'undefined') 
			{ 
				this.set(element, value); 
			}
			return this; 
		}, 
		
		/* this will remove an element from the data binder
		@param (object) element
		@return (object) the instance of the data binder*/ 
		unbind: function(element) 
		{ 
			var bindId = base.data(element, this.attr + '-id'); 
			this.pubSub.remove(bindId); 
			return this;
		},  
		
		messageChange: function(message, prop, value, committer)
		{ 
			if(typeof message === 'string' && message.indexOf(':') > -1)
			{ 
				var parts = message.split(':'); 
				var modelId = parts[0]; 
				
				this.updateElements(modelId, prop, value, committer);
                
				/*
				var action = parts[1];
				switch(action)
				{ 
					case 'change': 
						this.updateElements(modelId, prop, value, committer);
						break; 
					case 'delete': 
						this.deleteElements(modelId, prop);
						break;
				}*/
			}  
			return this;
		},
		
		/* this will update all elements with the model id 
		attr. 
		@param (string) modelId
		@param (string) prop 
		@param (mixed) value 
		@param (object) committer */ 
		updateElements: function(modelId, prop, value, committer)
		{ 
			var elements = document.querySelectorAll("[" + this.attr + "='" + modelId + ':' + prop + "']");
			if(elements)
			{ 
				for(var i = 0, len = elements.length; i < len; i++ ) 
				{
					var element = elements[i]; 
					if(committer !== element) 
					{ 
						this.set(element, value);
					}
				}
			}
		}, 
		
		/* this will update all elements with the model id 
		attr. 
		@param (string) modelId
		@param (string) prop 
		@param (mixed) value 
		@param (object) committer */ 
		deleteElements: function(modelId, prop)
		{ 
			var elements = document.querySelectorAll("[" + this.attr + "='" + modelId + ':' + prop + "']");
			if(elements)
			{ 
				var builder = new base.htmlBuilder(); 
				for(var i = 0, len = elements.length; i < len; i++ ) 
				{
					builder.removeElement(elements[i]); 
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
						value = value == 0? false : true; 
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
		
		/* this will publish a change to the data binder. 
		@param (string) message e.g id:change 
		@param (string) attrName = the model prop name 
		@param (mixed) the prop value 
		@param (object) the object committing the change */ 
		publish: function(message, attrName, value, committer)
		{ 
			this.pubSub.publish(message, attrName, value, committer);
			return this;
		}, 
		
		onChange: function(message, callBack)
		{ 
			this.pubSub.on(message, callBack); 
			return this; 
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
						var parts = value.split(":");
						if(parts.length)
						{ 
							return { 
								id: parts[0], 
								value: parts[1], 
								bindId: base.data(element, dataAttr + '-id')
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
						var value = self.get(target); 
						/* this will publish to the ui and to the
						model that subscribes to the element */ 
						pubSub.publish(settings.bindId, prop, value, target);
						pubSub.publish(settings.id + ':change', prop, value, target);
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
			var callBacks = this.callBacks; 
			if(callBacks[msg])
			{ 
				delete callBacks[msg]; 
			}
		},

		callBack: null, 

		publish: function(msg) 
		{ 
			var i, length, 
			list = this.callBacks[msg] || false; 
			if(list !== false)
			{ 
				length = list.length;
				for (i = 0; i < length; i++ ) 
				{
					list[i].apply(this, arguments);
				}
			} 
			
			if(typeof this.callBack === 'function')
			{ 
				/* this will setujp the params array by pushing 
				the publish args to the params array */ 
				var params = []; 
				length = arguments.length;
				for(i = 0; i < length; i++) 
				{ 
					params[i] = arguments[i]; 
				}
				this.callBack.apply(null, params); 
			}
		}
	};
	
	base.extend.DataPubSub = DataPubSub; 
	base.extend.DataBinder = new DataBinder(); 
})();