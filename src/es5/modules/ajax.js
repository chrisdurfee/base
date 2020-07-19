/* base framework module */
(function()
{
	"use strict"; 
	
	/**
	 * This is the default xhr (ajax) settings. 
	 */
	var XhrDefaultSettings = 
	{ 
		url: '',       
		
		/* this is the responseType of the server 
		response (string) */ 
		responseType:  'json', 
		
		/* this is the server method */ 
		method: 'POST',
		
		/* this can fix a param string to be added 
		to every ajax request */ 
		fixedParams: '',
		
		/* headers (object) */ 
		headers: 
		{ 
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' 
		}, 
		
		/* this will set the ajax request to async (bool) */ 
		async: true, 
		
		/* cross domain (bool) */ 
		crossDomain: false, 
		
		/* cors with credentials (bool) */ 
		withCredentials: false,
		
		/* events (function) */ 
		completed: null, 
		failed: null, 
		aborted: null, 
		progress: null 
	}; 
	
	/**
	 * This is the xhr factory that can create new xhr objects. 
	 */
	var XhrFactory = 
	{ 
		/**
		 * This will create an xhr object. 
		 * 
		 * @return {(object|null)}
		 */
		_createXHR: function() 
		{   
			/* create a local function to perform the check 
			once then override the function */ 
			var createXhr;  
			if(typeof XMLHttpRequest !== "undefined") 
			{ 
				// modern browsers
				createXhr = function() 
				{ 
					return new XMLHttpRequest();
				}; 
			} 
			else 
			{ 
				try{ 
					createXhr = function() 
					{ 
						return new ActiveXObject("Msxml2.XMLHTTP");
					}; 
				} 
				catch(e) 
				{ 
					try{  
						createXhr = function() 
						{ 
							return new ActiveXObject("Microsoft.XMLHTTP");
						};
					} 
					catch(err) 
					{ 
						 
					} 
				} 
				
				if(!createXhr) 
				{ 
					createXhr = function() 
					{ 
						return false;
					}; 
				}
			} 
			
			return base.override(this, '_createXHR', createXhr, arguments);
		}, 
		
		/**
		 * This will create a CORS xhr object. 
		 * 
		 * @return {(object|null)}
		 */
		_createCorsXHR: function() 
		{   
			/* create a local function to perform the check 
			once then override the function */ 
			var createXhr;  
			if(typeof XMLHttpRequest !== "undefined" && typeof XDomainRequest === "undefined") 
			{ 
				// modern browsers
				createXhr = function() 
				{ 
					return new XMLHttpRequest();
				}; 
			} 
			else if(typeof XDomainRequest !== "undefined") 
			{ 
				createXhr = function() 
				{ 
					return new XDomainRequest();
				};
			} 
			else 
			{ 
				createXhr = function() 
				{ 
					return false;
				}; 
			}
			
			return base.override(this, '_createCorsXHR', createXhr, arguments);
		}
	}; 
	
	/* this will add ajax settings to the base class */ 
	base.augment(
	{
		/**
		 * @member {object} xhrSettings
		 */
		xhrSettings: XhrDefaultSettings, 
		
		/**
		 * This will add fixed params to each xhr request. 
		 * 
		 * @param {(string|object)} params 
		 */
		addFixedParams: function(params) 
		{ 
			base.xhrSettings.fixedParams = params; 
		}, 
		
		/**
		 * This will update the xhr settings. 
		 * 
		 * @param {object} settingsObj 
		 */
		ajaxSettings: function(settingsObj) 
		{ 
			if(typeof settingsObj === 'object') 
			{ 
				base.xhrSettings = base.extendClass(base.xhrSettings, settingsObj); 
			}
		}, 
		
		/**
		 * This will reset the xhr settings. 
		 */
		resetAjaxSettings: function() 
		{ 
			base.xhrSettings = XhrDefaultSettings; 
		}
	}); 
	
	/**
	 * This will make an xhr (ajax) request. 
	 * 
	 * @param {string} url
	 * @param {string} params
	 * @param {function} callBackFn
	 * @param {string} responseType
	 * @param {string} [method=POST]
	 * @param {boolean} async 
	 * 
	 * or 
	 * 
	 * @param {object} settings 
	 * @example 
	 * {
	 * 	url: '',
	 * 	params: '',
	 * 	completed: function(response)
	 * 	{
	 * 		
	 * 	}
	 * }
	 * 
	 * @return {object} xhr object. 
	 */
	base.extend.ajax = function()
	{ 
		/* we want to save the args so we can check 
		which way we are adding the ajax settings */ 
		var args = base.listToArray(arguments), 
		ajax = new XhrRequest(args);   
		return ajax.xhr;
	}; 
	
	/**
	 * XhrRequest
	 * 
	 * This will create an xhr request object. 
	 * @class 
	 */
	var XhrRequest = base.Class.extend(
	{ 
		/**
		 * @constructor
		 * @param {*} args 
		 */
		constructor: function(args) 
		{ 
			this.settings = null;  
			this.xhr = null;
			this.setup(args); 
		}, 
		
		/**
		 * This will setup the xhr request. 
		 * 
		 * @protected
		 * @param {*} args 
		 * @return {(object|boolean)}
		 */
		setup: function(args) 
		{ 
			this.getXhrSettings(args);  
			
			var xhr = this.xhr = this.createXHR(); 
			if(xhr === false) 
			{ 
				return false; 
			}
				 
			var settings = this.settings; 
			xhr.open(settings.method, settings.url, settings.async); 

			this.setupHeaders(); 
			this.addXhrEvents(); 

			/* this will setup the params and send the 
			xhr request */ 
			xhr.send(this.getParams()); 
		},
		
		/**
		 * This will convert an object to a string. 
		 * 
		 * @protected
		 * @param {object} object 
		 * @return {string}
		 */
		objectToString: function(object)
		{ 
			var params = [];
			for (var prop in object)
			{
				if(object.hasOwnProperty(prop))
				{ 
					params.push(prop + '=' + object[prop]);
				}
			}
			return params.join('&');
		}, 
		
		/**
		 * This will add the base params to the request params. 
		 * 
		 * @protected
		 * @param {*} params 
		 * @param {*} addingParams 
		 * @return {*}
		 */
		setupParams: function(params, addingParams)
		{ 
			var paramsType = typeof params;
			if(addingParams)
			{ 
				/* this will convert the adding params to match 
				the params type */ 
				var addingType = typeof addingParams;
				if(paramsType === 'string') 
				{ 
					if(addingType !== 'string')
					{ 
						addingParams = this.objectToString(addingParams); 
					}

					var char = (params === '')? '?' : '&'; 
					params += char + addingParams; 
				}
				else 
				{ 
					if(addingType === 'string')
					{ 
						addingParams = base.parseQueryString(addingParams); 
					} 

					if(params instanceof FormData) 
					{ 
						for(var key in addingParams) 
						{ 
							if(addingParams.hasOwnProperty(key))
							{ 
								params.append(key, addingParams[key]);
							}
						}
					}
					else if(paramsType === 'object')
					{ 
						/* we don't want to modify the original object 
						so we need to clone the object before extending */ 
						params = JSON.parse(JSON.stringify(params)); 

						params = base.extendObject(addingParams, params); 
						params = this.objectToString(params);
					}
				}
			}
			else 
			{ 
				if((params instanceof FormData) === false && paramsType === 'object') 
				{ 
					params = this.objectToString(params);
				}
			}
			return params; 
		}, 
		
		/**
		 * This will get the params. 
		 * @protected
		 * @return {*}
		 */
		getParams: function() 
		{ 
			var settings = this.settings, 
			params = settings.params;  
			
			var fixedParams = settings.fixedParams;
			if(params) 
			{
				params = this.setupParams(params, fixedParams); 
			}
			else if(fixedParams)
			{ 
				params = this.setupParams(fixedParams); 
			}
 
			return params; 
		},
		
		/**
		 * This will set the settings from the args. 
		 * 
		 * @protected
		 * @param {array} args 
		 */
		getXhrSettings: function(args) 
		{ 
			/* we want to create a clone of the default 
			settings before adding the new settings */ 
			var settings = this.settings = base.createObject(base.xhrSettings);  
			
			/* we want to check if we are adding the ajax settings by 
			individual args or by a settings object */ 
			if(args.length >= 2 && typeof args[0] !== 'object') 
			{ 
				for(var i = 0, maxLength = args.length; i < maxLength; i++) 
				{ 
					var arg = args[i]; 
					
					switch(i) 
					{ 
						case 0: 
							settings.url = arg; 
							break; 
						case 1: 
							settings.params = arg; 
							break; 
						case 2: 
							settings.completed = arg; 
							settings.failed = arg;
							break; 
						case 3: 
							settings.responseType = arg || 'json'; 
							break; 
						case 4: 
							settings.method = (arg)? arg.toUpperCase() : 'POST'; 
							break; 
						case 5: 
							settings.async = (typeof arg !== 'undefined')? arg : true; 
							break; 
					} 
				} 
			}
			else 
			{ 
				/* override the default settings with the args 
				settings object */ 
				settings = this.settings = base.extendClass(this.settings, args[0]); 
				
				/* we want to check to add the completed callback 
				as the error and aborted if not set */ 
				if(typeof settings.completed === 'function') 
				{ 
					if(typeof settings.failed !== 'function') 
					{ 
						settings.failed = settings.completed; 
					} 
					
					if(typeof settings.aborted !== 'function') 
					{ 
						settings.aborted = settings.failed; 
					} 
				} 
			} 
		},
		
		/**
		 * This will create the xhr object. 
		 * 
		 * @protected
		 * @return {(object|boolean)}
		 */
		createXHR: function() 
		{ 			
			/* we want to check to setup the xhr by 
			the crossDomain settings */ 
			var settings = this.settings; 
			var xhr = (settings && settings.crossDomain === true)? XhrFactory._createCorsXHR() : XhrFactory._createXHR(); 
			if(!xhr)
			{
				return false; 
			} 
			
			if(xhr.hasOwnProperty('responseType'))
			{
				xhr.responseType = settings.responseType; 
			}
			
			if(settings.withCredentials === true) 
			{ 
				xhr.withCredentials = true;
			}
 
			return xhr;  
		}, 
		 
		/**
		 * This will setup the request headers. 
		 */
		setupHeaders: function() 
		{ 
			var settings = this.settings; 
			if(settings && typeof settings.headers === 'object') 
			{ 
				/* we want to add a header for each 
				property in the object */ 
				var headers = settings.headers;  
				for(var header in headers) 
				{ 
					if(headers.hasOwnProperty(header)) 
					{ 
						this.xhr.setRequestHeader(header, headers[header]);
					}
				} 
			} 
		}, 
		
		/**
		 * This will update the request status. 
		 * 
		 * @param {object} e 
		 * @param {string} [overrideType] 
		 */
		update: function(e, overrideType) 
		{ 
			e = e || window.event; 
			
			var xhr = this.xhr; 
			
			/* this will remove the xhr events from the active events 
			after the events are completed, aborted, or errored */
			var removeEvents = function() 
			{ 	
				var events = base.events; 
				events.removeEvents(xhr.upload); 
				events.removeEvents(xhr); 
			};
			
			var settings = this.settings; 
			if(!settings)
			{
				return false; 
			} 
			
			var type = overrideType || e.type; 
			switch(type) 
			{ 
				case 'load':  
					if(typeof settings.completed === 'function') 
					{ 
						var response = this.getResponseData();  
						settings.completed(response, this.xhr);  
					} 
					removeEvents();
					break; 
				case 'error':  
					if(typeof settings.failed === 'function') 
					{ 
						settings.failed(false, this.xhr); 
					} 
					removeEvents();
					break; 
				case 'progress':  
					if(typeof settings.progress === 'function') 
					{  
						settings.progress(e); 
					} 
					break; 
				case 'abort':  
					if(typeof settings.aborted === 'function') 
					{  
						settings.aborted(false, this.xhr); 
					} 
					removeEvents();
					break; 
			} 
		}, 
		
		/**
		 * This will get the response data. 
		 * 
		 * @return {*}
		 */
		getResponseData: function() 
		{ 
			var xhr = this.xhr, 
			response = xhr.responseText; 
				
			if(xhr.responseType || typeof response !== 'string') 
			{ 
				return response; 
			}
				 
			var encoded = false; 
			/* we want to check to decode the response by the type */ 
			switch(this.settings.responseType.toLowerCase()) 
			{ 
				case 'json': 

					encoded = base.jsonDecode(response); 
					if(encoded !== false) 
					{ 
						response = encoded; 
					} 
					else 
					{ 
						response = response; 
						this.error = 'yes'; 
					}
					break; 
				case 'xml': 
					encoded = base.xmlParse(response); 
					if(encoded !== false) 
					{ 
						response = encoded; 
					} 
					else 
					{ 
						response = response; 
						this.error = 'yes'; 
					} 
					break; 
				case 'text': 
					break;

			} 
			
			return response; 
		}, 
		
		/**
		 * This will check the ready state. 
		 * 
		 * @protected
		 * @param {object} e 
		 */
		checkReadyState: function(e) 
		{ 
			e = e || window.event; 
			
			var xhr = this.xhr; 
			if(xhr.readyState != 4)
			{ 
				/* the response is not ready */ 
				return; 
			} 
			
			var type = 'error'; 
			if(xhr.status == 200) 
			{ 
				 /* the ajax was successful 
				 but we want to change the event type to load */ 
				 type = 'load';  
			}  
			
			this.update(e, type);
		}, 
		
		/**
		 * This will add the xhr events. 
		 */
		addXhrEvents: function() 
		{ 
			var settings = this.settings; 
			if(!settings) 
			{ 
				return false; 
			} 

			var xhr = this.xhr; 
			/* we need to check if we can add new event listeners or 
			if we have to use the old ready state */ 
			if(typeof xhr.onload !== 'undefined') 
			{ 
				var callBack = base.bind(this, this.update); 
				base.on(['load', 'error', 'abort'], xhr, callBack); 
				base.on('progress', xhr.upload, callBack); 
			} 
			else 
			{ 
				var self = this;
				xhr.onreadystatechange = function(e)
				{ 
					self.checkReadyState(e); 
				}; 
			}
		}  
	}); 
})();