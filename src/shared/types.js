/**
 * Types
 *
 * Utility class for working with variable types.
 *
 * @module
 * @name Types
 */
export class Types
{
	/**
	 * Gets the type of a variable.
	 *
	 * @param {*} data - The data whose type is to be determined.
	 * @returns {string} The type of the variable ('undefined', 'object', 'function', 'array', etc.).
	 */
	static getType(data)
	{
		const type = typeof data;
		if (type !== "object")
		{
			return type;
		}

		return Array.isArray(data) ? "array" : "object"; // Directly check for array type.
	}

	/**
	 * Checks if a value is undefined.
	 *
	 * @param {*} data - The data to check.
	 * @returns {boolean} True if the data is undefined.
	 */
	static isUndefined(data)
	{
		return typeof data === "undefined";
	}

	/**
	 * Checks if a value is an object (excluding arrays).
	 *
	 * @param {*} data - The data to check.
	 * @returns {boolean} True if the data is a plain object.
	 */
	static isObject(data)
	{
		return data !== null && typeof data === "object" && !Array.isArray(data);
	}

	/**
	 * Checks if a value is a function.
	 *
	 * @param {*} data - The data to check.
	 * @returns {boolean} True if the data is a function.
	 */
	static isFunction(data)
	{
		return typeof data === "function";
	}

	/**
	 * Checks if a value is a string.
	 *
	 * @param {*} data - The data to check.
	 * @returns {boolean} True if the data is a string.
	 */
	static isString(data)
	{
		return typeof data === "string";
	}

	/**
	 * Checks if a value is an array.
	 *
	 * @param {*} data - The data to check.
	 * @returns {boolean} True if the data is an array.
	 */
	static isArray(data)
	{
		return Array.isArray(data);
	}
}