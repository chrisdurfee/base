import { Dom } from "../../../../../shared/dom.js";
import { onSet } from "../reactive/on-set.js";

/**
 * This will add aria attributes.
 *
 * @protected
 * @param {object} ele
 * @param {array} role
 * @param {object} parent
 */
export const addRole = (ele, role, parent) =>
{
    if (!role)
    {
        return;
    }

    if (role)
    {
        Dom.setAttr(ele, 'role', role);
    }
};

/**
 * This will setup the onSet callBack.
 *
 * @param {string} attr
 * @return {function}
 */
const onSetCallBack = (attr) =>
{
    return (ele, val) =>
    {
        const text = (val)? "true" : "false";
        Dom.setAttr(ele, attr, text);
    };
};

/**
 * This will add aria attributes.
 *
 * @protected
 * @param {object} ele
 * @param {array} attributes
 * @param {object} parent
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
        Dom.setAttr(ele, 'role', role);
        attributes.role = null;
    }

    Object.entries(attributes).forEach(([key, value]) =>
    {
        if (value === null)
        {
            return;
        }

        const attr = `aria-${key}`;
        if (Array.isArray(value))
        {
            value.push(onSetCallBack(attr));
            onSet(ele, value, parent);
        }
        else
        {
            Dom.setAttr(ele, attr, value);
        }
    });
}