/**
 * This will pass the parent state to the callBack.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 */
export const useParent = (ele, callBack, parent) =>
{
    if (!callBack || !parent)
    {
        return false;
    }

    callBack(parent, ele);
};

/**
 * This will pass the parent state to the callBack.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 */
export const useData = (ele, callBack, parent) =>
{
    if (!callBack || !parent)
    {
        return false;
    }

    callBack(parent.data, ele);
};

/**
 * This will pass the parent state to the callBack.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 */
export const useState = (ele, callBack, parent) =>
{
    if (!callBack || !parent)
    {
        return false;
    }

    callBack(parent.state, ele);
};

/**
 * This will pass the parent state to the callBack.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} parent
 */
export const addState = (ele, callBack, parent) =>
{
    if (!callBack || !parent)
    {
        return false;
    }

    if (parent.stateHelper)
    {
        const state = parent.state;
        const states = callBack(state);
        parent.stateHelper.addStates(states);
    }
};