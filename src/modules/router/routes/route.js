import { DataProxy } from '../../data/data-proxy.js';
import { BasicData } from '../../data/types/basic-data.js';
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
 * Parses route URI activation conditions.
 *
 * Supported condition forms:
 * - '#{section}' requires hash to equal 'section'
 * - '?key=value&mode=edit' requires query params to match
 *
 * If URI only contains conditions (no path), the route path matcher falls back to '*'.
 *
 * @param {string} uri
 * @param {string} [rawUri]
 * @returns {{
 *  uriPath: string,
 *  requiredHash: string|null,
 *  requiredQuery: Array<{key: string, value: string}>,
 *  hasConditions: boolean
 * }}
 */
const parseRouteUriConditions = (uri, rawUri = '') =>
{
	let uriPath = uri || '';
	let rawPath = (typeof rawUri === 'string' && rawUri)? rawUri : uriPath;
	let requiredHash = null;
	/**
	 * @type {Array<{key: string, value: string}>}
	 */
	const requiredQuery = [];

	const hashMatch = rawPath.match(/#\{([^}]+)\}/);
	if (hashMatch && hashMatch[1])
	{
		requiredHash = hashMatch[1].trim();
		rawPath = rawPath.replace(hashMatch[0], '');
		uriPath = uriPath.replace(hashMatch[0], '');
	}

	const queryIndex = rawPath.indexOf('?');
	if (queryIndex > -1)
	{
		const queryText = rawPath.substring(queryIndex + 1);
		if (queryText.indexOf('=') > -1)
		{
			const pairs = queryText.split('&');
			for (let i = 0, length = pairs.length; i < length; i++)
			{
				const pair = pairs[i];
				if (!pair)
				{
					continue;
				}

				const [rawKey, rawValue = ''] = pair.split('=');
				const key = (rawKey || '').trim();
				if (!key)
				{
					continue;
				}

				requiredQuery.push(
				{
					key,
					value: (rawValue || '').trim()
				});
			}

			rawPath = rawPath.substring(0, queryIndex);
			const uriPathQueryIndex = uriPath.indexOf('?');
			if (uriPathQueryIndex > -1)
			{
				uriPath = uriPath.substring(0, uriPathQueryIndex);
			}
		}
	}

	const hasConditions = (requiredHash !== null || requiredQuery.length > 0);
	const isConditionOnly = hasConditions && !rawPath;
	if (isConditionOnly)
	{
		uriPath = '*';
	}

	return {
		uriPath,
		requiredHash,
		requiredQuery,
		hasConditions
	};
};

/**
 * Gets the path-only segment from a URI string.
 *
 * @param {string} path
 * @returns {string}
 */
const getPathOnly = (path) =>
{
	if (!path)
	{
		return '';
	}

	const queryIndex = path.indexOf('?');
	const hashIndex = path.indexOf('#');
	let end = path.length;

	if (queryIndex > -1)
	{
		end = queryIndex;
	}

	if (hashIndex > -1 && hashIndex < end)
	{
		end = hashIndex;
	}

	return path.substring(0, end);
};

/**
 * Gets the hash segment from a URI string without '#'.
 *
 * @param {string} path
 * @returns {string}
 */
const getHashOnly = (path) =>
{
	if (!path)
	{
		return '';
	}

	const hashIndex = path.indexOf('#');
	if (hashIndex === -1)
	{
		return '';
	}

	return path.substring(hashIndex + 1);
};

/**
 * Gets the query segment from a URI string without '?'.
 *
 * @param {string} path
 * @returns {string}
 */
const getQueryOnly = (path) =>
{
	if (!path)
	{
		return '';
	}

	const queryIndex = path.indexOf('?');
	if (queryIndex === -1)
	{
		return '';
	}

	const hashIndex = path.indexOf('#', queryIndex);
	if (hashIndex === -1)
	{
		return path.substring(queryIndex + 1);
	}

	return path.substring(queryIndex + 1, hashIndex);
};

/**
 * Route
 *
 * This will create a route.
 *
 * @class
 * @augments BasicData
 */
export class Route extends BasicData
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
		const parsed = parseRouteUriConditions(uri, settings.rawUri);
		const matchUri = parsed.uriPath;

		const paramKeys = paramPattern(matchUri);
		const params = getParamDefaults(paramKeys);
		const proxy = super(params);

		this.uri = uri;
		this.matchUri = matchUri;
		this.paramKeys = paramKeys;
		this.titleCallBack = titleCallBack;

		this.setupRoute(settings);
		this.set('active', false);

		// @ts-ignore
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
		this.routeId = null;
		this.uri = null;
		this.rawUri = null;
		this.matchUri = '';
		this.uriQuery = /$^/;
		this.controller = null;
		this.paramKeys = [];
		this.requiredHash = null;
		this.requiredQuery = [];
		this.hasConditions = false;
		this.titleCallBack = () => {};
		this.path = null;
		this.referralPath = null;
		this.params = null;
		this.callBack = null;
		this.title = null;
		this.preventScroll = false;
		this.scrollTo = null;
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
		this.routeId = settings.id || 'bs-rte-' + routeCount++;
		this.rawUri = settings.rawUri || null;

		this.path = null;
		this.referralPath = null;

		const parsed = parseRouteUriConditions(this.uri, this.rawUri || '');
		this.matchUri = parsed.uriPath;
		this.requiredHash = parsed.requiredHash;
		this.requiredQuery = parsed.requiredQuery;
		this.hasConditions = parsed.hasConditions;

		/* route reg ex */
		let uriMatch = routePattern(this.matchUri);
		this.uriQuery = new RegExp('^' + uriMatch);

		/* params */
		this.params = null;

		/* this will setup the template and route component
		if one has been set */
		this.setupComponentHelper(settings);

		this.callBack = settings.callBack;
		this.title = settings.title;
		this.preventScroll = settings.preventScroll || false;
		this.scrollTo = settings.scrollTo || null;
	}

	/**
	 * This will update the route title.
	 *
	 * @param {string|function} title
	 * @returns {void}
	 */
	setTitle(title)
	{
		this.title = title;
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

		const {container, persist, parent} = settings;
		const helperSettings =
		{
			component,
			container,
			persist,
			parent
		};

		const proxy = DataProxy(this);
		this.controller = new ComponentHelper(proxy, helperSettings);
	}

	/**
	 * This will resume the route.
	 *
	 * @param {object} container
	 * @returns {void}
	 */
	resumeRoute(container)
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
	 * @returns {object|boolean}
	 */
	match(path)
	{
		/**
		 * @type {boolean|array}
		 */
		let matched = false;

		/**
		 * The query string and hash are never part of the route
		 * pattern, so they are always stripped before matching.
		 * Exact-end patterns (e.g. `^/app/$`) would otherwise fail
		 * on paths like `/app/?utm=x` or `/app/#section`, which
		 * breaks popstate re-matching of history entries that
		 * carry a query or hash. Required query/hash conditions
		 * are still validated by matchConditions below.
		 */
		// @ts-ignore
		const pathToMatch = getPathOnly(path);
		const uriQuery = this.uriQuery || /$^/;
		const result = pathToMatch.match(uriQuery);
		if (result === null)
		{
			this.resetParams();
			return matched;
		}

		if (!Array.isArray(result))
		{
			return matched;
		}

		if (!this.matchConditions(path))
		{
			this.resetParams();
			return false;
		}

		/**
		 * This will get the uri params of the route
		 * and if set will save them to the route.
		 * We skip index 0 (the full match) and only use capture groups.
		 */
		this.setParams(result, 1);
		matched = result;
		return matched;
	}

	/**
	 * Checks query/hash route conditions.
	 *
	 * @param {string} path
	 * @returns {boolean}
	 */
	matchConditions(path)
	{
		if (!this.hasConditions)
		{
			return true;
		}

		if (this.requiredHash !== null)
		{
			const hashValue = getHashOnly(path);
			if (hashValue !== this.requiredHash)
			{
				return false;
			}
		}

		const requiredQuery = this.requiredQuery || [];
		if (requiredQuery.length > 0)
		{
			const query = getQueryOnly(path);
			if (!query)
			{
				return false;
			}

			const queryParams = new URLSearchParams(query);
			for (let i = 0, length = requiredQuery.length; i < length; i++)
			{
				const check = requiredQuery[i];
				if (!queryParams.has(check.key))
				{
					return false;
				}

				if (queryParams.get(check.key) !== check.value)
				{
					return false;
				}
			}
		}

		return true;
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
	setParams(values, offset = 0)
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
		for (let i = 0, length = keys.length; i < length; i++)
		{
			const key = keys[i];
			if (typeof key !== 'undefined')
			{
				params[key] = values[i + offset];
			}
		}
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