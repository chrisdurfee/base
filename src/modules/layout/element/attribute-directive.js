/**
 * This will create an attribute directive object.
 *
 * @param {object} attr
 * @param {function} directive
 * @returns {object}
 */
export const AttributeDirective = (attr, directive) => ({
	attr,
	directive
});