import { DataUtils as utils } from './data-utils.js';

/**
 * Module-level WeakSet reused across publish calls to avoid
 * allocating a new WeakSet on every published object.
 * @type {WeakSet|null}
 */
let _seen = null;

/**
 * Publisher
 *
 * This will contain methods for publishing data.
 *
 * @class
 */
export class Publisher
{
	/**
	 * Depth limit for nested object publishing to prevent infinite recursion
	 * @type {number}
	 */
	static MAX_DEPTH = 50;

	/**
	 * This will publish deep data.
	 *
     * @param {object} obj
	 * @param {string} attr
	 * @param {*} val
     * @param {function} callBack
	 * @returns {void}
	 */
	static publishDeep(obj, attr, val, callBack)
	{
		if (!utils.hasDeepData(attr))
		{
			this.publish(attr, val, callBack);
			return;
		}

		let prop,
		props = utils.getSegments(attr);
		if (!props)
		{
			return;
		}

		const length = props.length,
		end = length - 1;

		/* the path is a string equivalent of the javascript dot notation path
		of the object being published. */
		let path = '';
		for (let i = 0; i < length; i++)
		{
			const prop = props[i];

			/* we need to setup the object to go to the next level
			of the data object before calling the next property. */
			obj = obj[prop];

			if (i > 0)
			{
				/* this will add the property to the path based on if its an
				object property or an array. */
				if (isNaN(prop))
				{
					path += '.' + prop;
				}
			}
			else
			{
				path = prop;
			}

			let publish;
			if (i === end)
			{
				/* if the loop is on the last pass it only needs to publish
				the val. */
				publish = val;
			}
			else
			{
				/* we only want to publish the modified branches. we need to
				get the next property in the props array and create a publish
				object or array with the next property value. */
				const nextProp = props[i + 1];
				if (isNaN(nextProp) === false)
				{
					path += '[' + nextProp + ']';
					continue;
				}

				const nextAttr = {};
				nextAttr[nextProp] = obj[nextProp];
				publish = nextAttr;
			}

			this.publish(path, publish, callBack);
		}
	}

	/**
	 * This will publish an update to the data binder.
	 *
	 * @param {string} pathString
	 * @param {*} obj
     * @param {function} callBack
	 * @param {?WeakSet} [seen] - Set of seen objects to detect circular refs
	 * @param {number} [depth] - Current recursion depth
	 * @returns {void}
	 */
	static publish(pathString, obj, callBack, seen = null, depth = 0)
	{
		/**
		 * This will publish the data path to get the
		 * root attr before publishing deeper.
		 */
		pathString = pathString || "";
		callBack(pathString, obj);

		if (!obj || typeof obj !== 'object')
		{
			return;
		}

		// On top-level call, reuse module-level WeakSet to avoid heap allocation
		const isTopLevel = (seen === null);
		if (isTopLevel)
		{
			if (!_seen)
			{
				_seen = new WeakSet();
			}
			seen = _seen;
		}

		// seen is guaranteed non-null at this point; guard satisfies TS flow analysis
		if (!seen) { return; }

		// Detect circular reference
		if (seen.has(obj))
		{
			console.warn('[Publisher] Circular reference detected at path:', pathString);
			if (isTopLevel) { _seen = null; }
			return;
		}

		// Depth limit to prevent infinite recursion
		if (depth >= this.MAX_DEPTH)
		{
			console.warn('[Publisher] Max depth exceeded at path:', pathString, '- stopping recursion');
			if (isTopLevel) { _seen = null; }
			return;
		}

		// Mark this object as seen
		seen.add(obj);

		if (Array.isArray(obj))
		{
			this.publishArray(pathString, obj, callBack, seen, depth);
		}
		else
		{
			this.publishObject(pathString, obj, callBack, seen, depth);
		}

		// Clear module-level WeakSet after top-level call completes
		if (isTopLevel)
		{
			_seen = null;
		}
	}

    /**
     * This will publish an array to the data binder.
     *
     * @protected
     * @param {string} pathString
     * @param {Array<any>} obj
     * @param {function} callBack
     * @param {WeakSet} seen - Set of seen objects
     * @param {number} depth - Current recursion depth
     * @returns {void}
     */
    static publishArray(pathString, obj, callBack, seen, depth)
    {
        const length = obj.length;
        for (let i = 0; i < length; i++)
        {
            const value = obj[i];
            const subPath = `${pathString}[${i}]`;
            this._checkPublish(subPath, value, callBack, seen, depth);
        }
    }

    /**
     * This will publish an object to the data binder.
     *
     * @protected
     * @param {string} pathString
     * @param {object} obj
     * @param {function} callBack
     * @param {WeakSet} seen - Set of seen objects
     * @param {number} depth - Current recursion depth
     * @returns {void}
     */
    static publishObject(pathString, obj, callBack, seen, depth)
    {
        for (const prop in obj)
        {
            if (!Object.prototype.hasOwnProperty.call(obj, prop))
            {
                continue;
            }
            const value = obj[prop];
            const subPath = `${pathString}.${prop}`;
            this._checkPublish(subPath, value, callBack, seen, depth);
        }
    }

	/**
	 * This will check if the value is an object and publish
	 * the value or the object.
	 *
	 * @protected
	 * @param {string} subPath
	 * @param {*} val
     * @param {function} callBack
     * @param {WeakSet} seen - Set of seen objects
     * @param {number} depth - Current recursion depth
	 * @returns {void}
	 */
	static _checkPublish(subPath, val, callBack, seen, depth)
	{
		if (!val || typeof val !== 'object')
		{
			callBack(subPath, val);
            return;
		}

        this.publish(subPath, val, callBack, seen, depth + 1);
	}
}