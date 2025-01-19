import { Dom } from "../../../../../shared/dom.js";
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

    if (role)
    {
        Dom.setAttr(ele, 'role', role);
    }
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
        Dom.setAttr(ele, attr, text);
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
            const settings = [...value];
            settings.push(onSetCallBack(attr));
            onSet(ele, settings, parent);
        }
        else
        {
            Dom.setAttr(ele, attr, value);
        }
    });
}