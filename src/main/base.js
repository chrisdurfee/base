/**
 * Base Framework
 * @version 3.0.0
 * @author Chris Durfee
 * @file This is a javascript framework to allow complex
 * functions to work in many browsers and versions.
 */

import { Arrays } from '../shared/arrays.js';
import { Types } from '../shared/types.js';
import { DataTracker } from './data-tracker/data-tracker.js';
import { equals } from './equals.js';
import { EventMethods } from './events/event-methods.js';

/**
 * Base
 *
 * This is the base framework.
 * @class
 */
class Base
{
	/**
	 * This will create an instance of base.
	 * @constructor
	 */
	constructor()
	{
		/**
		 * @member {string} version
		 */
		this.version = '3.0.0';

		/**
		 * @member {array} errors
		 */
		this.errors = [];

		/**
		 * @member {object} dataTracker
		 */
		this.dataTracker = DataTracker;
	}

	/**
	 * this will augement the base framework with new functionality.
	 *
	 * @param {object} methods The new methods to add.
	 * @return {object} An instance of base.
	 */
	augment(methods)
	{
		if (!methods || typeof methods !== 'object')
		{
			return this;
		}

		const prototype = this.constructor.prototype;
		for (var property in methods)
		{
			if (methods.hasOwnProperty(property))
			{
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
	 * @param {array} args The args to pass to the first function call.
	 *
	 * @return {*} The results of the function being called.
	 */
	override(obj, methodName, overrideMethod, args)
	{
		return (obj[methodName] = overrideMethod).apply(obj, Arrays.toArray(args));
	}

	/**
	 * This will get the last error.
	 *
	 * @return {(object|boolean)} The last error or false.
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
	 * @return {void}
	 */
	addError(err)
	{
		this.errors.push(err);
	}

	/**
	 * This will get the value from a property on an object.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {mixed} [defaultText] A value if no value is set.
	 * @return {string}
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
	 * @param {array} [argArray] Default args to pass.
	 * @param {boolean} [addArgs] Set to add merge args from the
	 * curried function.
	 *
	 * @return {(function|boolean)} The callBack function or false.
	 */
	createCallBack(obj, method, argArray, addArgs)
	{
		if (typeof method !== 'function')
		{
			return false;
		}

		argArray = argArray || [];
		return function(...args)
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
	 * @return {function}
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
 * @static
 * @return {object} the base prototype.
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