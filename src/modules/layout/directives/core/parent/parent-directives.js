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

    callBack(parent, ele);
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

    callBack(parent.data, ele);
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

    callBack(parent.state, ele);
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

    if (!parent.state)
    {
        parent.setStateHelper();
    }

    const state = parent.state;
    const states = callBack(state);
    parent.stateHelper.addStates(states);
};

/**
 * This will add an event to the parent events.
 *
 * @param {object} ele
 * @param {array} event - event, element, fucntion, capture
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

    parent.events.on(...event);
};