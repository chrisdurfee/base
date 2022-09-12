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
		
		this.dirty = false; 
		
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
		
		remove: function()
		{ 
			 
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
			var set = function(attr, val, committer, stopMerge)
			{ 
				var setValue = function(obj, attr, val) 
				{ 
					var test = /(\.|\[)/; 
					if(test.test(attr))
					{ 
						var pattern = /(\w+)|(?:\[(\d)\))/g; 
						var props = attr.match(pattern);
						for (var i = 0, length = props.length - 1; i < length; i++)
						{
							var prop = props[i];
							var propValue = obj[prop];
							if (propValue === undefined) 
							{
								/* this will check to setup a new object 
								or an array if the prop is a number */ 
								obj[prop] = !isNaN(prop)? {} : []; 
							} 
							
							obj = propValue;
						}

						obj[props[i]] = val;
					} 
					else 
					{ 
						obj[attr] = val; 
					} 
				}; 

				if(self.bind === true)
				{ 
					var binder = base.DataBinder, 
					msg = self._id + ':change';
					
					/* this will recursivley update the data binder to 
					publish updates on values. this will convert the value
					to a string path to where the object is stored to allow 
					deep nested data to update on the bound elements. 
					@param (mixed) obj 
					@param (string) pathString */ 
					var publish = function(obj, pathString)
					{ 
						pathString = pathString || ""; 
						if(obj && typeof obj === 'object')
						{ 
							var subPath, value; 
							if(Array.isArray(obj))
							{ 
								var length = obj.length; 
								for(var i = 0; i < length; i++)
								{ 
									value = obj[i]; 
									subPath = pathString + '[' + i + ']';
									if(value && typeof value === 'object')
									{  
										publish(value, subPath);
									} 
									else 
									{ 
										/* save path and value */ 
										binder.publish(msg, subPath, value, self); 
									}
								}
							}
							else 
							{ 
								for(var prop in obj)
								{ 
									if(obj.hasOwnProperty(prop))
									{ 
										value = obj[prop]; 
										subPath = pathString + '.' + prop;
										if(value && typeof value === 'object')
										{ 
											publish(value, subPath);
										}
										else 
										{ 
											/* save path and value */
											binder.publish(msg, subPath, value, self);
										}
									}
								}
							}
						}
						else 
						{ 
							/* save path and value */
							binder.publish(msg, pathString, obj, self);
						}
						return pathString; 
					}; 
					
					/* this will check to update the model based on who 
                    updated it. if the data binder updated the data only 
                    the stage data is updated */ 
					if(!committer)
					{ 
						/* this will publish the data to the data binder 
						to update any ui elements that are subscribed */ 
						publish(val, attr); 
						
						/* this will update both stage and attribute 
						data because it wasupdated outside the data 
						binder */ 
						if(stopMerge !== true)
						{ 
							setValue(self.attributes, attr, val);
						}
						setValue(self.stage, attr, val);
					}
					else 
					{ 
						setValue(self.stage, attr, val);
						
						if(self.dirty === false)
						{ 
							self.dirty = true;
						}
					}
				}
				else
				{ 
					if(stopMerge !== true)
					{ 
						setValue(self.attributes, attr, val);
					}
					setValue(self.stage, attr, val);
				}
				
				/* this will check to update any local events 
				on the model */ 
				var message = attr + ':change'; 
				self.eventSub.publish(message, attr, val); 
			}; 

			var setupObject = function(object, committer, stopMerge) 
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
						set(attr, item, committer, stopMerge);
					}
				}
			}; 

			var args = arguments; 
			if(typeof args[0] === 'object') 
			{ 
				setupObject(args[0], args[1], args[2]); 
			}
			else 
			{ 
				set(args[0], args[1], args[2], args[3]); 
			}
		}, 
		
		mergeStage: function()
		{ 
			/* this will clone the stage object to the 
			attribute object */ 
			this.attributes = JSON.parse(JSON.stringify(this.stage)); 
			this.dirty = false; 
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
			this.dirty = false;
		}, 

		get: function( attrName ) 
		{
			if(typeof attrName !== 'undefined')
			{ 
				var get = function(obj, attr) 
				{ 
					var test = /(\.|\[)/; 
					if(test.test(attr))
					{ 
						var pattern = /(\w+)|(?:\[(\d)\))/g; 
						var props = attr.match(pattern);
						for (var i = 0, length = props.length - 1; i < length; i++)
						{
							var prop = props[i];
							var propValue = obj[prop];
							if (propValue !== undefined) 
							{
								obj = propValue;
							} 
							else 
							{
								break;
							}
						}

						return obj[props[i]];
					} 
					else 
					{ 
						return obj[attr]; 
					}
				};
				return get(this.stage, attrName);
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
			var settingsXhr = settings.xhr; 
			if(settingsXhr && typeof settingsXhr === 'object')
			{ 
				var xhr = base.createObject(settingsXhr);
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
		
		settings = settings || {}; 

		/* this will setup the default attribute settings for 
		the model */ 
		var defaultAttributes = setupDefaultAttr(settings); 
		var model = function(instanceSettings)
		{ 
			/* this will clone the original 
			instance settings object */ 
			if(instanceSettings && typeof instanceSettings === 'object')
			{ 
				instanceSettings = JSON.parse(JSON.stringify(instanceSettings)); 
			} 
			
			/* this will get the instance attributes that 
			the model will set as attribute data */ 
			var instanceAttr = setupAttrSettings(instanceSettings);

			/* we want to extend the default attr with the 
			instance attr before we set the data and call 
			the parent constructor */ 
			instanceAttr = base.extendObject(defaultAttributes, instanceAttr); 
			parent.call(this, instanceAttr);  
			
			/* this will setup the model service and 
			pass the new model instance to the service */ 
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
			params = this.addParams(params, defaults); 
			return params; 
		}, 
		
		parseQueryString: function(str) 
		{
			str = str || ''; 
			var objURL = {},
			regExp = /([^?=&]+)(=([^&]*))?/g;

			str.replace(regExp, function(a, b, c, d) 
			{
				/* we want to save the key and the
				value to the objURL */
				objURL[b] = d;
			});

			/* we want to check if the url has any params */
			return objURL;
		}, 
		
		/* this will add params strings. 
		@param (string) params 
		@param (string) addingParams 
		@return (string) the params combined */ 
		addParams: function(params, addingParams)
		{ 
			params = params || {};
			if(typeof params !== 'object')
			{ 
				params = this.parseQueryString(params); 
			} 
			
			addingParams = addingParams || {}; 
			if(typeof addingParams === 'string')
			{  
				addingParams = this.parseQueryString(addingParams);  
			}
			
			return base.extendObject(params, addingParams); 
		}, 
		
		/* this is a property to override the return type 
		used in the the request and response xhr calls. this 
		will define what the web service defines as the object type. */ 
		objectType: 'item',  
		
		/* this will get a model object from the  service. 
		@param [(string)] instanceParams = the params to add 
		to the service instance 
		@param [(function)] callBack = the callBack to handle 
		the service xhr response
		@return (object) xhr object */ 
		get: function(instanceParams, callBack)
		{ 
			var id = this.model.get('id'); 
			var params = 'op=get' + 
						 '&id=' + id;  
			
			var model = this.model, 
			self = this; 
			return this.request(params, instanceParams, callBack, function(response)
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
		@param [(string)] instanceParams = the params to add 
		to the service instance 
		@param [(function)] callBack = the callBack to handle 
		the service xhr response
		@return (object) xhr object or false on error */
		setup: function(instanceParams, callBack)
		{ 
			if(this.isValid())
			{ 
				var item = this.model.get(); 
				var params = 'op=setup' + 
							 '&' + this.objectType + '=' + base.prepareJsonUrl(item); 
				
				/* this will add the instance params with the 
				method params */ 
				params = this.addParams(params, instanceParams, instanceParams);

				return this.request(params, callBack);
			}
			return false; 
		}, 
		
		/* this will add a model object from the service. 
		@param [(string)] instanceParams = the params to add 
		to the service instance 
		@param [(function)] callBack = the callBack to handle 
		the service xhr response
		@return (object) xhr object or false on error*/
		add: function(instanceParams, callBack)
		{ 
			if(this.isValid())
			{
				var item = this.model.get(); 
				var params = 'op=add' + 
							 '&' + this.objectType + '=' + base.prepareJsonUrl(item); 

				return this.request(params, instanceParams, callBack);
			}
			return false; 
		}, 
		
		/* this will update a model object from the service. 
		@param [(string)] instanceParams = the params to add 
		to the service instance 
		@param [(function)] callBack = the callBack to handle 
		the service xhr response
		@return (object) xhr object or false on error*/
		update: function(instanceParams, callBack)
		{ 
			if(this.isValid())
			{
				var item = this.model.get(); 
				var params = 'op=update' + 
							 '&' + this.objectType + '=' + base.prepareJsonUrl(item); 

				return this.request(params, instanceParams, callBack);
			}
			return false; 
		}, 
		
		/* this will delete a model object from the service. 
		@param [(string)] instanceParams = the params to add 
		to the service instance 
		@param [(function)] callBack = the callBack to handle 
		the service xhr response
		@return (object) xhr object */
		delete: function(instanceParams, callBack)
		{ 
			var id = this.model.get('id'); 
			var params = 'op=delete' + 
						 '&id=' + id;  
			
			return this.request(params, instanceParams, callBack);
		}, 
		
		/* this will get a list of model object from the service. 
		@param [(string)] instanceParams = the params to add 
		to the service instance
		@param [(function)] callBack = the callBack to handle 
		the service xhr response
		@param [(int)] start = the row start count 
		@param [(int)] count = the row numbers to get 
		@param [(string)] filter = the filter
		@return (object) xhr object */
		all: function(instanceParams, callBack, start, count, filter)
		{ 
			filter = filter || ''; 
			start = !isNaN(start)? start : 0; 
			count = !isNaN(count)? count : 50;
			
			var params = 'op=all' + 
						 '&option=' + filter + 
						 '&start=' + start + 
						 '&stop=' + count; 
			
			return this.request(params, instanceParams, callBack);
		}, 
		
		/* this will make the xhr request to the 
		service. 
		@param (string) params 
		@param (string) instanceParams = the params to add 
		to the service instance
		@param (function) callBack 
		@param [(function)] requestCallBack = the call back for the
		service method
		@return (object) xhr object */ 
		request: function(params, instanceParams, callBack, requestCallBack)
		{ 
			params = this.setupParams(params); 
			
			/* this will add the instance params with the 
			method params */ 
			params = this.addParams(params, instanceParams);
			
			var self = this;
			return base.ajax({ 
				url: this.url, 
				params: params, 
				completed: function(response, xhr)
				{ 
					if(typeof requestCallBack === 'function') 
					{ 
						requestCallBack(response);
					}
					 
					self.getResponse(response, callBack, xhr);
				}
			});
		},
		
		/* this will handle the xhr response. 
		@param (mixed) response = the xhr response 
		@param (function) callBack
		@param (object) the xhr object */
		getResponse: function(response, callBack, xhr)
		{ 
			/* this will check to return the response 
			to the callBack function */ 
			if(typeof callBack === 'function')
			{ 
				callBack(response, xhr); 
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