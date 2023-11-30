import { onUpdate } from '../dom-methods.js';
import { getParentData } from './get-parent-data.js';

/**
 * This will add an onSet watcher.
 *
 * @param {object} ele
 * @param {array} onSet
 * @param {object} parent
 */
export const onSet = (ele, onSet, parent) =>
{
    const data = getParentData(parent);
    onUpdate(ele, data, onSet, parent);
};