import { Component } from './component.js';
import { Unit } from './unit.js';

/**
 * This will store the jot shorthand method alaises.
 *
 * @constant
 * @type {object}
 */
const JOT_SHORTHAND_METHODS =
{
    created: 'onCreated',
    state: 'setupStates',
    events: 'setupEevents',
    before: 'beforeSetup',
    render: 'render',
    after: 'afterSetup',
    destroy: 'beforeDestroy'
};

/**
 * This will get the jot method by value. If the method is an
 * object, it will be nested in a function.
 *
 * @param {object|function} value
 * @returns {function}
 */
const getJotShorthandMethod = (value) =>
{
    const valueType = (typeof value);
    return (valueType === 'function')? value : function()
    {
        return value;
    };
};

/**
 * This will create a jot component object that will be used
 * to create the jot component.
 *
 * @param {object} settings
 * @returns {object}
 */
const JotComponent = (settings) =>
{
    const component = {};
    if (!settings)
    {
        return component;
    }

    for (var prop in settings)
    {
        if (!Object.prototype.hasOwnProperty.call(settings, prop))
        {
            continue;
        }

        const value = settings[prop];
        const alias = JOT_SHORTHAND_METHODS[prop];
        if (alias)
        {
            component[alias] = getJotShorthandMethod(value);
            continue;
        }

        component[prop] = value;
    }

    return component;
};

/**
 * This will create a component class.
 *
 * @param {object} settings
 * @returns {class}
 */
const createComponentClass = (settings) =>
{
    class Child extends Component
    {

    }

    Object.assign(Child.prototype, settings);
    return Child;
};

/**
 * This will create a unit class.
 *
 * @param {object} settings
 * @returns {class}
 */
 const createUnitClass = (settings) =>
 {
    class Child extends Unit
    {

    }

    Object.assign(Child.prototype, settings);
    return Child;
 };

/**
 * This will create a shorthand component.
 *
 * @param {object|function} layout
 * @returns {function}
 */
export const Jot = function(layout)
{
    if (!layout)
    {
        return null;
    }

    let settings;
    switch (typeof layout)
    {
        case 'object':
            if (layout.render)
            {
                settings = JotComponent(layout);
                return createComponentClass(settings);
            }

            settings = {
                render()
                {
                    return layout;
                }
            };

            // this will create a stateless and dataless unit
            return createUnitClass(settings);
        case 'function':
            settings = {
                render: layout
            };

            // this will create a stateless and dataless unit
            return createUnitClass(settings);
    }
};