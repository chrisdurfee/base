import { Dom } from '../../shared/dom.js';
import { Html, normalizeAttr } from '../html/html.js';

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
	 * @param {object} attrObject The node attributes.
	 * @param {object} container The node container.
	 * @param {object} parent
	 * @return {object} The new element.
	 */
	static create(nodeName, attrObject, container, parent)
	{
		const obj = document.createElement(nodeName);
		this.addAttributes(obj, attrObject, parent);
		Html.append(container, obj);
		return obj;
	}

	/**
	 * This will add the element attributes.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {object} attrObject
	 * @param {object} parent
     * @return {void}
	 */
	static addAttributes(obj, attrObject, parent)
	{
		/* we want to check if we have attrributes to add */
		if (!attrObject || typeof attrObject !== 'object')
		{
			return;
		}

		/* we need to add the type if set to stop ie
		from removing the value if set after the value is
		added */
		const type = attrObject.type;
		if (typeof type !== 'undefined')
		{
			Dom.setAttr(obj, 'type', type);
		}

		/* we want to add each attr to the obj */
		for (var prop in attrObject)
		{
			/* we have already added the type so we need to
			skip if the prop is type */
			if (attrObject.hasOwnProperty(prop) === false || prop === 'type')
			{
				continue;
			}

			var attrPropValue = attrObject[prop];

			/* we want to check to add the attr settings
				by property name */
			if (prop === 'innerHTML')
			{
				obj.innerHTML = attrPropValue;
			}
			else if (prop.indexOf('-') !== -1)
			{
				// this will handle data and aria attributes
				Dom.setAttr(obj, prop, attrPropValue);
			}
			else
			{
				this.addAttr(obj, prop, attrPropValue, parent);
			}
		}
	}

	/**
	 * This will add an element attribute.
	 *
	 * @param {object} obj
	 * @param {object} attr
	 * @param {string} value
     * @return {void}
	 */
	static addAttr(obj, attr, value, parent)
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
			base.addListener(attr, obj, function(e)
			{
				value.call(this, e, parent);
			});
		}
		else
		{
			const attrName = normalizeAttr(attr);
			obj[attrName] = value;
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