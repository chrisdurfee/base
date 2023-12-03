import { Builder } from "../../../builder.js";

/**
 * This will map children to the element.
 *
 * @param {object} ele
 * @param {array} settings
 * @param {object} parent
 */
export const map = (ele, settings, parent) =>
{
    const items = settings[0];
    if (!items || items.length < 1)
    {
        return;
    }

    const item = settings[1];
    const children = [];
    for (var i = 0, length = items.length; i < length; i++)
    {
        var row = items[i];
        if (!row)
        {
            continue;
        }

        var layout = item(row, i);
        if (layout === null)
        {
            continue;
        }

        children.push(layout);
    }

    return Builder.build(children, ele, parent);
};