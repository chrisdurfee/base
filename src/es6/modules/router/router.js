import {base} from '../../core.js';
import {Data} from '../data/data.js';
export {NavLink} from './nav-link.js';
import {Utils} from './utils.js';
import {Route} from './route.js';
import {History} from './history.js';

/* this will register the route system to the
data tracker to remove routes that have been
nested in layouts. */
base.dataTracker.addType('routes', (data) =>
{
	if(!data)
	{
		return false;
	}

	const route = data.route;
	if(route)
	{
		router.removeRoute(route);
	}
});

base.dataTracker.addType('switch', (data) =>
{
	if(!data)
	{
		return false;
	}

	let id = data.id;
	router.removeSwitch(id);
});

/**
 * Router
 *
 * This will create a browser router.
 * @class
 */
export class Router
{
	constructor()
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
		this.data = new Data(
		{
			path: this.location.pathname
		});
	}

	/**
	 * This will setup our history object.
	 */
	setupHistory()
	{
		this.history = new History(this);
		this.history.setup();
	}

	/**
	 * This will create a new route.
	 *
	 * @protected
	 * @param {object} settings
	 * @return {object}
	 */
	createRoute(settings)
	{
		let uri = settings.uri || '*';
		settings.baseUri = this.createURI(uri);

		let route = new Route(settings);
		return route;
	}

	/**
	 * This will add a new route to the router.
	 *
	 * @param {object} settings
	 * @return {object}
	 */
	add(settings)
	{
		if(typeof settings !== 'object')
		{
			let args = arguments;
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

		const route = this.createRoute(settings);
		this.routes.push(route);
		this.checkRoute(route, this.location.pathname);
		return route;
	}

	/**
	 * This will get the base path.
	 *
	 * @protected
	 * @return {string}
	 */
	getBasePath()
	{
		if(!this.basePath)
		{
			let pathURI = this.baseURI || '';
			if((pathURI[pathURI.length - 1] !== '/'))
			{
				pathURI += '/';
			}
			this.basePath = pathURI;
		}
		return this.basePath;
	}

	/**
	 * This will create a uri.
	 *
	 * @protected
	 * @param {string} uri
	 * @return {string}
	 */
	createURI(uri)
	{
		let baseUri = this.getBasePath();
		return (baseUri + Utils.removeSlashes(uri));
	}

	/**
	 * This will get a route by uri.
	 *
	 * @param {string} uri
	 * @return {(object|boolean)}
	 */
	getRoute(uri)
	{
		let routes = this.routes,
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
	}

	/**
	 * This will get a route by id.
	 *
	 * @param {string} id
	 * @return {(object|boolean)}
	 */
	getRouteById(id)
	{
		let routes = this.routes,
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
	}

	/**
	 * This will remove a route.
	 *
	 * @param {object} route
	 */
	removeRoute(route)
	{
		let routes = this.routes,
		index = routes.indexOf(route);
		if(index > -1)
		{
			routes.splice(index, 1);
		}
	}

	/**
	 * This will add a switch.
	 *
	 * @param {array} group
	 * @return {string} the switch id.
	 */
	addSwitch(group)
	{
		let switches = this.switches,
		id = this.switchCount++,
		switchArray = switches[id] = [];

		for(var i = 0, length = group.length; i < length; i++)
		{
			var route = this.createRoute(group[i]);
			switchArray.push(route);
		}

		this.checkGroup(switchArray, this.location.pathname);
		return id;
	}

	/**
	 * This will remove a switch by id.
	 *
	 * @param {string} id
	 */
	removeSwitch(id)
	{
		let switches = this.switches;
		if(switches[id])
		{
			delete switches[id];
		}
	}

	/**
	 * This will remove a route by uri.
	 *
	 * @param {string} uri
	 * @return {object} a reference to the router object.
	 */
	remove(uri)
	{
		uri = this.createURI(uri);

		let route = this.getRoute(uri);
		if(route !== false)
		{
			this.removeRoute(route);
		}
		return this;
	}

	/**
	 * This will setup the router.
	 *
	 * @param {string} [baseURI]
	 * @param {string} [title]
	 * @return {object} a reference to the router object.
	 */
	setup(baseURI, title)
	{
		this.baseURI = baseURI || '/';
		this.title = (typeof title !== 'undefined')? title : '';

		this.setupHistory();

		this.callBackLink = this.checkLink.bind(this);
		base.on('click', document, this.callBackLink);

		/* this will route to the first url entered
		when the router loads. this will fix the issue
		that stopped the first endpoint from being
		added to the history */
		let endPoint = this.getEndPoint();
		this.navigate(endPoint, null, true);
		return this;
	}

	/**
	 * This will get the parent element link.
	 *
	 * @param {object} ele
	 * @return {(object|boolean)}
	 */
	getParentLink(ele)
	{
		let target = ele.parentNode;
		while(target !== null)
		{
			if(target.nodeName.toLowerCase() === 'a')
			{
				return target;
			}

			target = target.parentNode;
		}
		return false;
	}

	/**
	 * This will check if a link was routed.
	 *
	 * @protected
	 * @param {object} evt
	 */
	checkLink(evt)
	{
		let target = evt.target || evt.srcElement;
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

		let href = target.getAttribute('href');
		if(typeof href !== 'undefined')
		{
			let baseUri = this.baseURI,
			path = (baseUri !== '/')? href.replace(baseUri, '') : href;
			this.navigate(path);

			evt.preventDefault();
			evt.stopPropagation();
			return false;
		}
	}

	/**
	 * This will reset the router.
	 *
	 * @return {object} a reference to the router object.
	 */
	reset()
	{
		this.routes = [];
		this.switches = [];
		this.switchCount = 0;

		return this;
	}

	/**
	 * This will check the active routes.
	 *
	 * @return {object} a reference to the router object.
	 */
	activate()
	{
		this.checkActiveRoutes();
		return this;
	}

	/**
	 * This will navigate the router.
	 *
	 * @param {string} uri
	 * @param {object} [data]
	 * @param {boolean} [replace]
	 * @return {object} a reference to the router object.
	 */
	navigate(uri, data, replace)
	{
		uri = this.createURI(uri);
		this.history.addState(uri, data, replace);
		this.activate();

		return this;
	}

	/**
	 * This will update the data path.
	 * @protected
	 */
	updatePath()
	{
		let path = this.location.pathname;
		this.data.set('path', path);
	}

	/**
	 * This will update the title.
	 *
	 * @protected
	 * @param {object} route
	 */
	updateTitle(route)
	{
		if(!route || !route.title)
		{
			return this;
		}

		let getTitle = (title) =>
		{
			/* this will uppercase each word in a string
			@param (string) str = the string to uppercase
			@return (string) the uppercase string */
			let toTitleCase = (str) =>
			{
				let pattern = /\w\S*/;
				return str.replace(pattern, (txt) =>
				{
					return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
				});
			};


			/* this will replace the params in the title
			@param (string) str = the route title
			@return (string) the title string */
			let replaceParams = (str) =>
			{
				if(str.indexOf(':') > -1)
				{
					let params = route.stage;
					for(var prop in params)
					{
						if(params.hasOwnProperty(prop))
						{
							var param = params[prop],
							pattern = new RegExp(':' + prop, 'gi');
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
				let pattern = /-/g;
				title = toTitleCase(title.replace(pattern, ' '));

				/* we want to check to add the base title to the
				to the end of the title */
				if(this.title !== '')
				{
					title += " - " + this.title;
				}
			}
			return title;
		};

		let title = route.title;
		document.title = getTitle(title);
	}

	/**
	 * This will check the routes to match the path.
	 *
	 * @protected
	 * @param {string} [path]
	 */
	checkActiveRoutes(path)
	{
		this.lastPath = path;

		path = path || this.getPath();
		this.path = path;

		let routes = this.routes,
		length = routes.length;

		let route;
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
	}

	/**
	 * This will check the switches to match the path.
	 *
	 * @protected
	 * @param {string} [path]
	 */
	checkSwitches(path)
	{
		let switches = this.switches;
		for(var id in switches)
		{
			if(switches.hasOwnProperty(id) === false)
			{
				continue;
			}

			var group = switches[id];
			this.checkGroup(group, path);
		}
	}

	/**
	 * This will check a group to match a path.
	 *
	 * @protected
	 * @param {object} group
	 * @param {string} path
	 */
	checkGroup(group, path)
	{
		let check = false,
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
	}

	/**
	 * This will check if a route matches the path.
	 *
	 * @param {object} route
	 * @param {string} path
	 * @return {boolean}
	 */
	checkRoute(route, path)
	{
		let check = this.check(route, path);
		if(check !== false)
		{
			this.select(route);
		}
		else
		{
			route.deactivate();
		}
		return check;
	}

	/**
	 * This will select a route if the route matches the path.
	 *
	 * @param {object} route
	 * @param {string} [path]
	 */
	check(route, path)
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
	}

	/**
	 * This will select the route.
	 *
	 * @param {object} route
	 */
	select(route)
	{
		if(!route)
		{
			return false;
		}

		route.setPath(this.path, this.lastPath);
		route.select();
		this.updateTitle(route);
	}

	/**
	 * This will get the endpoint.
	 *
	 * @return {string}
	 */
	getEndPoint()
	{
		let path = this.getPath();
		return (path.replace(this.baseURI, '') || '/');
	}

	/**
	 * This will remove the router events.
	 */
	destroy()
	{
		base.off('click', document, this.callBackLink);
	}

	/**
	 * This will get the location pathname.
	 *
	 * @return {string}
	 */
	getPath()
	{
		/* we want to get the window location path */
		let location = this.location,
		path = this.path = location.pathname;

		return path + location.search + location.hash;
	}
}

export const router = new Router();