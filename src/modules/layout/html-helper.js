import { Events } from "../../main/events/events.js";
import { Dom } from '../../shared/dom.js';
import { Html, normalizeAttr, removeEventPrefix } from '../html/html.js';

/**
 * HtmlHelper
 *
 * This will build JSON layouts.
 *
 * @class
 * @extends Html
 */
// @ts-ignore
export class HtmlHelper extends Html
{
	/**
	 * This will create a new element.
	 *
	 * @override
	 * @param {string} nodeName The node name.
	 * @param {Array<any>} attrs The node attributes.
	 * @param {object} container The node container.
	 * @param {object} parent
	 * @returns {object} The new element.
	 */
	static create(nodeName, attrs, container, parent)
	{
		const ele = document.createElement(nodeName);
        this.addAttributes(ele, attrs, parent);

		container.appendChild(ele);
		return ele;
    }

	/**
	 * This will add the element attributes.
	 *
	 * @overload
	 * @param {object} ele
	 * @param {Array<any>} attrs
	 * @param {object} parent
     * @returns {void}
	 */
	static addAttributes(ele, attrs, parent)
	{
        if (!attrs || attrs.length < 1)
        {
            return;
        }

        /* Indexed for loop - avoids the closure + destructuring
         * allocation of forEach on every attribute of every element. */
        for (let i = 0, len = attrs.length; i < len; i++)
        {
            const item = attrs[i];
			this.addAttr(ele, item.key, item.value, parent);
        }
	}

	/**
	 * This will add an element attribute.
	 *
	 * @param {object} ele
	 * @param {string} attr
	 * @param {*} value
	 * @param {object} [parent]
     * @returns {void}
	 */
	static addAttr(ele, attr, value, parent)
	{
		if (value === '' || !attr)
		{
			return;
		}

		/**
		 * Prevent setting reserved DOM properties that have read-only getters.
		 * 'children' is a read-only property on all DOM elements.
		 */
		if (attr === 'children')
		{
			return;
		}

		if (attr === 'innerHTML')
		{
			ele.innerHTML = value;
			return;
		}

		/* we want to check to add a value or an event listener */
		const type = typeof value;
		if (type === 'function')
		{
			/* this will add the event using the base events
			so the event is tracked */
			attr = removeEventPrefix(attr);

			/**
			 * The parser already wraps event callbacks in a closure that
			 * binds `this` and passes the parent component as the second
			 * argument. It stamps `.originalCallback` on the wrapper so we
			 * can identify it here and skip creating a second closure.
			 * Only fall back to wrapping when the function arrived here
			 * unwrapped (e.g. from a directive calling addAttr directly).
			 */
			if (value.originalCallback)
			{
				// Already wrapped by parser — register directly.
				Events.add(attr, ele, value, false, true, value.originalCallback);
			}
			else
			{
				const callback = value;
				const wrapper = function(e)
				{
					// @ts-ignore
					callback.call(this, e, parent);
				};
				Events.add(attr, ele, wrapper, false, true, callback);
			}
			return;
		}

		/* Use startsWith for clarity and to avoid allocating a substring
		 * on every regular attribute access (the common case is neither).
		 * Length guard short-circuits before the string comparison. */
		if (attr.substring(4, 5) === '-')
		{
			// this will handle data and aria attributes
			Dom.setAttr(ele, attr, value);
			return;
		}

		const attrName = normalizeAttr(attr);
		ele[attrName] = value;
	}

	/**
     * This will add content to an element.
     *
     * @param {object} ele
     * @param {object|null} content
     */
    static addContent(ele, content)
    {
        if (!content)
        {
            return;
        }

        if (content.textContent !== null)
        {
            ele.textContent = content.textContent;
        }
        else if (content.innerHTML)
        {
            ele.innerHTML = content.innerHTML;
        }
    }

	/**
	 * This will append a child element to a parent.
	 *
	 * @override
	 * @param {object} parent
	 * @param {object} child
     * @returns {void}
	 */
	static append(parent, child)
	{
		parent.appendChild(child);
	}
}