/**
 * This will be called when an element onCreated directive is called.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 * @returns {void}
 */
export const onCreated = (ele, callBack, parent) =>
{
    callBack(ele);
};