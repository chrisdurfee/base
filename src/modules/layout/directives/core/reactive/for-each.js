import { dataBinder } from "../../../../data-binder/data-binder.js";
import { Builder } from "../../../builder.js";
import { getParentData } from './get-parent-data.js';

/**
 * This will watch a data attr and update the
 * children to the element when the attr value is updated.
 *
 * @param {object} ele
 * @param {array} settings
 * @param {object} parent
 * @returns {void}
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
        [prop, item, scope] = settings;
    }
    else
    {
        [data, prop, item, scope] = settings;
    }

    const scopeData = (scope !== false);
    dataBinder.watch(ele, data, prop, (items) =>
    {
        Builder.removeAll(ele);
        if (!items || items.length < 1)
        {
            return;
        }

        const children = [];
        items.forEach((row, index) =>
        {
            const scoped = (scopeData)? data.scope(`${prop}[${index}]`) : null;
            const layout = item(
                items[index],
                index,
                scoped,
                children
            );
            if (layout === null)
            {
                return;
            }

            children.push(layout);
        });

        return Builder.build(children, ele, parent);
    });
}