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
	 * @param {array} attrs The node attributes.
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
	 * @param {array} attrs
	 * @param {object} parent
     * @returns {void}
	 */
	static addAttributes(ele, attrs, parent)
	{
        if (!attrs || attrs.length < 1)
        {
            return;
        }

        attrs.forEach(item =>
		{
            const { key: prop, value } = item;
			this.addAttr(ele, prop, value, parent);
        });
	}

	/**
	 * This will add an element attribute.
	 *
	 * @param {object} ele
	 * @param {string} attr
	 * @param {*} value
     * @returns {void}
	 */
	static addAttr(ele, attr, value, parent)
	{
		if (value === '' || !attr)
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
			Events.add(attr, ele, function(e)
			{
				value.call(this, e, parent);
			});
			return;
		}

		if (attr.substr(4, 1) === '-')
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