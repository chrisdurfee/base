import { Events } from "../../main/events/events.js";
import { Dom } from '../../shared/dom.js';
import { Html, normalizeAttr, removeEventPrefix } from '../html/html.js';

/**
 * HtmlHelper
 *
 * This will build JSON layouts.
 *
 * @class
 */
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
	 * @return {object} The new element.
	 */
	static create(nodeName, attrs, container, parent)
	{
		let ele = document.createElement(nodeName);
        this.addAttributes(ele, attrs, parent);

		container.appendChild(ele);
		return ele;
    }

	/**
	 * This will add the element attributes.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {array} attrs
	 * @param {object} parent
     * @return {void}
	 */
	static addAttributes(ele, attrs, parent)
	{
		var length;
        if (!attrs || (length = attrs.length) < 1)
        {
            return;
        }

        for (var i = 0; i < length; i++)
        {
            var item = attrs[i];
            var prop = item.key;
            var value = item.value;

			if (prop === 'innerHTML')
			{
				obj.innerHTML = value;
				continue;
			}

            if (prop.substr(4, 1) === '-')
			{
				// this will handle data and aria attributes
				Dom.setAttr(ele, prop, value);
				continue;
			}

			this.addAttr(ele, prop, value, parent);
        }
	}

	/**
	 * This will add an element attribute.
	 *
	 * @param {object} ele
	 * @param {object} attr
	 * @param {string} value
     * @return {void}
	 */
	static addAttr(ele, attr, value, parent)
	{
		if (value === '' || !attr)
		{
			return false;
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
		}
		else
		{
			const attrName = normalizeAttr(attr);
			ele[attrName] = value;
		}
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
     * @return {void}
	 */
	static append(parent, child)
	{
		parent.appendChild(child);
	}
}