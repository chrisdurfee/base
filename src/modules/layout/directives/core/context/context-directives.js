import { DataTracker } from "../../../../../main/data-tracker/data-tracker.js";
import { Builder } from "../../../builder.js";
import { Parser } from "../../../element/parser.js";
import { HtmlHelper } from "../../../html-helper.js";

/**
 * This will track the context from an atom to remove
 * it when the element is removed.
 */
DataTracker.addType('context', (data) =>
{
	if (!data)
	{
		return false;
	}

	data.parent.removeContextBranch(data.branch);
});

/**
 * This will get the parent context.
 *
 * @param {object|null} parent
 * @returns {object|null}
 */
const getParentContext = (parent) =>
{
    return (!parent)? null : parent.getContext();
};

/**
 * This will set the context attributes.
 *
 * @protected
 * @param {object} ele
 * @param {function} context
 * @param {object} [parent]
 */
export const context = (ele, context, parent) =>
{
    if (typeof context !== 'function')
    {
        return;
    }

    const parentContext = getParentContext(parent);
    const attributes = context(parentContext);
    if (!attributes)
    {
        return;
    }

    const parsed = Parser.parse(attributes, parent);
    HtmlHelper.addAttributes(ele, parsed.attr, parent);
    Builder.setDirectives(ele, parsed.directives, parent);
};

/**
 * This will use the parent context.
 *
 * @param {object} ele
 * @param {function} callBack
 * @param {object} [parent]
 * @returns {void}
 */
export const useContext = (ele, callBack, parent) =>
{
    if (typeof callBack !== 'function')
    {
        return;
    }

    const parentContext = getParentContext(parent);
    callBack(parentContext);
};

/**
 * This will add context the parent context.
 *
 * @param {object} ele
 * @param {array} callBack
 * @param {object} [parent]
 * @returns {void}
 */
export const addContext = (ele, callBack, parent) =>
{
    if (typeof callBack !== 'function' || !parent)
    {
        return;
    }

    const parentContext = getParentContext(parent);
    const childContext = callBack(parentContext);
    if (!childContext)
    {
        return;
    }

    parent.addContextBranch(childContext[0], childContext[1]);
}

/**
 * This will track the child context on the element.
 *
 * @param {object} ele
 * @param {string} branchName
 * @param {object} parent
 */
const trackContext = (ele, branchName, parent) =>
{
    DataTracker.add(ele, 'context',
    {
        branch: branchName,
        parent: parent
    });
};