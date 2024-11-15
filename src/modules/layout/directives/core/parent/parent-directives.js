import { Builder } from "../../../builder.js";

/**
 * This will cache the element in the parent.
 *
 * @param {object} ele
 * @param {string} propName
 * @param {object} parent
 * @returns {void}
 */
export const cache = (ele, propName, parent) =>
{
    // if (!propName || !parent)
    // {
    //     return;
    // }

    // parent[propName] = ele;
};

/**
 * This will pass the parent state to the callBack.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 * @returns {void}
 */
export const useParent = (ele, callBack, parent) =>
{
    if (!callBack || !parent)
    {
        return;
    }

    const layout = callBack(parent, ele);
    if (!layout)
    {
        return;
    }

    Builder.build(layout, ele, parent);
};

/**
 * This will pass the parent state to the callBack.
 *
 * @param {object} ele
 * @param {string} name
 * @param {object} parent
 * @returns {void}
 */
export const getId = (ele, name, parent) =>
{
    if (!name || !parent)
    {
        return;
    }

    const id = parent.getId(name);
    ele.id = id;
};

/**
 * This will pass the parent state to the callBack.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 * @returns {void}
 */
export const useData = (ele, callBack, parent) =>
{
    if (!callBack || !parent)
    {
        return;
    }

    const layout = callBack(parent.data, ele);
    if (!layout)
    {
        return;
    }

    Builder.build(layout, ele, parent);
};

/**
 * This will pass the parent state to the callBack.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 * @returns {void}
 */
export const useState = (ele, callBack, parent) =>
{
    if (!callBack || !parent)
    {
        return;
    }

    const layout = callBack(parent.state, ele);
    if (!layout)
    {
        return;
    }

    Builder.build(layout, ele, parent);
};

/**
 * This will pass the parent state to the callBack.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 * @returns {void}
 */
export const addState = (ele, callBack, parent) =>
{
    if (!callBack || !parent)
    {
        return;
    }

    const state = parent.state;
    const states = callBack(state);
    if (!parent.state)
    {
        parent.setStateHelper(states);
        return;
    }

    parent.addState(states);
};

/**
 * This will add an event to the parent events.
 *
 * @param {object} ele
 * @param {array} event - event, element, function, capture
 * @param {object} parent
 * @returns {void}
 */
export const addEvent = (ele, event, parent) =>
{
    if (!event || !parent)
    {
        return;
    }

    if (!parent.events)
    {
        parent.setEventHelper();
    }

    /**
     * This will replace the callback funciton to pass
     * the parent and event.
     */
    if (event[2])
    {
        const callBack = event[2];
        event[2] = (e) =>
        {
            callBack(e, parent);
        };
    }

    parent.events.on(...event);
};