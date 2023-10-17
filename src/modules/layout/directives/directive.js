/**
 * This will create a directive object.
 *
 * @param {string} name
 * @param {function} callBack
 * @returns {object}
 */
export const Directive = (name, callBack) =>
{
    return {
        name,
        callBack
    };
};