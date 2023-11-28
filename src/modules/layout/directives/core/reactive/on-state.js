import { onUpdate } from '../on-update.js';

/**
 * This will add an onState watcher.
 *
 * @param {object} ele
 * @param {array} onState
 * @param {object} parent
 */
export const onState = (ele, onState, parent) =>
{
    onUpdate(ele, parent.state, onState, parent);
}