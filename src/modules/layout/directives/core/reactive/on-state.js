import { onUpdate } from '../dom-methods.js';

/**
 * This will add an onState watcher.
 *
 * @param {object} ele
 * @param {array} onState
 * @param {object} parent
 * @returns {void}
 */
export const onState = (ele, onState, parent) =>
{
    onUpdate(ele, parent.state, onState, parent);
};