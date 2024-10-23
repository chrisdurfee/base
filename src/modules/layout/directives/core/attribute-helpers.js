import { Builder } from "../../builder.js";
import { Parser } from "../../element/parser.js";
import { HtmlHelper } from "../../html-helper.js";

/**
 * This will add the attributes to the element.
 *
 * @param {object} ele
 * @param {object} attributes
 * @param {object} parent
 * @returns {void}
 */
export const addAttributes = (ele, attributes, parent) =>
{
    if (!attributes)
    {
        return;
    }

    const parsed = Parser.parse(attributes, parent);
    HtmlHelper.addAttributes(ele, parsed.attr, parent);
    Builder.setDirectives(ele, parsed.directives, parent);
};