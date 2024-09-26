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
	 * @param {*} data
	 * @returns {boolean}
	 */
	static isObject(data)
	{
		return (data && typeof data === 'object' && this.isArray(data) === false);
	}

	/**
	 * This will check if the request is a function.
	 *
	 * @param {*} data
	 * @returns {boolean}
	 */
	static isFunction(data)
	{
		return (typeof data === 'function');
	}

	/**
	 * This will check if the request is a string.
     *
	 * @param {*} data
	 * @returns {boolean}
	 */
	static isString(data)
	{
		return (typeof data === 'string');
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