import { Component } from './component.js';
import { SHORTHAND_METHODS } from './shorthand-methods.js';

/**
 * Pods
 *
 * Pods are components that are created using a shorthand method.
 *
 * @author Chris Durfee
 * @author Cayon Christiansen
 */

/**
 * This will modify the methods to convert the shorthand
 * methods to the full methods.
 *
 * @param {object} proxy
 * @param {object} component
 * @returns {object}
 */
const modifyMethods = (proxy, component) =>
{
    Object.entries(proxy).forEach(([prop, value]) =>
    {
        const alias = SHORTHAND_METHODS[prop] || prop;
        component.prototype[alias] = value;
    });

    return component;
};

/**
 * This will create a class.
 *
 * @param {object} Base
 * @returns {object}
 */
const extendBaseClass = (Base) =>
{
    return class extends Base {}
};

/**
 * This will create a pod component.
 *
 * @param {function} callBack
 * @param {object} extend - The class to extend.
 * @returns {typeof Component}
 */
export const Pod = (callBack, extend = Component) =>
{
    if (!callBack)
    {
        return null;
    }

    const component = extendBaseClass(extend);

    /**
     * This will call the callback function and pass the component
     * to set up the component.
     *
     * The result is the render method.
     */
    const proxy = {};
    const render = callBack(proxy);

    /**
     * This will modify the methods to convert the shorthand
     * methods to the full methods.
     */
    modifyMethods(proxy, component);

    component.prototype.render = render;
    return component;
};