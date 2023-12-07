/**
 * This will be called when an element onCreated directive is called.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 */
export const onCreated = (ele, callBack, parent) =>
{
    callBack(ele);
};