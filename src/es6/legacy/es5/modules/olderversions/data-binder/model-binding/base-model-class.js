/* base framework module */
(function()
{
	"use strict"; 

	/*
		Model

		this create a model module that can bind 
		the data using the dase data binder. 
		
		@param (object) settings = the new model properties 
		and methods 
	*/
	var Model = function(settings)
	{  
		this._init();
		
		/* this will setup the attributes object and the 
		attribute stage object */ 
		this.attributes = {};
		this.stage = {};
		
		/* this will setup the event sub for 
		one way binding */ 
		this.eventSub = new base.DataPubSub();

		/* this will set the construct attributes */ 
		var attributes = setupAttrSettings(settings); 
		this.set(attributes); 
		
		/* this will setup the data binding for two
		way binding */ 
		this.bind = true; 
		this._setupDataBinder(); 

		this.initialize(); 

		this.xhr = null;  
	}; 

	Model.prototype = 
	{ 
		constructor: Model, 

		/* this will setup the model number and unique 
		instance id */ 
		_init: function()
		{
			var constructor = this.constructor; 
			this._modelNumber = (typeof constructor._modelNumber === 'undefined')? constructor._modelNumber = 0 : (++constructor._modelNumber);

			var modelId = this.modelTypeId + '-'; 
			this._id = modelId + this._modelNumber; 
		}, 
		
		/* this will get the unique model id 
		@return (string) the id */ 
		getModelId: function() 
		{ 
			return this._id; 
		},
		
		/* this will setup the model to the databinder */ 
		_setupDataBinder: function()
		{ 
			var self = this; 
			if(this.bind)
			{ 
				var dataBinder = base.DataBinder; 
				dataBinder.onChange(this._id, function(evt, attrName, val, committer) 
				{
					if(committer !== self)
					{ 
						self.set(attrName, val, committer);
					}
				});
			}
		}, 
		
		remove: function()
		{ 
			base.DataBinder.unbind(this); 
		}, 

		initialize: function() 
		{ 

		}, 
		
		on: function(attrName, callBack)
		{ 
			var message = attrName + ':change'; 
			this.eventSub.on(message, callBack); 
		}, 
		
		off: function(attrName, callBack)
		{ 
			var message = attrName + ':change'; 
			this.eventSub.off(message, callBack); 
		},

		set: function() 
		{
			var self = this; 
			var set = function(attr, val, committer)
			{ 
				if(self.bind === true)
				{ 
					/* this will block the data binder if we have 
					been updated from outside of the model and not 
					the model updated directly */ 
					if(!committer)
					{ 
						/* this will publish to the data binder but tell it 
						to cancel calls from this commiter the set to stop 
						this settings twice */
						base.DataBinder.publish(self._id, attr, val, self);
						self.attributes[attr] = val;
						self.stage[attr] = val;
					}
					else 
					{ 
						self.stage[attr] = val;
					}
				}
				else
				{ 
					self.attributes[attr] = val;
					self.stage[attr] = val;
				}
				
				/* this will check to update any local events 
				on the model */ 
				var message = attr + ':change'; 
				self.eventSub.publish(message, attr, val); 
			}; 

			var setupObject = function(object, committer) 
			{ 
				var items = object; 
				for(var attr in items) 
				{ 
					if(items.hasOwnProperty(attr)) 
					{ 
						var item = items[attr]; 
						if(typeof item === 'function')
						{ 
							continue; 
						} 
						set(attr, item, committer);
					}
				}
			}; 

			var args = arguments; 
			if(typeof args[0] === 'object') 
			{ 
				setupObject(args[0], args[1]); 
			}
			else 
			{ 
				set(args[0], args[1], args[2]); 
			}
		}, 
		
		mergeStage: function()
		{ 
			/* this will clone the stage object to the 
			attribute object */ 
			this.attributes = JSON.parse(JSON.stringify(this.stage)); 
		}, 
		
		getModelData: function()
		{ 
			this.mergeStage(); 
			return this.attributes; 
		}, 
		
		revert: function() 
		{ 
			/* this will reset the stage to the previous 
			attributes */ 
			this.set(this.attributes); 
		}, 

		get: function( attrName ) 
		{
			if(typeof attrName !== 'undefined')
			{ 
				return this.stage[attrName];
			}
            else 
            { 
            	return this.getModelData();
            }
		}
	}; 

	/* this will get the model attributes. 
	@param (object) settings = the model settings 
	@return (object) the attributes */ 
	var setupAttrSettings = function(settings)
	{ 
		var attributes = {};
		if(settings && typeof settings === 'object')
		{ 
			for(var prop in settings) 
			{ 
				if(settings.hasOwnProperty(prop)) 
				{ 
					var setting = settings[prop]; 
					if(typeof setting !== 'function')
					{ 
						attributes[prop] = setting;
						delete settings[prop]; 
					}
				}
			}
		}
		return attributes; 
	}; 
	
	/* this will get the model attributes. 
	@param (object) settings = the model settings 
	@return (object) the attributes */ 
	var setupDefaultAttr = function(settings)
	{ 
		var attributes = {};
		if(settings && typeof settings === 'object')
		{ 
			var defaults = settings.defaults;
			if(defaults)
			{ 
				for(var prop in defaults) 
				{ 
					if(defaults.hasOwnProperty(prop)) 
					{ 
						var attr = defaults[prop]; 
						if(typeof attr !== 'function')
						{ 
							attributes[prop] = attr;
						}
					}
				}
				delete settings.defaults;
			}
		}
		return attributes; 
	}; 
	
	/* this will get the model attributes. 
	@param (object) settings = the model settings 
	@return (object) the attributes */ 
	var getXhr = function(settings)
	{ 
		if(settings && typeof settings === 'object')
		{ 
			if(settings.xhr)
			{ 
				var xhr = base.createObject(settings.xhr);
				delete settings.xhr; 
				return xhr; 
			}
		}
		return {}; 
	};

	/* this will track the number of model types */ 
	var modelTypeNumber = 0; 

	/* this will extend the model. 
	@param (object) settings = the new model properties 
	and methods 
	@param (object) the new model */ 
	Model.extend = function(settings)
	{   
		var parent = this; 
		
		var xhr = getXhr(settings); 
		var modelService = this.prototype.xhr.extend(xhr);

		/* this will setup the default attribute settings for 
		the model */ 
		settings = settings || {}; 
		var defaultAttributes = setupDefaultAttr(settings); 
		var model = function(instanceSettings)
		{ 
			 /* this will get the instance attributes that 
			the model will set as attribute data */ 
			var instanceAttr = setupAttrSettings(instanceSettings);

			/* we want to extend the default attr with the 
			instance attr before we set the data and call 
			the parent constructor */ 
			instanceAttr = base.extendObject(defaultAttributes, instanceAttr); 
			parent.call(this, instanceAttr); 
			
			this.xhr = new modelService(this);
		};  

		/* this will extend the model and add the static 
		methods to the new object */ 
		model.prototype = base.extendClass(this.prototype, settings); 
		model.prototype.constructor = model;  
		model.prototype.xhr = modelService; 

		/* this will assign a unique id to the model type */ 
		model.prototype.modelTypeId = 'bm' + (modelTypeNumber++); 

		/* this will extend the static methods */ 
		base.extendObject(parent, model); 
		return model;  
	};

	base.extend.Model = Model; 
	
	/* 
		ModelService 
		
		this is a service that can connect a model to 
		a web service api. 
		
		@param (object) model 
	*/ 
	var ModelService = function(model)
	{ 
		this.model = model; 
		this.url = ''; 
		
		this.init(); 
	}; 
	
	ModelService.prototype = 
	{ 
		constrcutor: ModelService, 
		
		init: function() 
		{ 
			var model = this.model; 
			if(model && model.url)
			{ 
				this.url = model.url; 
			}
		}, 
		
		validateCallBack: null, 
		
		isValid: function()
		{ 
			var result = this.validate(); 
			if(result === false)
			{ 
				var callBack = this.validateCallBack; 
				if(typeof callBack === 'function')
				{ 
					callBack(result); 
				}
			}
			return result; 
		},
		
		/* this is a method to use to override to set 
		a default validate methode to check the model 
		before sending data. 
		@return (bool) true or false to submit */
		validate: function()
		{ 
			return true;  
		},
		
		/* this is a method to use to override to set 
		a default param string to be appended to each 
		xhr request
		@return (string) params */ 
		getDefaultParams: function() 
		{ 
			return ''; 
		}, 
		
		/* this will add the individual params with the default 
		params. 
		@param (string) params 
		@return (string) the appended params */ 
		setupParams: function(params)
		{ 
			var defaults = this.getDefaultParams();
			params += (defaults[0] !== '&')? '&' + defaults : defaults;
			return params; 
		},
		
		/* this is a property to override the return type 
		used in the the request and response xhr calls. this 
		will define what the web service defines as the object type. */ 
		objectType: 'item', 
		
		xhr: null, 
		
		/* this will clear the previous xhr is still set. */ 
		clearXhr: function() 
		{ 
			var xhr = this.xhr; 
			if(this.xhr !== null)
			{ 
				this.xhr.abort(); 
				this.xhr = null; 
			}
		}, 
		
		/* this will get a model object from the  service. 
		@param (function) callBack = the callBack to handle 
		the service xhr response */ 
		get: function(callBack)
		{ 
			this.clearXhr();
			
			var id = this.model.get('id'); 
			var params = 'op=get' + 
						 '&id=' + id; 
			
			var model = this.model, 
			self = this; 
			this.request(params, callBack, function(response)
			{ 
				if(response) 
				{ 
					/* this will update the model with the get request 
					response */ 
					var object = self.getObject(response); 
					if(object)
					{ 
						model.set(object);
					}
				}
			}); 
		}, 
		
		getObject: function(response)
		{ 
			/* this will update the model with the get request 
			response */ 
			var object = response[this.objectType] || response; 
			return (object)? object : false; 
		},
		
		/* this will add or update a model object to the service. 
		@param (function) callBack = the callBack to handle 
		the service xhr response */
		setup: function(callBack)
		{ 
			this.clearXhr(); 
			
			if(this.isValid())
			{ 
				var item = this.model.get(); 
				var params = 'op=setup' + 
							 '&' + this.objectType + '=' + base.prepareJsonUrl(item);  

				this.request(params, callBack);
			}
		}, 
		
		/* this will add a model object from the service. 
		@param (function) callBack = the callBack to handle 
		the service xhr response */
		add: function(callBack)
		{ 
			this.clearXhr(); 
			
			if(this.isValid())
			{
				var item = this.model.get(); 
				var params = 'op=add' + 
							 '&' + this.objectType + '=' + base.prepareJsonUrl(item); 

				this.request(params, callBack);
			}
		}, 
		
		/* this will update a model object from the service. 
		@param (function) callBack = the callBack to handle 
		the service xhr response */
		update: function(callBack)
		{ 
			this.clearXhr(); 
			
			if(this.isValid())
			{
				var item = this.model.get(); 
				var params = 'op=update' + 
							 '&' + this.objectType + '=' + base.prepareJsonUrl(item); 

				this.request(params, callBack);
			}
		}, 
		
		/* this will delete a model object from the service. 
		@param (function) callBack = the callBack to handle 
		the service xhr response */
		delete: function(callBack)
		{ 
			this.clearXhr(); 
			
			var id = this.model.get('id'); 
			var params = 'op=delete' + 
						 '&id=' + id;  
			
			this.request(params, callBack);
		}, 
		
		/* this will get a list of model object from the service. 
		@param (function) callBack = the callBack to handle 
		the service xhr response
		@param (int) start = the row start count 
		@param (int) count = the row numbers to get 
		@param [(string)] filter = the filter */
		all: function(callBack, start, count, filter)
		{ 
			this.clearXhr(); 
			
			var params = 'op=all' + 
						 '&option=' + filter + 
						 '&start=' + start + 
						 '&stop=' + count; 
			
			this.request(params, callBack);
		}, 
		
		/* this will make the xhr request to the 
		service. 
		@param (string) params 
		@param (function) callBack 
		@param [(function)] requestCallBack = the call back for the
		service method */ 
		request: function(params, callBack, requestCallBack)
		{ 
			params = this.setupParams(params); 
			
			var self = this;
			this.xhr = base.ajax({ 
				url: this.url, 
				params: params, 
				completed: function(response, xhr)
				{ 
					if(typeof requestCallBack === 'function') 
					{ 
						requestCallBack(response);
					}
					 
					self.getResponse(response, callBack);
				}
			});
		},
		
		/* this will handle the xhr response. 
		@param (mixed) response = the xhr response 
		@param (function) callBack */
		getResponse: function(response, callBack)
		{ 
			/* clear the xhr object */ 
			var xhr = this.xhr; 
			if(xhr !== null)
			{ 
				xhr = null; 
			}
	
			/* this will check to return the response 
			to the callBack function */ 
			if(typeof callBack === 'function')
			{ 
				callBack(response); 
			}
		}
	}; 
	
	/* this will setup the service object to extend itself. 
	@param (object) settings = the new service settings to 
	extend 
	@return (object) the new model service */ 
	ModelService.extend = function(settings)
    { 
    	var parent = this; 
        
		/* this will setup a new model service constructor */ 
		var modelService = function(model)
		{ 
			/* this will call the parent contructor */ 
			parent.call(this, model);
		};  

		/* this will extend the model and add the static 
		methods to the new object */ 
		modelService.prototype = base.extendClass(this.prototype, settings); 
		modelService.prototype.constructor = modelService;
        
        base.extendObject(parent, modelService); 

		return modelService;
    };
	
	/* we need to add the service object to the 
	model prototype as the xhr service */ 
	Model.prototype.xhr = ModelService; 
})();