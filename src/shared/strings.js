/**
 * This will limit the length of a string.
 *
 * @param {string} str
 * @returns {string}
 */
const LimitString = (str) =>
{
	if (typeof str !== 'string')
	{
		return '';
	}

	// We will limit the length of the string.
	const MAX_LENGTH = 1000;
	return str.substring(0, MAX_LENGTH);
};

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
	 * @returns {object}
	 */
	static parseQueryString(str, decode)
	{
		if (typeof str !== 'string')
		{
			str = window.location.search;
		}

		str = LimitString(str);

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
	 * This will camelCase a string.
	 *
	 * @param {string} str
	 * @returns {string} The string or false.
	 */
	static camelCase(str)
	{
		str = LimitString(str);

		const regExp = /(-|\s|_)+\w{1}/g;
		return str.replace(regExp, (match) =>  match[1].toUpperCase());
	}

	/**
	 * This will uncamel-case a string.
	 *
	 * @param {string} str
	 * @param {string} delimiter
	 * @returns {string} The string.
	 */
	static uncamelCase(str, delimiter = '-')
	{
		str = LimitString(str);

		const regExp = /([A-Z]{1,})/g;
		return str.replace(regExp, (match) => delimiter + match.toLowerCase()).toLowerCase();
	}
}