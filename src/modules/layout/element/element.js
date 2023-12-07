/**
 * This will create an element object.
 *
 * @param {string} tag
 * @param {array} attr
 * @param {array} directives
 * @param {array} children
 * @returns {object}
 */
export const Element = (tag, attr, directives, children) =>
{
    return {
        tag,
        attr,
        directives,
        children,
    };
};