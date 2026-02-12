import { DataUtils as utils } from './data-utils.js';

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
		for (var i = 0; i < length; i++)
		{
			prop = props[i];

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

			var publish;
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
				var nextProp = props[i + 1];
				if (isNaN(nextProp) === false)
				{
					path += '[' + nextProp + ']';
					continue;
				}

				var nextAttr = {};
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
	 * @returns {void}
	 */
	static publish(pathString, obj, callBack)
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

		if (Array.isArray(obj))
		{
			this.publishArray(pathString, obj, callBack);
            return;
		}

        this.publishObject(pathString, obj, callBack);
	}

    /**
     * This will publish an array to the data binder.
     *
     * @protected
     * @param {string} pathString
     * @param {Array<any>} obj
     * @param {function} callBack
     * @returns {void}
     */
    static publishArray(pathString, obj, callBack)
    {
        let subPath, value;
        const length = obj.length;
        for (var i = 0; i < length; i++)
        {
            value = obj[i];
            subPath = pathString + '[' + i + ']';
            this._checkPublish(subPath, value, callBack);
        }
    }

    /**
     * This will publish an object to the data binder.
     *
     * @protected
     * @param {string} pathString
     * @param {object} obj
     * @param {function} callBack
     * @returns {void}
     */
    static publishObject(pathString, obj, callBack)
    {
        let subPath, value;
        for (var prop in obj)
        {
            if (!Object.prototype.hasOwnProperty.call(obj, prop))
            {
                continue;
            }

            value = obj[prop];
            subPath = pathString + '.' + prop;
            this._checkPublish(subPath, value, callBack);
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
	 * @returns {void}
	 */
	static _checkPublish(subPath, val, callBack)
	{
		if (!val || typeof val !== 'object')
		{
			callBack(subPath, val);
            return;
		}

        this.publish(subPath, val, callBack);
	}
}