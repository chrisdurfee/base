/**
 * This will create an attribute directive object.
 *
 * @param {string} attr
 * @param {object} directive
 * @returns {object}
 */
export const AttributeDirective = (attr, directive) =>
{
	return {
		attr,
		directive
	};
};