/**
 * This is a utility class for data.
 */
export const DataUtils =
{
    /**
     * @param {RexExp} deepDataPattern
     */
	deepDataPattern: /(\w+)|(?:\[(\d)\))/g,

	/**
	 * This will check if a string has deep data.
	 *
	 * @param {string} str
	 * @return {bool}
	 */
	hasDeepData(str)
	{
		return (str.indexOf('.') !== -1 || str.indexOf('[') !== -1);
	},

	/**
	 * This will get the deep data segments
	 * @param {string} str
	 * @return {array}
	 */
	getSegments(str)
	{
		const pattern = this.deepDataPattern;
		return str.match(pattern);
	}
};