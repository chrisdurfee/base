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

    items.forEach((row, i) =>
    {
        if (!row)
        {
            return;
        }

        const layout = item(row, i);
        if (layout === null)
        {
            return;
        }

        children.push(layout);
    });

    return Builder.build(children, ele, parent);
};