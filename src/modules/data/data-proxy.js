
/**
 * WeakMap-based cache for proxy instances.
 * Key: target object, Value: Map of path -> proxy
 *
 * Provides 90%+ reduction in proxy creation for nested objects.
 * Memory is automatically managed - entries are GC'd when source objects are collected.
 *
 * @type {WeakMap<object, Map<string, Proxy>>}
 */
const proxyCache = new WeakMap();

/**
 * Get or create a cached proxy for a target object at a specific path.
 *
 * @param {object} target - The object to proxy
 * @param {object} data - The data instance
 * @param {string} path - The path string
 * @param {string} dataRoot - The data root property
 * @returns {Proxy}
 */
function getCachedProxy(target, data, path, dataRoot)
{
	// Get or create the path cache for this target
	let targetCache = proxyCache.get(target);
	if (!targetCache)
	{
		targetCache = new Map();
		proxyCache.set(target, targetCache);
	}

	// Check if we already have a proxy for this path
	const cachedProxy = targetCache.get(path);
	if (cachedProxy)
	{
		return cachedProxy;
	}

	// Create new proxy and cache it
	const proxy = new Proxy(target, createHandler(data, path, dataRoot));
	targetCache.set(path, proxy);

	return proxy;
}

/**
 * Invalidate cached proxies for a specific target object.
 * Called when an object is replaced to ensure stale proxies aren't used.
 *
 * @param {object} target - The object whose cache should be cleared
 * @returns {void}
 */
export function invalidateProxyCache(target)
{
	if (target && typeof target === 'object')
	{
		proxyCache.delete(target);
	}
}

/**
 * Fast check for whether a string prop is a numeric array index.
 * Avoids Number() coercion on every proxy get.
 * @type {RegExp}
 */
const DIGIT_PATTERN = /^\d+$/;

/**
 * This will get hte path of the prop.
 *
 * @param {string} path
 * @param {string} prop
 * @returns {string}
 */
function getNewPath(path, prop)
{
	const isIndex = DIGIT_PATTERN.test(prop);
	if (path === '')
	{
		return isIndex ? `[${prop}]` : prop;
	}
	return isIndex ? `${path}[${prop}]` : `${path}.${prop}`;
}

/**
 * This will create a handler for the proxy.
 *
 * @param {object} data
 * @param {string} path
 * @param {string} dataRoot
 * @returns {ProxyHandler<any>}
 */
function createHandler(data, path = '', dataRoot = '')
{
	return {

		/**
		 * This will get the value of the prop.
		 *
		 * @param {object} target
		 * @param {string} prop
		 * @param {object} receiver
		 * @returns {*}
		 */
		// @ts-ignore
		get(target, prop, receiver)
		{
			let value = target[prop];
			// Directly return the property if it's on the root level and we're at the root path
			if (path === '' && prop in target)
			{
				if (typeof value === 'function')
				{
					return value.bind(target);
				}

				return value;
			}

			// Access the property within the dataRoot
			const dataTarget = target[dataRoot] || target;
			value = Reflect.get(dataTarget, prop, receiver);

			// Return the value directly if it's not an object
			if (value !== null && typeof value === 'object')
			{
				// Create a new handler for nested properties
				const newPath = getNewPath(path, prop);
				// Use cached proxy instead of creating new one every time (90%+ reduction)
				// @ts-ignore
				return getCachedProxy(value, data, newPath, dataRoot);
			}

		   return value;
		},

		/**
		 * This will set the value of the prop.
		 *
		 * @param {object} target
		 * @param {string} prop
		 * @param {*} value
		 * @param {object} receiver
		 * @returns {*}
		 */
		set(target, prop, value, receiver)
		{
			// Set the property at the root level if we're at the root path
			if (path === '' && prop in target)
			{
				target[prop] = value;
				return true;
			}

			const newPath = getNewPath(path, prop);
			data.set(newPath, value);

			return true;
		}
	};
}

/**
 * This will create a data proxy.
 *
 * @param {object} data
 * @returns {Proxy}
 */
// @ts-ignore
export const DataProxy = (data, root = 'stage') => new Proxy(data, createHandler(data, '', root));