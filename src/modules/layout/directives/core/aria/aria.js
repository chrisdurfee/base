import { onSet } from "../reactive/on-set.js";

/**
 * This will add aria attributes.
 *
 * @protected
 * @param {object} ele
 * @param {string} role
 * @param {object} parent
 * @returns {void}
 */
export const addRole = (ele, role, parent) =>
{
    if (!role)
    {
        return;
    }

    ele.setAttribute('role', role);
};

/**
 * This will setup the onSet callBack.
 *
 * @param {string} attr
 * @returns {function}
 */
const onSetCallBack = (attr) =>
{
    return (val, ele) =>
    {
        const text = (val)? "true" : "false";
        ele.setAttribute(attr, text);
    };
};

/**
 * This will add aria attributes.
 *
 * @protected
 * @param {object} ele
 * @param {object} attributes
 * @param {object} parent
 * @returns {void}
 */
export const addAria = (ele, attributes, parent) =>
{
    if (!attributes)
    {
        return;
    }

    const role = attributes.role;
    if (role)
    {
        ele.setAttribute('role', role);
        attributes.role = null;
    }

    const keys = Object.keys(attributes);
    for (let i = 0, len = keys.length; i < len; i++)
    {
        const key = keys[i];
        const value = attributes[key];
        if (value === null)
        {
            continue;
        }

        const attr = 'aria-' + key;
        if (Array.isArray(value))
        {
            const settings = value.slice();
            settings.push(onSetCallBack(attr));
            onSet(ele, settings, parent);
        }
        else
        {
            ele.setAttribute(attr, value);
        }
    }
}