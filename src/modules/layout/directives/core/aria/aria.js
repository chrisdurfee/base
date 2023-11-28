import { Dom } from "../../../../../shared/dom.js";

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

    for (var prop in attributes)
    {
        if (attributes.hasOwnProperty(prop) === false || attributes[prop] === null)
        {
            continue;
        }

        var value = attributes[prop];
        var attr = 'aria-' + prop;

        /* this will setup an onSet to change the attr value
        when the data chnages. */
        if (Array.isArray(value))
        {
            value.push(onSetCallBack(attr));
            this.onSet(ele, value, parent);
        }
        else
        {
            Dom.setAttr(ele, attr, value);
        }
    }
}