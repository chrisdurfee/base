import { Types } from "./types.js";

/**
 * Cached prototype method references to avoid prototype chain lookups on every call.
 * @private
 */
const _toString = Object.prototype.toString;
const _hasOwn = Object.prototype.hasOwnProperty;

/**
 * Objects
 *
 * Contains methods for working with objects.
 *
 * @module
 * @name Objects
 */
export const Objects =
{
	/**
	 * Creates a new object, optionally extending from another object.
	 *
	 * @param {object} [prototype] - The prototype object to extend from.
	 * @returns {object} The newly created object.
	 */
	create(prototype)
	{
		return Object.create(prototype || null);
	},

	/**
	 * Extends properties from the source object to the target object.
	 * Only copies properties that are not already defined on the target object.
	 *
	 * @param {object} sourceObj - The source object.
	 * @param {object} targetObj - The target object to extend.
	 * @returns {object|false} The extended target object or false if invalid.
	 */
	extendObject(sourceObj, targetObj)
	{
		if (!Types.isObject(sourceObj) || !Types.isObject(targetObj))
		{
			return false;
		}

		for (const key in sourceObj)
		{
			if (_hasOwn.call(sourceObj, key) && !_hasOwn.call(targetObj, key))
			{
				targetObj[key] = sourceObj[key];
			}
		}

		return targetObj;
	},

	/**
	 * Deep clones an object in a safe and scalable manner.
	 *
	 * @param {object} obj - The object to clone.
	 * @returns {object} A deep clone of the object.
	 */
	clone(obj)
	{
		if (!obj || !Types.isObject(obj))
		{
			return {};
		}

		return JSON.parse(JSON.stringify(obj));
	},

	/**
	 * Retrieves the prototype of a class or object.
	 *
	 * @param {function|object} entity - The class or object.
	 * @returns {object} The prototype of the entity.
	 */
	getClassObject(entity)
	{
		return typeof entity === "function" ? entity.prototype : entity;
	},

	/**
	 * Extends a class or object with the properties of another class or object.
	 *
	 * @param {function|object} sourceClass - The source class or object.
	 * @param {function|object} targetClass - The target class or object.
	 * @returns {object|false} The resulting extended object or false if invalid.
	 */
	extendClass(sourceClass, targetClass)
	{
		const source = this.getClassObject(sourceClass);
		const target = this.getClassObject(targetClass);
		if (typeof source !== 'object' || typeof target !== 'object')
		{
			return false;
		}

		/* we want to create a new object and add the source
		prototype to the new object */
		const obj = Object.create(source);

		/* we want to add any additional properties from the
		target class to the new object */
		for (var prop in target)
		{
			obj[prop] = target[prop];
		}

		return obj;
	},

	/**
	 * Checks if an object has a specific property.
	 *
	 * @param {object} obj - The object to check.
	 * @param {string} prop - The property to check for.
	 * @returns {boolean} True if the object has the property.
	 */
	hasOwnProp(obj, prop)
	{
		return _hasOwn.call(obj, prop);
	},

	/**
	 * Determines if a value is a plain object.
	 *
	 * @param {object} obj - The value to check.
	 * @returns {boolean} True if the value is a plain object.
	 */
	isPlainObject(obj)
	{
		return !!obj && _toString.call(obj) === "[object Object]";
	},

	/**
	 * Checks if an object is empty.
	 *
	 * @param {object} obj - The object to check.
	 * @returns {boolean} True if the object has no own properties.
	 */
	isEmpty(obj)
	{
		if (!Types.isObject(obj))
		{
			return true;
		}

		return Object.keys(obj).length === 0;
	}
};