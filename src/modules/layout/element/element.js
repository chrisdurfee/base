/**
 * This will create an element object.
 *
 * @param {string} tag
 * @param {Array<any>} attr
 * @param {Array<any>} directives
 * @param {Array<any>} children
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