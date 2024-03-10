/**
 * Types
 *
 * This will contain methods for working with types.
 *
 * @module
 * @name Types
 */
export class Types
{
    /**
	 * This will get the type of a variable.
	 *
	 * @param {*} data
	 * @returns {string}
	 */
	static getType(data)
	{
		const type = typeof data;
		if (type !== 'object')
		{
			return type;
		}

		return (this.isArray(data))? 'array' : type;
	}

	/**
	 * This will check if a request is undefined.
	 *
	 * @param {*} data
	 * @returns {boolean}
	 */
	static isUndefined(data)
	{
		return (typeof data === 'undefined');
	}

	/**
	 * This will check if the request is an object.
     *
	 * @param {object} obj
	 * @returns {boolean}
	 */
	static isObject(obj)
	{
		return (obj && typeof obj === 'object' && this.isArray(obj) === false);
	}

	/**
	 * This will check if the request is an object.
	 *
	 * @param {object} obj
	 * @returns {boolean}
	 */
	static isFunction(obj)
	{
		return (typeof obj === 'function');
	}

	/**
	 * This will check if the request is an object.
     *
	 * @param {object} obj
	 * @returns {boolean}
	 */
	static isString(obj)
	{
		return (typeof obj === 'string');
	}

    /**
	 * This will check if the data is an array.
     *
	 * @param {*} data
	 * @returns {boolean}
	 */
	static isArray(data)
	{
		return Array.isArray(data);
	}
}