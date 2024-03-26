import { Component } from './component.js';

/**
 * Pods
 *
 * Pods are components that are created using a shorthand method.
 *
 * @author Chris Durfee
 * @author Cayon Christiansen
 */

/**
 * This will store the pod shorthand method alaises.
 *
 * @constant
 * @type {object}
 */
const SHORTHAND_METHODS =
{
    created: 'onCreated',
    setStates: 'setupStates',
    events: 'setupEvents',
    before: 'beforeSetup',
    render: 'render',
    after: 'afterSetup',
    destroy: 'beforeDestroy'
};

/**
 * This will modify the methods to convert the shorthand
 * methods to the full methods.
 *
 * @param {object} component
 * @returns {object}
 */
const modifyMethods = (component) =>
{
    Object.entries(SHORTHAND_METHODS).forEach(([prop, value]) =>
    {
        if (component[prop])
        {
            component[value] = component[prop];
            delete component[prop];
        }
    });

    return component;
};

/**
 * This will create a class.
 *
 * @param {object} Base
 * @param {object} settings
 * @returns {object}
 */
const createClass = (Base, settings) =>
{
    class Child extends Base {}
    Object.assign(Child.prototype, settings);
    return Child;
};

/**
 * This will create a pod component.
 *
 * @param {function} callBack
 * @returns {object}
 */
export const Pod = (callBack) =>
{
    if (!callBack)
    {
        return null;
    }

    const component = createClass(Component, {});

    /**
     * This will call the callback function and pass the component
     * to set up the component.
     *
     * The result is the render method.
     */
    const render = callBack(component);

    /**
     * This will modify the methods to convert the shorthand
     * methods to the full methods.
     */
    modifyMethods(component);

    component.prototype.render = render;
    return component;
};