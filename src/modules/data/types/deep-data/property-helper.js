import { DataUtils as utils } from './data-utils.js';

/**
 * PropertyHelper
 *
 * This will help get, set, and delete properties from a data object.
 *
 * @class
 */
export class PropertyHelper
{
	/**
	 * This will set the attribute value.
	 *
	 * @static
	 * @param {object} obj
	 * @param {string} attr
	 * @param {*} val
	 * @returns {void}
	 */
	static set(obj, attr, val)
	{
		/* this will check if we need to update
		deep nested data */
		if (!utils.hasDeepData(attr))
		{
			obj[attr] = val;
			return;
		}

		let prop,
		props = utils.getSegments(attr),
		length = props.length,
		end = length - 1;

		for (var i = 0; i < length; i++)
		{
			prop = props[i];

			/* this will add the value to the last prop */
			if (i === end)
			{
				obj[prop] = val;
				break;
			}

			if (obj[prop] === undefined)
			{
				/* this will check to setup a new object
				or an array if the prop is a number */
				obj[prop] = isNaN(prop)? {} : [];
			}
			obj = obj[prop];
		}
	}

	/**
	 * This will delete an attribute.
	 *
	 * @static
	 * @param {object} obj
	 * @param {string} attr
	 * @returns {void}
	 */
	static delete(obj, attr)
	{
		if (!utils.hasDeepData(attr))
		{
			delete obj[attr];
			return;
		}

		const props = utils.getSegments(attr),
		length = props.length,
		end = length - 1;

		for (var i = 0; i < length; i++)
		{
			var prop = props[i];
			var propValue = obj[prop];
			if (propValue === undefined)
			{
				break;
			}

			if (i === end)
			{
				if (Array.isArray(obj))
				{
					obj.splice(prop, 1);
					break;
				}

				delete obj[prop];
				break;
			}
			obj = propValue;
		}
	}

	/**
	 * This will get the value of an attribute.
	 *
	 * @static
	 * @param {object} obj
	 * @param {string} attr
	 * @returns {*}
	 */
	static get(obj, attr)
	{
		if (!utils.hasDeepData(attr))
		{
			return obj[attr];
		}

		const props = utils.getSegments(attr),
		length = props.length,
		end = length - 1;

		for (var i = 0; i < length; i++)
		{
			var prop = props[i];
			var propValue = obj[prop];
			if (propValue === undefined)
			{
				break;
			}

			obj = propValue;

			if (i === end)
			{
				return obj;
			}
		}

		return undefined;
	}
}