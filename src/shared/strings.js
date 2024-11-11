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
	 * This will limit the length of a string.
	 *
	 * @param {string} str
	 * @param {number} [maxLength]
	 * @returns {string}
	 */
	static limit(str, maxLength = 1000)
	{
		if (typeof str !== 'string')
		{
			return '';
		}

		return str.substring(0, maxLength);
	}

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
	 * This will camelCase a string.
	 *
	 * @param {string} str
	 * @returns {string} The string or false.
	 */
	static camelCase(str)
	{
		str = this.limit(str);

		const regExp = /(-|\s|_)+\w{1}/g;
		return str.replace(regExp, (match) =>  match[1].toUpperCase());
	}

	/**
	 * This will uncamel-case a string.
	 *
	 * @param {string} str
	 * @param {string} [delimiter]
	 * @returns {string} The string.
	 */
	static uncamelCase(str, delimiter = '-')
	{
		str = this.limit(str);

		const regExp = /([A-Z]{1,})/g;
		return str.replace(regExp, (match) => delimiter + match.toLowerCase()).toLowerCase();
	}

	/**
	 * This will title case a string.
	 *
	 * @param {string} str
	 * @returns {string} The string.
	 */
	static titleCase(str)
	{
		if (!str)
		{
			return '';
		}

		str = this.limit(str);

		const pattern = /\w\S*/;
		return str.replace(pattern, (txt) =>
		{
			return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
		});
	}
}