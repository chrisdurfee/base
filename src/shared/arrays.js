/**
 * Arrays
 *
 * This will contain methods for working with arrays.
 *
 * @module
 * @name Arrays
 */
export class Arrays
{
    /**
	 * This will convert an object or collection into an array.
	 *
	 * @param {object} list
	 * @return {array}
	 */
	static toArray(list)
	{
		return Array.prototype.slice.call(list);
	}

	/**
	 * This will check if a value is found in an array.
	 *
	 * @param {array} array
	 * @param {string} element
	 * @param {int} [fromIndex]
	 * @return {int} This will return -1 if not found.
	 */
	static inArray(array, element, fromIndex)
	{
		if (!array || typeof array !== 'object')
		{
			return -1;
		}

		return array.indexOf(element, fromIndex);
	}
}