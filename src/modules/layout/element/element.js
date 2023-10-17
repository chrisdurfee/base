/**
 * This will create an element object.
 *
 * @param {string} tag
 * @param {array} attr
 * @param {array} directives
 * @param {array} children
 * @param {object} content
 * @returns {object}
 */
export const Element = (tag, attr, directives, children, content) =>
{
    return {
        tag,
        attr,
        directives,
        children,
        content
    };
};