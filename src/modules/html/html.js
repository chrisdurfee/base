import { DataTracker } from '../../main/data-tracker/data-tracker.js';
import { Events } from '../../main/events/events.js';
import { Dom } from '../../shared/dom.js';
import { dataBinder } from '../data-binder/data-binder.js';

/**
 * This is a look up object to normalize the attribute names.
 *
 * @type {object}
 */
const NORMALIZED_NAMES =
{
	class: 'className',
	text: 'textContent',
	for: 'htmlFor',
	readonly: 'readOnly',
	maxlength: 'maxLength',
	cellspacing: 'cellSpacing',
	rowspan: 'rowSpan',
	colspan: 'colSpan',
	tabindex: 'tabIndex',
	celpadding: 'cellPadding',
	useMap: 'useMap',
	frameborder: 'frameBorder',
	contenteditable: 'contentEditable'
};

/**
 * This will get the javascript property name.
 *
 * @param {string} prop
 * @return {string}
 */
export const normalizeAttr = (prop) =>
{
	return NORMALIZED_NAMES[prop] || prop;
};

/**
 * This will remove on from a property.
 *
 * @param {string} prop
 * @return {string}
 */
export const removeEventPrefix = (prop) =>
{
	if (typeof prop === 'string' && prop.substring(0, 2) === 'on')
	{
		return prop.substring(2);
	}
	return prop;
};

/**
 * Html
 *
 * This will create html elements.
 * @class
 */
export class Html
{
	/**
	 * This will create a new element.
	 *
	 * @param {string} node The node name.
	 * @param {object} attrs The node attributes.
	 * @param {object} container The node container.
	 * @param {boolean} [prepend=false] Add to the begining of the container.
	 * @return {object} The new element.
	 */
	static create(node, attrs, container, prepend)
	{
		const obj = document.createElement(node);
		this.addAttributes(obj, attrs);

		/* we want to check if the new element should be
		added to the begining or end */
		if (prepend === true)
		{
			this.prepend(container, obj);
		}
		else
		{
			this.append(container, obj);
		}
		return obj;
	}

