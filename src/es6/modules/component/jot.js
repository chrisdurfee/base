import {Unit} from './unit.js';
import {Component} from './component.js';

const setupJotComponent = function(settings)
{
    const component = {};

    let state = settings.state;
    if(state)
    {
        let stateType = (typeof state);
        component.setupStates = (stateType === 'function')? state : function()
        {
            return state;
        };
    }

    let events = settings.events;
    if(events)
    {
        let eventType = (typeof events);
        component.setupEevents = (eventType === 'function')? events : function()
        {
            return events;
        };
    }

    let before = settings.before;
    if(before)
    {
        component.beforeSetup = before;
    }

    let after = settings.after;
    if(after)
    {
        component.afterSetup = after;
    }

    let destroy = settings.destroy;
    if(destroy)
    {
        component.beforeDestroy = destroy;
    }

    let data = settings.data;
    if(data)
    {
        component.data = data;
    }

    let render = settings.render;
    if(render)
    {
        let renderType = (typeof render);
        component.render = (renderType === 'function')? render : function()
        {
            return render;
        };
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
    if(!layout)
    {
        return null;
    }

    let settings;
    switch(typeof layout)
    {
        case 'object':
            if(layout.render)
            {
                settings = setupJotComponent(layout);
                return createComponentClass(settings);
            }

            settings = {
                render: function()
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