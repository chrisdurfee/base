import { Html } from "../../../../html/html.js";
import { dataBinder } from "../../../../data-binder/data-binder.js";
import { getParentData } from './get-parent-data.js';

/**
 * This will watch a data attr and update the
 * children to the element when the attr value is updated.
 *
 * @param {object} ele
 * @param {array} settings
 * @param {object} parent
 */
export const forEach = (ele, settings, parent) =>
{
    let data, prop, item, scope;

    if (settings.length < 3)
    {
        const parentData = getParentData(parent);
        if (!parentData)
        {
            return;
        }

        data = parentData;
        prop = settings[0];
        item = settings[1];
        scope = settings[2];
    }
    else
    {
        data = settings[0];
        prop = settings[1];
        item = settings[2];
        scope = settings[3];
    }

    const scopeData = (scope !== false);
    dataBinder.watch(ele, data, prop, (items) =>
    {
        Html.removeAll(ele);
        if (!items || items.length < 1)
        {
            return;
        }

        const children = [];
        for (var i = 0, length = items.length; i < length; i++)
        {
            var scoped = (scopeData)? data.scope(prop + '[' + i + ']') : null;
            var layout = item(items[i], i, scoped);
            if (layout === null)
            {
                continue;
            }

            children.push(layout);
        }

        return this.build(children, ele, parent);
    });
}