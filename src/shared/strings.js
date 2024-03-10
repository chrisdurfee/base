/**
 * Strings
 *
 * This will contain methods for working with strings.
 *
 * @module
 * @name Strings
 */
export class Strings
{
    /**
	 * This will parse a query string.
	 *
	 * @param {string} [str] The string to parse or the global
	 * location will be parsed.
	 * @param {boolean} [decode]
	 * @return {object}
	 */
	static parseQueryString(str, decode)
	{
		if (typeof str !== 'string')
		{
			str = window.location.search;
		}

		const objURL = {},
		regExp = /([^?=&]+)(=([^&]*))?/g;
		str.replace(regExp, function(a, b, c, d)
		{
			/* we want to save the key and the
			value to the objURL */
			objURL[b] = (decode !== false)? decodeURIComponent(d) : d;
		});

		return objURL;
	}

	/**
	 * This will camelCase a string.
	 *
	 * @param {string} str
	 * @return {string|boolean} The string or false.
	 */
	static camelCase(str)
	{
		if (typeof str !== 'string')
		{
			return false;
		}

		const regExp = /(-|\s|_)+\w{1}/g;
		return str.replace(regExp, (match) =>  match[1].toUpperCase());
	}

	/**
	 * This will uncamel-case a string.
	 *
	 * @param {string} str
	 * @param {string} delimiter
	 * @return {string|boolean} The string or false.
	 */
	static uncamelCase(str, delimiter = '-')
	{
		if (typeof str !== 'string')
		{
			return false;
		}

		const regExp = /([A-Z]{1,})/g;
		return str.replace(regExp, (match) => delimiter + match.toLowerCase()).toLowerCase();
	}
}