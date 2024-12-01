import { Types } from "./types";

/**
 * Strings
 *
 * Contains utility methods for working with strings.
 *
 * @module
 * @name Strings
 */
export class Strings
{
	/**
	 * Limits the length of a string.
	 *
	 * @param {string} str - The string to limit.
	 * @param {number} [maxLength=1000] - The maximum length of the string.
	 * @returns {string} The truncated string.
	 */
	static limit(str, maxLength = 1000)
	{
		if (!Types.isString(str))
		{
			return "";
		}

		return str.slice(0, maxLength); // `slice` is more performant and concise.
	}

	/**
	 * Parses a query string into an object.
	 *
	 * @param {string} [str=window.location.search] - The string to parse.
	 * @param {boolean} [decode=true] - Whether to decode the query values.
	 * @returns {object} An object representing the query string parameters.
	 */
	static parseQueryString(str = window.location.search, decode = true)
	{
		str = this.limit(str);

		const objURL = {},
		regExp = /([^?=&]+)(=([^&]*))?/g;
		// @ts-ignore
		str.replace(regExp, function(a, b, c, d)
		{
			/* we want to save the key and the
			value to the objURL */
			objURL[b] = (decode !== false)? decodeURIComponent(d) : d;
		});

		return objURL;
	}

	/**
	 * Converts a string to camelCase.
	 *
	 * @param {string} str - The string to convert.
	 * @returns {string} The camelCased string.
	 */
	static camelCase(str)
	{
		str = this.limit(str);

		const regExp = /(?:^|-|\s|_)(\w)/g; // Simplified regex for better performance.
		return str.toLowerCase().replace(regExp, (_, char) => char.toUpperCase());
	}

	/**
	 * Converts a camelCase string to a delimited format.
	 *
	 * @param {string} str - The camelCase string.
	 * @param {string} [delimiter="-"] - The delimiter to use.
	 * @returns {string} The uncamelCased string.
	 */
	static uncamelCase(str, delimiter = "-")
	{
		str = this.limit(str);

		const regExp = /([a-z])([A-Z])/g;
		return str.replace(regExp, (_, lower, upper) => lower + delimiter + upper.toLowerCase()).toLowerCase();
	}

	/**
	 * Converts a string to Title Case.
	 *
	 * @param {string} str - The string to convert.
	 * @returns {string} The title-cased string.
	 */
	static titleCase(str)
	{
		if (!Types.isString(str))
		{
			return "";
		}

		str = this.limit(str);

		const regExp = /\b\w/g; // Simplified regex for first character of each word.
		return str.toLowerCase().replace(regExp, (char) => char.toUpperCase());
	}
}