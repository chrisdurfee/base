/* base framework module */
/*
	router module
*/
(function()
{
	"use strict";

	var utils =
	{
		/* this will remove the begining and ending slashes on a url.
		@param (string) uri = the uri to remove
		@return (string) the uri */
		removeSlashes: function(uri)
		{
			if(typeof uri === 'string')
			{
				var pattern = /(^\/|\/$)/g;
				uri = uri.toString().replace(pattern, '');
			}

			return uri;
		}
	};

	var routerNumber = 0;

	/*
		router

		this will add client side routing to allow routes to be
		setup and the router to navigate and activate the routes
		that match the uri.

		@param (string) baseURI = the root of the router uri
		@param (string) title = the root title
	*/
	var Router = function(baseURI, title)
	{
		this.version = '1.0.2';

		/* this is the root of the uri for the routing object
		and the base title */
		this.baseURI = baseURI || '/';
		this.title = (typeof title !== 'undefined')? title : '';
		this.number = routerNumber++;

		/* this will be used to accessour history object */
		this.history = null;
		/* this will store each route added to the
		router. */
		this.routes = [];
		/* this will setup the router and check
		to add the history support */
		this.setup();
	};

	Router.prototype =
	{
		constructor: Router,

		/* this will setup our route history */
		setupHistory: function()
		{
			this.history = new RouteHistory(this);
			this.history.setup();
		},

		/* this will add a route to the router.
		@param (string) uri = the route uri
		@param (string) template = the template name
		@param [(function)] callBack = the call back function
		@param [(string)] title = the route title
		@param [(string)] id = the route id
		@return (object) reference to the object */
		add: function(uri, template, callBack, title, id)
		{
			if(typeof uri === 'string')
			{
				/* we need to format the uri */
				uri = this.formatURI(uri);

				var route = new Route(uri, template, callBack, title, id);
				this.routes.push(route);
			}
			return this;
		},

		formatURI: function(uri)
		{
			/* we need to format the uri and setup the uri query
			reg exp that is used to check the route */
			uri = utils.removeSlashes(uri);
			return this.createURI(uri);
		},

		/* this will create a uri with the base path and
		the route uri.
		@param (string) uri = the uri
		@return (string) the uri */
		createURI: function(uri)
		{
			var pathURI = '';
			if(this.baseURI !== '/')
			{
				pathURI += this.baseURI;
			}
			pathURI += ((pathURI[pathURI.length - 1] !== '/')? '/' : '') + utils.removeSlashes(uri);

			return pathURI;
		},

		/* this will get a route by the route settings.
		@param (string) uri = the route uri
		@param (string) template = the template name
		@param [(function)] callBack = the call back function
		@return (mixed) the routeobject or false on error */
		getRoute: function(uri, template, callBack)
		{
			var routes = this.routes,
			length = routes.length;
			if(length)
			{
				for(var i = 0; i < length; i++)
				{
					var route = routes[i];
					if(route.uri === uri && route.template === template && route.callBack === callBack)
					{
						return route;
					}
				}
			}
			return false;
		},

		/* this will remove a route from the router by the route settings.
		@param (string) uri = the route uri
		@param (string) template = the template name
		@param [(function)] callBack = the call back function
		@return (object) reference to the object */
		remove: function(uri, template, callBack)
		{
			uri = this.formatURI(uri);

			var route = this.getRoute(uri, template, callBack);
			if(route)
			{
				var routes = this.routes;
				var index = base.inArray(routes, route);
				if(index > -1)
				{
					routes.splice(index, 1);
				}
			}
			return this;
		},

		/* this will setup the history object
		@return (object) reference to the object */
		setup: function()
		{
			this.setupHistory();

			/* this will route to the first url entered
			when the router loads. this will fix the issue
			that stopped the first endpoint from being
			added to the history */
			var endPoint = this.getEndPoint() || '/';
			this.navigate(endPoint, null, true);
			return this;
		},

		/* this will reset the router
		@return (object) reference to the object */
		reset: function()
		{
			this.routes = [];
			return this;
		},

		/* this will activate any active routes
		@return (object) reference to the object */
		activate: function()
		{
			this.checkActiveRoutes();
			return this;
		},

		/* this will navigate the router to the uri.
		@param (string) uri = the relative uri
		@param [(object)] data = a data object that will
		be added to the history state object
		@param [(bool)] replace = settrue to replace state
		@return (object) a reference to the router object */
		navigate: function(uri, data, replace)
		{
			uri = this.createURI(uri);
			this.history.addState(uri, data, replace);
			this.activate();
			return this;
		},

		/* this will update the window title with the route title.
		@param (object) route = a route that has a title
		@return (object) a reference to the router object */
		updateTitle: function(route)
		{
			if(route && route.title)
			{
				var title = route.title,
				parent = this;

				var getTitle = function(title)
				{
					/* this will uppercase each word in a string
					@param (string) str = the string to uppercase
					@return (string) the uppercase string */
					var toTitleCase = function(str)
					{
						var pattern = /\w\S*/;
						return str.replace(pattern, function(txt)
						{
							return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
						});
					};

					/* this will replace the params in the title
					@param (string) str = the route title
					@return (string) the title string */
					var replaceParams = function(str)
					{
						if(str.indexOf(':') > -1)
						{
							var params = route.params;
							for(var prop in params)
							{
								if(params.hasOwnProperty(prop))
								{
									var param = params[prop];
									var pattern = new RegExp(':' + prop, 'gi');
									str = str.replace(pattern, param);
								}
							}
						}
						return str;
					};

					if(title)
					{
						/* we want to replace any params in the title
						and uppercase the title */
						title = replaceParams(title);
						var pattern = /-/g;
						title = toTitleCase(title.replace(pattern, ' '));

						/* we want to check to add the base title to the
						to the end of the title */
						if(parent.title != '')
						{
							title += " - " + parent.title;
						}
					}
					return title;
				};

				document.title = getTitle(title);
			}
			return this;
		},

		/* this will get all active routes from a path.
		@param [(string)] path = the path or the current
		url path will be used
		@return (array) an array of active routes */
		checkActiveRoutes: function(path)
		{
			var active = [],
			routes = this.routes,
			length = routes.length;
			if(length)
			{
				path = path || this.getPath();

				var route,
				check;

				for(var i = 0; i < length; i++)
				{
					route = routes[i];
					if(typeof route !== 'undefined')
					{
						check = this.check(route, path);
						if(check !== false)
						{
							active[active.length] = route;
						}
						else
						{
							route.deactivate();
						}
					}
				}
			}
			return active;
		},

		/* this will check to select a route if it the route uri
		matches the path.
		@param (object) route = the route
		@param [(string)] path = the path. if left null the
		active path will beused
		@return (bool) true or false if active */
		check: function(route, path)
		{
			var matched = false;

			/* we want to check to use the supplied uri or get the
			current uri if not setup */
			path = path || this.getPath();

			/* we want to check if the route uri matches the path uri */
			var validURI = this.match(route, path);
			if(validURI)
			{
				matched = true;
				this.select(route);
			}
			return matched;
		},

		/* this will match a route if it the route uri
		matches the path.
		@param (object) route = the route
		@param [(string)] path = the path. if left null the
		active path will beused
		@return (bool) true or false if active */
		match: function(route, path)
		{
			/* we want to check if the route has been
			deleted from the routes */
			if(!route)
			{
				return false;
			}

			var matched = false;

			/* we want to check to use the supplied uri or get the
			current uri if not setup */
			path = path || this.getPath();
			var validURI = path.match(route.uriQuery);
			if(validURI)
			{
				matched = true;

				/* this will remove the first match from the
				the params */
				if(validURI && typeof validURI === 'object')
				{
					validURI.shift();
					matched = validURI;
				}

				/* this will get the uri params of the route
				and if set will save them to the route */
				route.updateParams(validURI);
			}
			return matched;
		},

		/* this will get the param names from the route uri.
		@param (object) route = the route object */
		select: function(route)
		{
			if(route)
			{
				route.select();

				this.updateTitle(route);
			}
		},

		/* this will return the set endpoint not including the
		base uri.
		@return (string) the last endpoint */
		getEndPoint: function()
		{
			var path = this.getPath();
			return path.replace(this.baseURI, '');
		},

		/* this will get the location pathname.
		@return (string) the location pathname */
		getPath: function()
		{
			/* we want to get the window location path */
			return window.location.pathname;
		}
	};

	/*
		RouteHistory

		this will setup the history controller for
		a router.

		@param (object) router
	*/
	var RouteHistory = function(router)
	{
		this.router = router;

		/* this will check if the history api is supported
		and enabled */
		this.enabled = false;
		this.locationId = 'base-app-router-' + router.number;
		this.callBack = null;
		this.callBackLink = null;
	};

	RouteHistory.prototype =
	{
		constructor: RouteHistory,

		/* this will check to add history support is
		the browser supports it */
		setup: function()
		{
			/* we want to check if history is enabled */
			this.enabled = base.history.isSupported();

			/* we want to check to add the history event listener
			that will check the popsate events and select the
			nav option by the history state object */
			if(this.enabled === true)
			{
				this.callBackLink = base.bind(this, this.checkLink);
				this.callBack = base.bind(this, this.checkHistoryState);
				this.addEvent();
			}
			return this;
		},

		checkLink: function(evt)
		{
			var target = evt.target || evt.srcElement;
			var nodeName = target.nodeName.toLowerCase();
			if(nodeName !== 'a')
			{
				/* this will check to get the parent to check
				if the child is contained in a link */
				target = target.parentNode;
				if(target === null)
				{
					return true;
				}

				nodeName = target.nodeName.toLowerCase();
				if(nodeName !== 'a')
				{
					return true;
				}
			}

			if(!base.data(target, 'cancel-route'))
			{
				var href = target.getAttribute('href');
				if(typeof href !== 'undefined')
				{
					var router = this.router;
					var path = href.replace(router.baseURI, '');
					router.navigate(path);

					evt.preventDefault();
					evt.stopPropagation();
					return false;
				}
			}
		},

		/* this will add an event history listener that will
		trigger when the window history is changed */
		addEvent: function()
		{
			base.on('click', document, this.callBackLink);
			base.on('popstate', window, this.callBack);
			return this;
		},

		removeEvent: function()
		{
			base.off('click', document, this.callBackLink);
			base.off('popstate', window, this.callBack);
			return this;
		},

		checkHistoryState: function(evt)
		{
			/* we want to check if the event has a state and if the
			state location is from the background */
			var state = evt.state;
			if(state && state.location === this.locationId)
			{
				evt.preventDefault();
				evt.stopPropagation();

				this.router.checkActiveRoutes(state.uri);
			}
		},

		createStateObject: function(uri, data)
		{
			var stateObj = {
				location: this.locationId,
				uri: uri
			};

			if(data && typeof data === 'object')
			{
				stateObj = base.extendObject(stateObj, data);
			}

			return stateObj;
		},

		addState: function(uri, data, replace)
		{
			if(this.enabled === true)
			{
				var history = window.history,
				lastState = history.state;

				/* we want to check if the object is not already
				the last saved state */
				if(!lastState || lastState.uri !== uri)
				{
					var stateObj = this.createStateObject(uri, data);

					/* this will check to push state or
					replace state */
					replace = replace === true? true : false;
					var method = (replace === false)? 'pushState' : 'replaceState';
					history[method](stateObj, null, uri);
				}
			}

			return this;
		}
	};

	var routeCount = 0;

	/*
		Route

		@param (string) uri = the route uri
		@param (string) template = the template name
		@param [(function)] callBack = the call back function
		@param [(string)] title = the route title
		@param [(string)] id = the route id
	*/
	var Route = function(uri, template, callBack, title, id)
	{
		this.id = id || 'bs-rte-' + routeCount++;
		this.uri = uri;

		/* route reg ex */
		var uriMatch = this.setupUriMatch(uri);
		this.uriQuery = new RegExp('^' + uriMatch);

		/* params */
		this.paramKeys = this.setupParamKeys(uri);
		this.params = null;

		/* this will setup the template and route component
		if one has been set */
		this.template = template;
		this.setupRouteComponent();

		this.callBack = callBack;
		this.title = title;
	};

	Route.prototype =
	{
		constructor: Route,

		/* this will setup the route uri string to be used in
		a regexp match.
		@param (string) uri = the route uri
		@return (string) the uri to be used in a regexp match */
		setupUriMatch: function(uri)
		{
			var uriQuery = "";
			if(uri)
			{
				/* we want to setup the wild card and param
				checks to be modified to the route uri string */
				var allowAll = /(\*)/g,
				param = /(:[^\/]*)/g,
				optionalParams = /(\?\/+\*?)/g,
				optionalSlash = /(\/):[^\/]*?\?/g,
				filter = /\//g;
				uriQuery = uri.replace(filter, "\/").replace(allowAll, '.*');

				/* this will setup for optional slashes before the optional params */
				uriQuery = uriQuery.replace(optionalSlash, function(str)
				{
					var pattern = /\//g;
					return str.replace(pattern, '\/*');
				});

				/* this will setup for optional params and params
				and stop at the last slash or query start */
				uriQuery = uriQuery.replace(optionalParams, '?\/*').replace(param, '([^\/|?]*)');
			}

			/* we want to set and string end if the wild card is not set */
			uriQuery += (uri[uri.length - 1] === '*')? '' : '$';
			return uriQuery;
		},

		setupParamKeys: function(uri)
		{
			var params = [];
			if(uri)
			{
				var pattern = /:(.[^\/]*)/g,
				matches = uri.match(pattern);
				if(matches)
				{
					for(var i = 0, maxLength = matches.length; i < maxLength; i++)
					{
						var param = matches[i];
						if(param)
						{
							pattern = /(:|\?)/g;
							var filter = /\*/g;
							/* we need to remove the colon, question mark, or asterisk
							 from the key name */
							param = param.replace(pattern, '').replace(filter, '');
							params.push(param);
						}
					}
				}
			}
			return params;
		},

		deactivate: function()
		{
			var component = this.component;
			if(component)
			{
				component.remove();
			}
		},

		setupRouteComponent: function()
		{
			var template = this.template;
			this.component = typeof template === 'string'? new RouteComponent(template) : null;
		},

		select: function()
		{
			var params = this.params;
			var callBack = this.callBack;
			if(typeof callBack === 'function')
			{
				callBack(params);
			}

			var component = this.component;
			if(component)
			{
				component.focus(params);
			}
		},

		updateParams: function(values)
		{
			/* this will get the uri params of the route
			and if set will save them to the route */
			return (this.params = this.getParams(values));
		},

		/* this will get the param names from the route uri.
		@param (array) values = the path param values
		@return (mixed) an empty object or an object with key
		and values of the params */
		getParams: function(values)
		{
			var keys = this.paramKeys,
			params = {};

			if(values && typeof values === 'object')
			{
				/* we want to add the value to each key */
				if(keys)
				{
					for(var i = 0, maxL = keys.length; i < maxL; i++)
					{
						var key = keys[i];
						if(typeof key !== 'undefined')
						{
							params[key] = values[i];
						}
					}
				}
			}
			return params;
		}
	};

	var RouteComponent = function(template)
	{
		this.component = null;
		this.setup = false;
		this.template = template;
	};

	RouteComponent.prototype =
	{
		constructor: RouteComponent,

		focus: function(params)
		{
			/* this will check to setup the component if
			the component has notbeen setup */
			if(this.setup === false && this.component === null)
			{
				this.create();
			}

			this.update(params);
		},

		/* this will create and setup a component
		from a route template.
		@param (object) route */
		create: function()
		{
			this.setup = true;

			var template = window[this.template];
			if(template)
			{
				var comp = this.component = new template();
				comp.setup();
			}
		},

		/* this will remove a route component */
		remove: function()
		{
			if(this.setup === true)
			{
				this.setup = false;

				var component = this.component;
				if(component)
				{
					if(typeof component.destroy === 'function')
					{
						component.destroy();
					}
					this.component = null;
				}
			}
		},

		update: function(params)
		{
			var component = this.component;
			if(component && typeof component.update === 'function')
			{
				component.update(params);
			}
		}
	};

	base.extend.router = Router;

})();