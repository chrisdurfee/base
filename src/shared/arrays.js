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
	 * @returns {array}
	 */
	static toArray(list)
	{
		return Array.from(list);
	}

	/**
	 * This will check if a value is found in an array.
	 *
	 * @param {array} array
	 * @param {string} element
	 * @param {number} [fromIndex]
	 * @returns {number} This will return -1 if not found.
	 */
	static inArray(array, element, fromIndex)
	{
		if (!Array.isArray(array))
		{
			return -1;
		}

		return array.indexOf(element, fromIndex);
	}
}
