import { SimpleData } from '../../data/data.js';
import { Import } from '../../import/import.js';
import { ComponentHelper } from './component-helper.js';
import { getParamDefaults, paramPattern } from './param-pattern.js';
import { routePattern } from './route-pattern.js';

/**
 * This will keep track of the route count.
 *
 * @type {number}
 */
let routeCount = 0;

/**
 * Route
 *
 * This will create a route.
 *
 * @class
 * @augments SimpleData
 */
export class Route extends SimpleData
{
	/**
	 * This will create a route.
	 *
	 * @constructor
	 * @param {object} settings
	 * @param {function} titleCallBack
	 */
	constructor(settings, titleCallBack)
	{
		const uri = settings.baseUri;

		const paramKeys = paramPattern(uri);
		const params = getParamDefaults(paramKeys);
		const proxy = super(params);

		this.uri = uri;
		this.paramKeys = paramKeys;
		this.titleCallBack = titleCallBack;

		this.setupRoute(settings);
		this.set('active', false);
		return proxy;
	}

	/**
	 * This will setup the data object.
	 *
	 * @protected
	 * @returns {void}
	 */
	setup()
	{
		this.stage = {};
		this.id = null;
		this.uri = null;
		this.uriQuery = null;
		this.controller = null;
		this.paramKeys = null;
		this.titleCallBack = null;
		this.path = null;
		this.referralPath = null;
		this.params = null;
		this.callBack = null;
		this.title = null;
	}

	/**
	 * This will setup the route settings.
	 *
	 * @protected
	 * @param {object} settings
	 * @returns {void}
	 */
	setupRoute(settings)
	{
		this.id = settings.id || 'bs-rte-' + routeCount++;

		this.path = null;
		this.referralPath = null;

		/* route reg ex */
		let uriMatch = routePattern(this.uri);
		this.uriQuery = new RegExp('^' + uriMatch);

		/* params */
		this.params = null;

		/* this will setup the template and route component
		if one has been set */
		this.setupComponentHelper(settings);

		this.callBack = settings.callBack;
		this.title = settings.title;
	}

	/**
	 * This will update the route title.
	 *
	 * @param {string|function} title
	 * @returns {void}
	 */
	setTitle(title)
	{
		this.titleCallBack(this, title);
	}

	/**
	 * This will deactivate the route.
	 *
	 * @returns {void}
	 */
	deactivate()
	{
		this.set('active', false);

		const controller = this.controller;
		if (controller)
		{
			controller.remove();
		}
	}

	/**
	 * This will get the route layout.
	 *
	 * @param {object} settings
	 * @returns {object|null}
	 */
	getLayout(settings)
	{
		if (settings.component)
		{
			return settings.component;
		}

		let imported = settings.import;
		if (!imported)
		{
			return null;
		}

		if (typeof imported === 'string')
		{
			imported = {
				src: imported
			};
		}

		return Import(imported);
	}

	/**
	 * This will setup the route layout.
	 *
	 * @protected
	 * @param {object} settings
	 * @returns {void}
	 */
	setupComponentHelper(settings)
	{
		const component = this.getLayout(settings);
		if (!component)
		{
			return;
		}

		const {container, persist = false, parent} = settings;
		const helperSettings =
		{
			component,
			container,
			persist,
			parent
		};
		this.controller = new ComponentHelper(this, helperSettings);
	}

	/**
	 * This will resume the route.
	 *
	 * @param {object} container
	 * @returns {void}
	 */
	resume(container)
	{
		const controller = this.controller;
		if (controller)
		{
			controller.container = container;
		}
	}

	/**
	 * This will set the route path.
	 *
	 * @param {string} path
	 * @param {string} referralPath
	 * @returns {void}
	 */
	setPath(path, referralPath)
	{
		this.path = path;
		this.referralPath = referralPath;
	}

	/**
	 * This will select the route.
	 *
	 * @returns {void}
	 */
	select()
	{
		this.set('active', true);

		const params = this.stage,
		callBack = this.callBack;
		if (typeof callBack === 'function')
		{
			callBack(params);
		}

		const controller = this.controller;
		if (controller)
		{
			controller.focus(params);
		}

		const path = this.path;
		if (!path)
		{
			return;
		}

		const hash = path.split('#')[1];
		if (!hash)
		{
			return;
		}

		this.scrollToId(hash);
	}

	/**
	 * This will scroll to the element by id.
	 *
	 * @param {string} hash
	 * @returns {void}
	 */
	scrollToId(hash)
	{
		if (!hash)
		{
			return;
		}

		const ele = document.getElementById(hash);
		if (!ele)
		{
			return;
		}

		ele.scrollIntoView(true);
	}

	/**
	 * This will check if a route matches the path.
	 *
	 * @param {string} path
	 * @returns {(object|boolean)}
	 */
	match(path)
	{
		let matched = false;

		/**
		 * We want to check to use the supplied uri or get the
		 * current uri if not setup.
		 */
		const result = path.match(this.uriQuery);
		if (result === null)
		{
			this.resetParams();
			return matched;
		}

		if (!Array.isArray(result))
		{
			return matched;
		}

		/**
		 * This will remove the first match from the
		 * the params.
		 */
		result.shift();
		matched = result;

		/**
		 * This will get the uri params of the route
		 * and if set will save them to the route.
		 */
		this.setParams(result);
		return matched;
	}

	/**
	 * This will reset the params.
	 *
	 * @returns {void}
	 */
	resetParams()
	{
		this.stage = {};
	}

	/**
	 * This will set the params.
	 *
	 * @param {object} values
	 */
	setParams(values)
	{
		if (!Array.isArray(values))
		{
			return;
		}

		const keys = this.paramKeys;
		if (!keys)
		{
			return;
		}

		const params = {};
		keys.forEach((key, i) =>
		{
			if (typeof key !== 'undefined')
			{
				params[key] = values[i];
			}
		});
		this.set(params);
	}

	/**
	 * This will get the params.
	 *
	 * @returns {object}
	 */
	getParams()
	{
		return this.stage;
	}
}