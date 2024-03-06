import { Types } from "./types.js";

/**
 * Objects
 *
 * This will contain methods for working with objects.
 *
 * @module
 * @name Objects
 */
export const Objects =
{
    /**
	 * This will create a new object.
	 *
	 * @param {object} [object] An object to extend.
	 * @return {object}
	 */
	create(object)
	{
		return Object.create(object);
	},

	/**
	 * This will extend an object to another object.
	 *
	 * @param {(function|object)} sourceObj
	 * @param {(function|object)} targetObj
	 * @return {object}
	 */
	extendObject(sourceObj, targetObj)
	{
		if (typeof sourceObj === 'undefined' || typeof targetObj === 'undefined')
		{
			return false;
		}

		for (var property in sourceObj)
		{
			if (this.hasOwnProp(sourceObj, property) && typeof targetObj[property] === 'undefined')
			{
				targetObj[property] = sourceObj[property];
			}
		}

		return targetObj;
	},

	/**
	 * This will clone an object.
	 *
	 * @param {object} obj
	 * @return {object}
	 */
	clone(obj)
	{
		if (!obj)
		{
			return {};
		}

		return JSON.parse(JSON.stringify(obj));
	},

	/**
	 * This will get the class prototype.
	 *
	 * @protected
	 * @param {function|object} object
	 * @return {object}
	 */
	getClassObject(object)
	{
		return (typeof object === 'function')? object.prototype : object;
	},

	/**
	 * This will extend an object to another object.
	 *
	 * @param {function|object} sourceClass
	 * @param {function|object} targetClass
	 * @return {object}
	 */
	extendClass(sourceClass, targetClass)
	{
		/* if we are using a class constructor function
		we want to get the class prototype object */
		const source = this.getClassObject(sourceClass),
		target = this.getClassObject(targetClass);

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
	 * This will check if an object has a property.
	 *
	 * @param {object} obj
	 * @param {string} prop
	 * @return {boolean}
	 */
	hasOwnProp(obj, prop)
	{
		return Object.prototype.hasOwnProperty.call(obj, prop);
	},

	/**
	 * This will check if an object is a plain object.
	 *
	 * @param {object} obj
	 * @return {boolean}
	 */
	isPlainObject(obj)
	{
		return (obj && Object.prototype.toString.call(obj) === '[object Object]');
	},

	/**
	 * This will check if an object is empty.
	 *
	 * @param {object} obj
	 * @return {boolean}
	 */
	isEmpty(obj)
	{
		if (Types.isObject(obj) === false)
		{
			return true;
		}

		/* we want to loop through each property and
		check if it belongs to the object directly */
		for (var key in obj)
		{
			if (this.hasOwnProp(obj, key))
			{
				return false;
			}
		}
		return true;
	}
};