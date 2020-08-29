
export const Objects =
{
    /**
	 * This will create a new object.
	 *
	 * @param {object} [object] An object to extend.
	 * @return {object}
	 */
	createObject(object)
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
		return Object.assign(targetObj, sourceObj);
	},

	/**
	 * This will clone an object.
	 *
	 * @param {object} obj
	 * @return {object}
	 */
	cloneObject(obj)
	{
		return JSON.parse(JSON.stringify(obj));
	},

	/**
	 * This will get the class prototype.
	 *
	 * @param {(function|object)} object
	 * @return {object}
	 */
	_getClassObject(object)
	{
		return (typeof object === 'function')? object.prototype : object;
	},

	/**
	 * This will extend an object to another object.
	 *
	 * @param {(function|object)} sourceClass
	 * @param {(function|object)} targetClass
	 * @return {object}
	 */
	extendClass(sourceClass, targetClass)
	{
		/* if we are using a class constructor function
		we want to get the class prototype object */
		let source = this._getClassObject(sourceClass),
		target = this._getClassObject(targetClass);

		if(typeof source !== 'object' || typeof target !== 'object')
		{
			return false;
		}

		/* we want to create a new object and add the source
		prototype to the new object */
		let obj = Object.create(source);

		/* we want to add any additional properties from the
		target class to the new object */
		for(var prop in target)
		{
			obj[prop] = target[prop];
		}

		return obj;
	}
};