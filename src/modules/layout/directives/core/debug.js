/**
 * This will add an event to the parent events.
 *
 * @param {object} ele
 * @param {*} data
 * @param {object} parent
 * @returns {void}
 */
export const debug = (ele, data, parent) =>
{
    if (!parent)
    {
        return;
    }

    const layout = (parent._layout)? parent._layout : parent.render();
    console.log('Debug: ', 'ele: ', ele);
    console.log('Data: ', data);
    console.log('Layout: ', layout);
    console.log('parent: ', parent);
};