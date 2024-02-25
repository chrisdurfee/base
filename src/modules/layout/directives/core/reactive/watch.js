import { WatcherHelper } from '../../../watcher-helper.js';

/**
 * This will add a watcher.
 *
 * @protected
 * @param {object} ele
 * @param {(array|object)} watcher
 * @param {object} [parent]
 * @return {void}
 */
export const watch = (ele, watcher, parent) =>
{
    if (!watcher)
    {
        return;
    }

    if (Array.isArray(watcher) && typeof watcher[0] !== 'string')
    {
        for (var i = 0, length = watcher.length; i < length; i++)
        {
            WatcherHelper.setup(ele, watcher[i], parent);
        }
    }
    else
    {
        WatcherHelper.setup(ele, watcher, parent);
    }
};