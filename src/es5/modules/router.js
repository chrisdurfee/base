/* base framework module */
(function()
{
	"use strict";

	/* this will register the route system to the
	data tracker to remove routes that have been
	nested in layouts. */
	base.DataTracker.addType('routes', function(data)
	{
		if(!data)
		{
			return false;
		}

		var route = data.route;
		if(route)
		{
			base.router.removeRoute(route);
		}
	});

	base.DataTracker.addType('switch', function(data)
	{
		if(!data)
		{
			return false;
		}

		var id = data.id;
		base.router.removeSwitch(id);
	});

	/**
	 * Utils
	 *
	 * These are some helper functions for the router.
	 */
	var Utils =
	{
		/**
		 * This will remove the begining and ending slashes from a url.
		 *
		 * @param {string} uri
		 * @return {string}
		 */
		removeSlashes: function(uri)
		{
			if(typeof uri === 'string')
			{
				if(uri.substr(0, 1) === '/')
				{
					uri = uri.substr(1);
				}

				if(uri.substr(-1) === '/')
				{
					uri = uri.substr(0, uri.length - 1);
				}
			}

			return uri;
		}
	};

	/**
	 * Router
	 *
	 * This will create a browser router.
	 * @class
	 */
	var Router = base.Class.extend(
	{
		constructor: function()
		{
			/**
			 * @member {string} version
			 */
			this.version = '1.0.2';

			/* this is the root of the uri for the routing object
			and the base title */
			this.baseURI = '/';
			this.title = '';

			this.lastPath = null;
			this.path = null;

			/* this will be used to access our history object */
			this.history = null;
			this.callBackLink = null;
			this.location = window.location;

			/* this will store each route added to the
			router. */
			this.routes = [];
			this.switches = {};
			this.switchCount = 0;

			/**
			 * @member {object} data
			 */
			this.data = new base.Data(
			{
				path: this.location.pathname
			});
		},

		/**
		 * This will setup our history object.
		 */
		setupHistory: function()
		{
			this.history = new History(this);
			this.history.setup();
		},

		/**
		 * This will create a new route.
		 *
		 * @protected
		 * @param {object} settings
		 * @return {object}
		 */
		createRoute: function(settings)
		{
			var uri = settings.uri || '*';
			settings.baseUri = this.createURI(uri);

			var route = new Route(settings);
			return route;
		},

		/**
		 * This will add a new route to the router.
		 *
		 * @param {object} settings
		 * @return {object}
		 */
		add: function(settings)
		{
			if(typeof settings !== 'object')
			{
				var args = arguments;
				settings =
				{
					uri: args[0],
					component: args[1],
					callBack: args[2],
					title: args[3],
					id: args[4],
					container: args[5]
				};
			}

			var route = this.createRoute(settings);
			this.addRoute(route);
			return route;
		},

		addRoute: function(route)
		{
			this.routes.push(route);
			this.checkRoute(route, this.location.pathname);
		},

		/**
		 * This will resume a route.
		 *
		 * @param {object} route
		 * @param {object} container
		 */
		resume: function(route, container)
		{
			route.resume(container);
			this.addRoute(route);
		},

		/**
		 * This will get the base path.
		 *
		 * @protected
		 * @return {string}
		 */
		getBasePath: function()
		{
			if(!this.basePath)
			{
				var pathURI = this.baseURI || '';
				if((pathURI[pathURI.length - 1] !== '/'))
				{
					pathURI += '/';
				}
				this.basePath = pathURI;
			}
			return this.basePath;
		},

		/**
		 * This will create a uri.
		 *
		 * @protected
		 * @param {string} uri
		 * @return {string}
		 */
		createURI: function(uri)
		{
			var baseUri = this.getBasePath();
			return (baseUri + Utils.removeSlashes(uri));
		},

		/**
		 * This will get a route by uri.
		 *
		 * @param {string} uri
		 * @return {(object|boolean)}
		 */
		getRoute: function(uri)
		{
			var routes = this.routes,
			length = routes.length;
			if(length > 0)
			{
				for(var i = 0; i < length; i++)
				{
					var route = routes[i];
					if(route.uri === uri)
					{
						return route;
					}
				}
			}
			return false;
		},

		/**
		 * This will get a route by id.
		 *
		 * @param {string} id
		 * @return {(object|boolean)}
		 */
		getRouteById: function(id)
		{
			var routes = this.routes,
			length = routes.length;
			if(length > 0)
			{
				for(var i = 0; i < length; i++)
				{
					var route = routes[i];
					if(route.id === id)
					{
						return route;
					}
				}
			}
			return false;
		},

		/**
		 * This will remove a route.
		 *
		 * @param {object} route
		 */
		removeRoute: function(route)
		{
			var routes = this.routes;
			var index = base.inArray(routes, route);
			if(index > -1)
			{
				routes.splice(index, 1);
			}
		},

		/**
		 * This will add a switch.
		 *
		 * @param {array} group
		 * @return {string} the switch id.
		 */
		addSwitch: function(group)
		{
			var id = this.switchCount++;
			var switchArray = this.getSwitchGroup(id);

			for(var i = 0, length = group.length; i < length; i++)
			{
				var route = this.createRoute(group[i]);
				switchArray.push(route);
			}

			this.checkGroup(switchArray, this.location.pathname);
			return id;
		},

		/**
		 * This will resume a switch.
		 *
		 * @param {object} group
		 * @param {object} container
		 * @return {int} the switch id.
		 */
		resumeSwitch: function(group, container)
		{
			var id = this.switchCount++;
			var switchArray = this.getSwitchGroup(id);

			for(var i = 0, length = group.length; i < length; i++)
			{
				var route = group[i].component.route;
				route.resume(container);
				switchArray.push(route);
			}

			this.checkGroup(switchArray, this.location.pathname);
			return id;
		},

		getSwitchGroup: function(id)
		{
			return (this.switches[id] = []);
		},

		/**
		 * This will remove a switch by id.
		 *
		 * @param {string} id
		 */
		removeSwitch: function(id)
		{
			var switches = this.switches;
			if(switches[id])
			{
				delete switches[id];
			}
		},

		/**
		 * This will remove a route by uri.
		 *
		 * @param {string} uri
		 * @return {object} a reference to the router object.
		 */
		remove: function(uri)
		{
			uri = this.createURI(uri);

			var route = this.getRoute(uri);
			if(route !== false)
			{
				this.removeRoute(route);
			}
			return this;
		},

		/**
		 * This will setup the router.
		 *
		 * @param {string} [baseURI]
		 * @param {string} [title]
		 * @return {object} a reference to the router object.
		 */
		setup: function(baseURI, title)
		{
			this.baseURI = baseURI || '/';
			this.title = (typeof title !== 'undefined')? title : '';

			this.setupHistory();

			this.callBackLink = base.bind(this, this.checkLink);
			base.on('click', document, this.callBackLink);

			/* this will route to the first url entered
			when the router loads. this will fix the issue
			that stopped the first endpoint from being
			added to the history */
			var endPoint = this.getEndPoint();
			this.navigate(endPoint, null, true);
			return this;
		},

		/**
		 * This will get the parent element link.
		 *
		 * @param {object} ele
		 * @return {(object|boolean)}
		 */
		getParentLink: function(ele)
		{
			var target = ele.parentNode;
			while(target !== null)
			{
				if(target.nodeName.toLowerCase() === 'a')
				{
					return target;
				}

				target = target.parentNode;
			}
			return false;
		},

		/**
		 * This will check if a link was routed.
		 *
		 * @protected
		 * @param {object} evt
		 */
		checkLink: function(evt)
		{
			if(evt.ctrlKey === true)
			{
				return true;
			}

			var target = evt.target || evt.srcElement;
			if(target.nodeName.toLowerCase() !== 'a')
			{
				/* this will check to get the parent to check
				if the child is contained in a link */
				target = this.getParentLink(target);
				if(target === false)
				{
					return true;
				}
			}

			if(target.target === '_blank' || base.data(target, 'cancel-route'))
			{
				return true;
			}

			var href = target.getAttribute('href');
			if(typeof href !== 'undefined')
			{
				var baseUri = this.baseURI,
				path = (baseUri !== '/')? href.replace(baseUri, '') : href;
				this.navigate(path);

				evt.preventDefault();
				evt.stopPropagation();
				return false;
			}
		},

		/**
		 * This will reset the router.
		 *
		 * @return {object} a reference to the router object.
		 */
		reset: function()
		{
			this.routes = [];
			this.switches = [];
			this.switchCount = 0;

			return this;
		},

		/**
		 * This will check the active routes.
		 *
		 * @return {object} a reference to the router object.
		 */
		activate: function()
		{
			this.checkActiveRoutes();
			return this;
		},

		/**
		 * This will navigate the router.
		 *
		 * @param {string} uri
		 * @param {object} [data]
		 * @param {boolean} [replace]
		 * @return {object} a reference to the router object.
		 */
		navigate: function(uri, data, replace)
		{
			uri = this.createURI(uri);
			this.history.addState(uri, data, replace);
			this.activate();

			return this;
		},

		/**
		 * This will update the data path.
		 * @protected
		 */
		updatePath: function()
		{
			var path = this.location.pathname;
			this.data.set('path', path);
		},

		/**
		 * This will update the title.
		 *
		 * @protected
		 * @param {object} route
		 */
		updateTitle: function(route)
		{
			if(!route || !route.title)
			{
				return this;
			}

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
						return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
					});
				};


				/* this will replace the params in the title
				@param (string) str = the route title
				@return (string) the title string */
				var replaceParams = function(str)
				{
					if(str.indexOf(':') > -1)
					{
						var params = route.stage;
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
					if(typeof title === 'function')
					{
						title = title(route.stage);
					}

					/* we want to replace any params in the title
					and uppercase the title */
					title = replaceParams(title);
					title = toTitleCase(title);

					/* we want to check to add the base title to the
					to the end of the title */
					if(parent.title !== '')
					{
						title += " - " + parent.title;
					}
				}
				return title;
			};

			document.title = getTitle(title);
		},

		/**
		 * This will check the routes to match the path.
		 *
		 * @protected
		 * @param {string} [path]
		 */
		checkActiveRoutes: function(path)
		{
			this.lastPath = this.path;

			path = path || this.getPath();
			this.path = path;

			var routes = this.routes,
			length = routes.length;

			var route;
			for(var i = 0; i < length; i++)
			{
				route = routes[i];
				if(typeof route === 'undefined')
				{
					continue;
				}

				this.checkRoute(route, path);
			}

			this.checkSwitches(path);
			this.updatePath();
		},

		/**
		 * This will check the switches to match the path.
		 *
		 * @protected
		 * @param {string} [path]
		 */
		checkSwitches: function(path)
		{
			var switches = this.switches;
			for(var id in switches)
			{
				if(switches.hasOwnProperty(id) === false)
				{
					continue;
				}

				var group = switches[id];
				this.checkGroup(group, path);
			}
		},

		/**
		 * This will check a group to match a path.
		 *
		 * @protected
		 * @param {object} group
		 * @param {string} path
		 */
		checkGroup: function(group, path)
		{
			var check = false,
			route, firstRoute, lastSelected, selected, hasController = false;

			for(var i = 0, length = group.length; i < length; i++)
			{
				route = group[i];
				if(typeof route === 'undefined')
				{
					continue;
				}

				/* we want to save the first route in the switch
				so it can be selected if no route is active */
				if(i === 0)
				{
					firstRoute = route;
				}

				if(!lastSelected && route.get('active'))
				{
					lastSelected = route;
				}

				if(check !== false)
				{
					if(hasController)
					{
						route.deactivate();
					}
					continue;
				}

				/* we will break the loop on the first match */
				check = route.match(path);
				if(check !== false)
				{
					selected = route;

					if(route.controller)
					{
						this.select(route);
						hasController = true;
					}
				}
			}

			if(selected === undefined)
			{
				this.select(firstRoute);

				if(lastSelected && firstRoute !== lastSelected)
				{
					lastSelected.deactivate();
				}
			}
			else
			{
				if(lastSelected)
				{
					if(hasController && selected !== lastSelected)
					{
						lastSelected.deactivate();
					}
				}
				else if(firstRoute && hasController === false)
				{
					this.select(firstRoute);
				}
			}
		},

		/**
		 * This will check if a route matches the path.
		 *
		 * @param {object} route
		 * @param {string} path
		 * @return {boolean}
		 */
		checkRoute: function(route, path)
		{
			var check = this.check(route, path);
			if(check !== false)
			{
				this.select(route);
			}
			else
			{
				route.deactivate();
			}
			return check;
		},

		/**
		 * This will select a route if the route matches the path.
		 *
		 * @param {object} route
		 * @param {string} [path]
		 */
		check: function(route, path)
		{
			/* we want to check if the route has been
			deleted from the routes */
			if(!route)
			{
				return false;
			}

			/* we want to check to use the supplied uri or get the
			current uri if not setup */
			path = path || this.getPath();

			/* we want to check if the route uri matches the path uri */
			return (route.match(path) !== false);
		},

		/**
		 * This will select the route.
		 *
		 * @param {object} route
		 */
		select: function(route)
		{
			if(!route)
			{
				return false;
			}

			route.setPath(this.path, this.lastPath);
			route.select();
			this.updateTitle(route);
		},

		/**
		 * This will get the endpoint.
		 *
		 * @return {string}
		 */
		getEndPoint: function()
		{
			var path = this.getPath();
			return (path.replace(this.baseURI, '') || '/');
		},

		/**
		 * This will remove the router events.
		 */
		destroy: function()
		{
			base.off('click', document, this.callBackLink);
		},

		/**
		 * This will get the location pathname.
		 *
		 * @return {string}
		 */
		getPath: function()
		{
			/* we want to get the window location path */
			var location = this.location,
			path = this.path = location.pathname;

			return path + location.search + location.hash;
		}
	});

	var routerNumber = 0;

	/**
	 * History
	 *
	 * This will setup the history controller.
	 * @class
	 */
	var History = base.Class.extend(
	{
		/**
		 * @constructor
		 * @param {object} router
		 */
		constructor: function(router)
		{
			this.router = router;

			/* this will check if the history api is supported
			and enabled */
			this.enabled = false;
			this.locationId = 'base-app-router-' + routerNumber++;
			this.callBack = null;
		},

		/**
		 * This will check if the history api is supported
		 * and add events.
		 *
		 * @return {object} a reference to the object.
		 */
		setup: function()
		{
			/* we want to check if history is enabled */
			this.enabled = this.isSupported();

			/* we want to check to add the history event listener
			that will check the popsate events and select the
			nav option by the history state object */
			if(this.enabled !== true)
			{
				return this;
			}

			this.callBack = base.bind(this, this.check);
			this.addEvent();
			return this;
		},

		/**
		 * This will check if the browser supports the history api.
		 *
		 * @return {boolean}
		 */
		isSupported: function()
		{
			if('history' in window && 'pushState' in window.history)
			{
				return true;
			}

			return false;
		},

		/**
		 * This will add the events.
		 *
		 * @return {object} a reference to the object.
		 */
		addEvent: function()
		{
			base.on('popstate', window, this.callBack);
			return this;
		},

		/**
		 * This will remove the events.
		 *
		 * @return {object} a reference to the object.
		 */
		removeEvent: function()
		{
			base.off('popstate', window, this.callBack);
			return this;
		},

		/**
		 * This will check to activate the router.
		 *
		 * @param {object} evt
		 */
		check: function(evt)
		{
			/* we want to check if the event has a state and if the
			state location is from the background */
			var state = evt.state;
			if(!state || state.location !== this.locationId)
			{
				return false;
			}

			evt.preventDefault();
			evt.stopPropagation();

			this.router.checkActiveRoutes(state.uri);
		},

		/**
		 * This will create a state object.
		 *
		 * @param {string} uri
		 * @param {*} data
		 * @return {object}
		 */
		createState: function(uri, data)
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

		/**
		 * This will add a state to the history.
		 *
		 * @param {string} uri
		 * @param {object} data
		 * @param {boolean} replace
		 * @return {object} a reference to the object.
		 */
		addState: function(uri, data, replace)
		{
			if(this.enabled !== true)
			{
				return this;
			}

			var history = window.history,
			lastState = history.state;

			if(lastState && lastState.uri === uri)
			{
				return this;
			}

			var stateObj = this.createState(uri, data);

			/* this will check to push state or
			replace state */
			replace = (replace === true);
			var method = (replace === false)? 'pushState' : 'replaceState';
			history[method](stateObj, null, uri);

			return this;
		}
	});

	/**
	 * This will setup a route uri pattern.
	 *
	 * @param {string} uri
	 * @return {string}
	 */
	var routePattern = function(uri)
	{
		var uriQuery = "";
		if(uri)
		{
			var filter = /\//g;
			uriQuery = uri.replace(filter, "\/");

			/* we want to setup the wild card and param
			checks to be modified to the route uri string */
			var allowAll = /(\*)/g;
			uriQuery = uriQuery.replace(allowAll, '.*');

			/* this will setup for optional slashes before the optional params */
			var optionalSlash = /(\/):[^\/(]*?\?/g;
			uriQuery = uriQuery.replace(optionalSlash, function(str)
			{
				var pattern = /\//g;
				return str.replace(pattern, '(?:$|\/)');
			});

			/* this will setup for optional params and params
			and stop at the last slash or query start */
			var param = /(:[^\/?&($]+)/g;
			var optionalParams = /(\?\/+\*?)/g;
			uriQuery = uriQuery.replace(optionalParams, '?\/*');
			uriQuery = uriQuery.replace(param, function(str)
			{
				return (str.indexOf('.') < 0)? '([^\/|?]+)' : '([^\/|?]+.*)';
			});
		}

		/* we want to set and string end if the wild card is not set */
		uriQuery += (uri[uri.length - 1] === '*')? '' : '$';
		return uriQuery;
	};

	/**
	 * This will get the param keys from the uri.
	 *
	 * @param {string} uri
	 * @return {array}
	 */
	var paramPattern = function(uri)
	{
		var params = [];
		if(!uri)
		{
			return params;
		}

		var filter = /[\*?]/g;
		uri = uri.replace(filter, '');

		var pattern = /:(.[^.\/?&($]+)\?*/g,
		matches = uri.match(pattern);
		if(matches === null)
		{
			return params;
		}

		for(var i = 0, maxLength = matches.length; i < maxLength; i++)
		{
			var param = matches[i];
			if(param)
			{
				param = param.replace(':', '');
				params.push(param);
			}
		}
		return params;
	};

	var routeCount = 0;

	/**
	 * Route
	 *
	 * This will create a route.
	 * @class
	 * @augments base.SimpleData
	 */
	var Route = base.SimpleData.extend(
	{
		/**
		 * @constructor
		 * @param {object} settings
		 */
		constructor: function(settings)
		{
			this.setupRoute(settings);

			var params = this.getParamDefaults();
			base.SimpleData.call(this, params);

			this.set('active', false);
		},

		/**
		 * This will setup the route settings.
		 *
		 * @protected
		 * @param {object} settings
		 */
		setupRoute: function(settings)
		{
			this.id = settings.id || 'bs-rte-' + routeCount++;

			var uri = settings.baseUri;
			this.uri = uri;
			this.path = null;
			this.referralPath = null;

			/* route reg ex */
			var uriMatch = routePattern(uri);
			this.uriQuery = new RegExp('^' + uriMatch);

			/* params */
			this.paramKeys = paramPattern(uri);
			this.params = null;

			/* this will setup the template and route component
			if one has been set */
			this.setupComponentHelper(settings);

			this.callBack = settings.callBack;
			this.title = settings.title;
		},

		/**
		 * This will get the default route params.
		 *
		 * @return {(object|null)}
		 */
		getParamDefaults: function()
		{
			var params = this.paramKeys;
			if(params.length)
			{
				var defaults = {};
				for(var i = 0, length = params.length; i < length; i++)
				{
					defaults[params[i]] = null;
				}
				return defaults;
			}
			return null;
		},

		/**
		 * This will update the route title.
		 *
		 * @param {string|function} title
		 */
		setTitle: function(title)
		{
			base.router.updateTitle({
				title: title,
				stage: this.stage
			});
		},

		/**
		 * This will deactivate the route.
		 */
		deactivate: function()
		{
			this.set('active', false);

			var controller = this.controller;
			if(controller)
			{
				controller.remove();
			}
		},

		/**
		 * This will setup the route component.
		 *
		 * @protected
		 * @param {object} settings
		 */
		setupComponentHelper: function(settings)
		{
			var component = settings.component;
			if(component)
			{
				var helperSettings =
				{
					component: component,
					container: settings.container,
					persist: settings.persist || false,
					parent: settings.parent
				};
				this.controller = new ComponentHelper(this, helperSettings);
			}
		},

		/**
		 * This will resume the route.
		 *
		 * @param {object} container
		 */
		resume: function(container)
		{
			var controller = this.controller;
			if(controller)
			{
				controller.container = container;
			}
		},

		/**
		 * This will set the route path.
		 *
		 * @param {string} path
		 * @param {string} referralPath
		 */
		setPath: function(path, referralPath)
		{
			this.path = path;
			this.referralPath = referralPath;
		},

		/**
		 * This will select the route.
		 */
		select: function()
		{
			this.set('active', true);

			var params = this.stage;
			var callBack = this.callBack;
			if(typeof callBack === 'function')
			{
				callBack(params);
			}

			var controller = this.controller;
			if(controller)
			{
				controller.focus(params);
			}
		},

		/**
		 * This will check if a route matches the path.
		 *
		 * @param {string} path
		 * @return {(object|boolean)}
		 */
		match: function(path)
		{
			var matched = false;

			/* we want to check to use the supplied uri or get the
			current uri if not setup */
			var result = path.match(this.uriQuery);
			if(result === null)
			{
				this.resetParams();
				return matched;
			}

			if(result && typeof result === 'object')
			{
				/* this will remove the first match from the
				the params */
				result.shift();
				matched = result;
				/* this will get the uri params of the route
				and if set will save them to the route */
				this.setParams(result);
			}

			return matched;
		},

		/**
		 * This will reset the params.
		 */
		resetParams: function()
		{
			this.stage = {};
		},

		/**
		 * This will set the params.
		 *
		 * @param {object} values
		 */
		setParams: function(values)
		{
			if(values && typeof values === 'object')
			{
				var keys = this.paramKeys;
				if(keys)
				{
					var params = {};
					for(var i = 0, maxL = keys.length; i < maxL; i++)
					{
						var key = keys[i];
						if(typeof key !== 'undefined')
						{
							params[key] = values[i];
						}
					}
					this.set(params);
				}
			}
		},

		/**
		 * This will get the params.
		 *
		 * @return {object}
		 */
		getParams: function()
		{
			return this.stage;
		}
	});

	/**
	 * ComponentHelper
	 *
	 * This will create a helper to create and destroy components
	 * that are added to a route.
	 * @class
	 */
	var ComponentHelper = base.Class.extend(
	{
		/**
		 * @constructor
		 * @param {object} route
		 * @param {object} settings
		 */
		constructor: function(route, settings)
		{
			this.route = route;

			this.template = settings.component;
			this.component = null;
			this.hasTemplate = false;

			this.setup = false;
			this.container = settings.container;
			this.persist = settings.persist;
			this.parent = settings.parent;

			this.setupTemplate();
		},

		/**
		 * This will create the component.
		 *
		 * @param {object} params
		 */
		focus: function(params)
		{
			if(this.setup === false)
			{
				this.create();
			}

			this.update(params);
		},

		/**
		 * This will setup the template.
		 * @protected
		 */
		setupTemplate: function()
		{
			var template = this.template;
			if(typeof template === 'string')
			{
				template = this.template = window[template];
				if(!template)
				{
					return;
				}
			}

			var type = typeof template;
			if(type === 'function')
			{
				this.component = new this.template({
					route: this.route,
					persist: this.persist,
					parent: this.parent
				});
			}
			else if(type === 'object')
			{
				if(!this.template.isUnit)
				{
					this.template = Jot(this.template);
				}

				var comp = this.component = this.template;
				var persist = (comp.persist !== false);

				comp.route = this.route;
				comp.persist = persist;
				comp.parent = this.parent;
				this.persist = persist;
			}

			this.hasTemplate = true;
		},

		/**
		 * This will create the route component.
		 * @protected
		 */
		create: function()
		{
			if(!this.hasTemplate)
			{
				return false;
			}

			this.setup = true;

			var comp = this.component;
			if(!this.persist || !comp)
			{
				comp = this.component = this.template;
			}

			comp.setup(this.container);
		},

		/**
		 * This will remove the component.
		 */
		remove: function()
		{
			if(this.setup !== true)
			{
				return false;
			}

			this.setup = false;

			var component = this.component;
			if(!component)
			{
				return false;
			}

			if(typeof component.destroy === 'function')
			{
				component.destroy();
			}

			// this will remove the reference to the component if persit is false
			if(this.persist === false)
			{
				this.component = null;
			}
		},

		/**
		 * This will call the component update method and pass the params.
		 *
		 * @protected
		 * @param {object} params
		 */
		update: function(params)
		{
			var component = this.component;
			if(!component)
			{
				return false;
			}

			if(typeof component.update === 'function')
			{
				component.update(params);
			}
		}
	});

	/**
	 * NavLink
	 *
	 * This will create a nav link that will add an active
	 * class when the browser route path matches the link
	 * href.
	 *
	 * @class
	 */
	var NavLink = base.Component.extend(
	{
		/**
		 * This will configure the link active class.
		 *
		 * @protected
		 */
		beforeSetup: function()
		{
			this.selectedClass = this.activeClass || 'active';
		},

		/**
		 * This will render the component.
		 *
		 * @return {object}
		 */
		render: function()
		{
			var href = this.href,
			text = this.text;

			var watchers = this.setupWatchers(href, text);

			var onState = {};
			onState[this.selectedClass] = true;

			return {
				tag: 'a',
				className: this.className || null,
				onState: ['selected', onState],
				href: this.getString(href),
				text: this.getString(text),
				children: this.children,
				watch: watchers
			};
		},

		/**
		 * This will get string.
		 *
		 * @param {string} string
		 * @return {(string|null)}
		 */
		getString: function(string)
		{
			var type = typeof string;
			return (type !== 'object' && type !== 'undefined')? string : null;
		},

		/**
		 * This will setup the watchers.
		 *
		 * @protected
		 * @param {string} href
		 * @param {string} text
		 * @return {array}
		 */
		setupWatchers: function(href, text)
		{
			var self = this,
			exact = (this.exact !== false),
			data = base.router.data;

			var watchers = [];

			if(href && typeof href === 'object')
			{
				watchers.push(
				{
					attr: 'href',
					value: href
				});
			}

			if(text && typeof text === 'object')
			{
				watchers.push(
				{
					attr: 'text',
					value: text
				});
			}

			watchers.push({
				value: ['[[path]]', data],
				callBack: function(ele, value)
				{
					var selected = exact? (value === ele.pathname) : (new RegExp('^' + ele.pathname + '($|\/|\\.).*').test(value));
					self.update(ele, selected);
				}
			});

			return watchers;
		},

		setupStates: function()
		{
			return {
				selected: false
			};
		},

		/**
		 * This will update the class on the element.
		 *
		 * @param {object} ele
		 * @param {bool} selected
		 */
		update: function(ele, selected)
		{
			this.state.set('selected', selected);
		}
	});

	window.NavLink = NavLink;

	base.router = new Router();
	base.extend.Router = Router;
})();