	/**
	 * This will add the element attributes.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {object} attrs
	 */
	static addAttributes(obj, attrs)
	{
		/* we want to check if we have attrributes to add */
		if (!attrs || typeof attrs !== 'object')
		{
			return false;
		}

		/* we need to add the type if set to stop ie
		from removing the value if set after the value is
		added */
		const type = attrs.type;
		if (typeof type !== 'undefined')
		{
			Dom.setAttr(obj, 'type', type);
		}

		/* we want to add each attr to the obj */
		for (var prop in attrs)
		{
			/* we have already added the type so we need to
			skip if the prop is type */
			if (!Object.prototype.hasOwnProperty.call(attrs, prop) || prop === 'type')
			{
				continue;
			}

			var attrPropValue = attrs[prop];

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
				this.addAttr(obj, prop, attrPropValue);
			}
		}
	}

	/**
	 * This will add html to an element.
	 *
	 * @param {object} obj
	 * @param {string} content
	 * @return {object}
	 */
	static addHtml(obj, content)
	{
		if (typeof content === 'undefined' || content === '')
		{
			return this;
		}

		/* we need to check if we are adding inner
		html content or just a string */
		const pattern = /(?:<[a-z][\s\S]*>)/i;
		if (pattern.test(content))
		{
			/* html */
			obj.innerHTML = content;
		}
		else
		{
			/* string */
			obj.textContent = content;
		}
		return this;
	}

	/**
	 * This will add an element attribute.
	 *
	 * @param {object} obj
	 * @param {object} attr
	 * @param {string} value
	 * @return {void}
	 */
	static addAttr(obj, attr, value)
	{
		if (value === '' || !attr)
		{
			return;
		}

		/* we want to check to add a value or an event listener */
		const type = typeof value;
		if (type === 'function')
		{
			/* this will add the event using the events
			so the event is tracked */
			attr = removeEventPrefix(attr);
			Events.add(attr, obj, value);
		}
		else
		{
			const attrName = normalizeAttr(attr);
			obj[attrName] = value;
		}
	}

	/**
	 * This will create a doc fragment.
	 *
	 * @return {object}
	 */
	static createDocFragment()
	{
		return document.createDocumentFragment();
	}

	/**
	 * This will create a text node.
	 *
	 * @param {string} text
	 * @param {object} container
	 * @return {object}
	 */
	static createText(text, container)
	{
		const obj = document.createTextNode(text);

		if (container)
		{
			this.append(container, obj);
		}
		return obj;
	}

	/**
	 * This will create a text node.
	 *
	 * @param {string} text
	 * @param {object} container
	 * @return {object}
	 */
	static createComment(text, container)
	{
		const obj = document.createComment(text);

		if (container)
		{
			this.append(container, obj);
		}
		return obj;
	}

	/**
	 * This will create the options on a select.
	 *
	 * @param {object} selectElem
	 * @param {array} optionArray
	 * @param {string} [defaultValue]
	 */
	static setupSelectOptions(selectElem, optionArray, defaultValue)
	{
		if (!selectElem || typeof selectElem !== 'object')
		{
			return false;
		}

		if (!optionArray || !optionArray.length)
		{
			return false;
		}

		/* create each option then add it to the select */
		for (var n = 0, maxLength = optionArray.length; n < maxLength; n++)
		{
			var settings = optionArray[n];
			var option = selectElem.options[n] = new Option(settings.label, settings.value);

			/* we can select an option if a default value
			has been sumbitted */
			if (defaultValue !== null && option.value == defaultValue)
			{
				option.selected = true;
			}
		}
	}

	/**
	 * This will remove an elements data.
	 *
	 * @param {object} ele
	 */
	static removeElementData(ele)
	{
		/* we want to do a recursive remove child
		removal */
		const children = ele.childNodes;
		if (children)
		{
			const length = children.length - 1;
			for (var i = length; i >= 0; i--)
			{
				var child = children[i];
				if (!child)
				{
					continue;
				}

				/* this will remove the child element data
				before the parent is removed */
				this.removeElementData(child);
			}
		}

		DataTracker.remove(ele);

		const bound = ele.bindId;
		if (bound)
		{
			/* this will check to remove any data bindings
			to the element */
			dataBinder.unbind(ele);
		}
	}

	/**
	 * This will remove an element and its data.
	 *
	 * @param {object} obj
	 * @return {object} this
	 */
	static removeElement(obj)
	{
		let container;

		if (!obj || !(container = obj.parentNode))
		{
			return this;
		}

		/* this will remove all element data and binding
		and remove from the parent container */
		this.removeElementData(obj);
		container.removeChild(obj);

		return this;
	}

	/**
	 * This will remove an element.
	 *
	 * @param {object} child
	 * @return {object} this
	 */
	static removeChild(child)
	{
		this.removeElement(child);
		return this;
	}

	/**
	 * This will remove all elements from the container.
	 *
	 * @param {object} container
	 * @return {object} this
	 */
	static removeAll(container)
	{
		if (typeof container !== 'object')
		{
			return this;
		}

		const children = container.childNodes;
		for (var child in children)
		{
			if (Object.prototype.hasOwnProperty.call(children, child))
			{
				this.removeElementData(children[child]);
			}
		}
		container.innerHTML = '';
		return this;
	}

	/**
	 * This change the parent of an element.
	 *
	 * @param {object} child
	 * @param {object} newParent
	 * @return {object} this
	 */
	static changeParent(child, newParent)
	{
		newParent.appendChild(child);
		return this;
	}

	/**
	 * This will append a child element.
	 *
	 * @param {object} parent
	 * @param {object} child
	 * @return {object} this
	 */
	static append(parent, child)
	{
		parent.appendChild(child);
		return this;
	}

	/**
	 * This will prepend a child element.
	 *
	 * @param {object} parent
	 * @param {object} child
	 * @param {object} [optionalNode]
	 * @return {object}
	 */
	static prepend(parent, child, optionalNode)
	{
		const node = optionalNode || parent.firstChild;
		parent.insertBefore(child, node);
		return this;
	}

	/**
	 * This will clone an element.
	 *
	 * @param {object} node
	 * @param {boolean} deepCopy
	 * @return {object}
	 */
	static clone(node, deepCopy = false)
	{
		if (!node || typeof node !== 'object')
		{
			return false;
		}

		return node.cloneNode(deepCopy);
	}
}