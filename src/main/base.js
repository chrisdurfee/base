/**
 * Base Framework
 * @version 3.6.0
 * @author Chris Durfee
 * @file This is a javascript framework to allow complex
 * functions to work in many browsers and versions.
 */

import { Arrays } from '../shared/arrays.js';
import { Objects } from '../shared/objects.js';
import { Types } from '../shared/types.js';
import { DataTracker } from './data-tracker/data-tracker.js';
import { equals } from './equals.js';
import { EventMethods } from './events/event-methods.js';

/**
 * Base
 *
 * This is the base framework.
 *
 * @class
 */
class Base
{
	/**
	 * This will create an instance of base.
	 *
	 * @constructor
	 */
	constructor()
	{
		/**
		 * @type {Array<any>} errors
		 */
		this.errors = [];

		/**
		 * @type {object} dataTracker
		 */
		this.dataTracker = DataTracker;
	}

	/**
	 * this will augement the base framework with new functionality.
	 *
	 * @param {object} methods The new methods to add.
	 * @returns {object} An instance of base.
	 */
	augment(methods)
	{
		if (!Types.isObject(methods))
		{
			return this;
		}

		const prototype = this.constructor.prototype;
		for (var property in methods)
		{
			if (Object.prototype.hasOwnProperty.call(methods, property))
			{
				// @ts-ignore
				prototype[property] = methods[property];
			}
		}
		return this;
	}

	/**
	 * This will override a method function with a new function.
	 *
	 * @param {object} obj The object being modified.
	 * @param {string} methodName the method name being overriden.
	 * @param {function} overrideMethod The new function to call.
	 * @param {Array<any>} args The args to pass to the first function call.
	 * @returns {*} The results of the function being called.
	 */
	override(obj, methodName, overrideMethod, args)
	{
		// @ts-ignore
		return (obj[methodName] = overrideMethod).apply(obj, Arrays.toArray(args));
	}

	/**
	 * This will get the last error.
	 *
	 * @returns {(object|boolean)} The last error or false.
	 */
	getLastError()
	{
		const errors = this.errors;
		return (errors.length)? errors.pop() : false;
	}

	/**
	 * This will add an error.
	 *
	 * @param {object} err
	 * @returns {void}
	 */
	addError(err)
	{
		this.errors.push(err);
	}

	/**
	 * This will get the value from a property on an object.
	 *
	 * @param {Record<string, any>} obj
	 * @param {string} property
	 * @param {*} [defaultText] A value if no value is set.
	 * @returns {string}
	 */
	getProperty(obj, property, defaultText)
	{
		if (Types.isObject(obj) === false)
		{
			return '';
		}

		const value = obj[property];
		if (typeof value !== 'undefined')
		{
			return value;
		}

		/* if no value was available
		we want to return an empty string */
		return (typeof defaultText !== 'undefined')? defaultText : '';
	}

	/**
	 * This will create a callBack.
	 *
	 * @param {object} obj
	 * @param {function} method
	 * @param {Array<any>} [argArray] Default args to pass.
	 * @param {boolean} [addArgs] Set to add merge args from the
	 * curried function.
	 * @returns {function|boolean} The callBack function or false.
	 */
	createCallBack(obj, method, argArray = [], addArgs = false)
	{
		if (typeof method !== 'function')
		{
			return false;
		}

		return (...args) =>
		{
			if (addArgs === true)
			{
				argArray = argArray.concat(args);
			}

			return method.apply(obj, argArray);
		};
	}

	/**
	 * This will bind scope to a method.
	 *
	 * @param {object} obj
	 * @param {function} method
	 * @returns {function}
	 */
	bind(obj, method)
	{
		return method.bind(obj);
	}
}

/**
 * This will return the base prototype to allow the module
 * to be added to base as a module.
 *
 * @returns {object} the base prototype.
 */
Base.prototype.extend = (function()
{
	return Base.prototype;
})();

/**
 * This is the instance of base that all modules will use.
 *
 * @global
 */
export const base = new Base();

/**
 * This will add the augmented methods to base.
 */
base.augment({
	...Objects,
	...EventMethods,
	...Types,
	equals
});