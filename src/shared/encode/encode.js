import { Objects } from "../objects.js";
import { decode, encode, prepareUrl } from "./json.js";

/**
 * Encode
 *
 * This will contain methods for working with encoding.
 *
 * @module
 * @name Encode
 */
export class Encode
{
    /**
	 * This will prepare a json object to be used in an
	 * xhr request. This will sanitize the object values
	 * by encoding them to not break the param string.
	 *
	 * @param {object} obj
	 * @param {boolean} [removeNewLines]
	 * @returns {string}
	 */
	static prepareJsonUrl(obj, removeNewLines = false)
	{
		/* we want to check to clone object so we won't modify the
		original object */
		const before = (typeof obj === 'object')? Objects.clone(obj) : obj,
		after = prepareUrl(before, removeNewLines);
		return encode(after);
	}

	/**
	 * This will encode and decode json data.
	 *
	 * @member {object} json
	 */
	static json = {
		encode,
		decode,
	};

	/**
	 * This will parse xml data.
	 *
	 * @param {string} data
	 * @returns {object}
	 */
	static xmlParse(data)
	{
		if (typeof data === "undefined")
		{
			return false;
		}

		const parser = new DOMParser();
		return parser.parseFromString(data, "text/xml");
	}
}