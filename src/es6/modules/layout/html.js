import {base} from '../../core.js';
import {dataBinder} from '../data-binder/data-binder.js';

const dataTracker = base.dataTracker;

/**
 * Html
 *
 * This will create an html object that can create
 * and remove dom elements.
 * @class
 */
export class Html
{
	/**
	 * This will create a new element.
	 *
	 * @param {string} nodeName The node name.
	 * @param {array} attrs The node attributes.
     * @param {object|null} content
	 * @param {object} container The node container.
	 * @return {object} The new element.
	 */
	create(nodeName, attrs, content, container)
	{
		let ele = document.createElement(nodeName);
        this.addAttributes(ele, attrs);
        this.addContent(ele, content);

		container.appendChild(ele);
		return ele;
    }

    /**
     * This will add the attributes to the element.
     *
     * @param {object} ele
     * @param {array} attrs
     */
    addAttributes(ele, attrs)
    {
        var length;
        if(!attrs || (length = attrs.length) < 1)
        {
            return;
        }

        for(var i = 0; i < length; i++)
        {
            var item = attrs[i];
            var prop = item.key;
            var value = item.value;

            if(prop.substr(4, 1) === '-')
			{
				// this will handle data and aria attributes
				base.setAttr(ele, prop, value);
			}
			else
			{
				this.addAttr(ele, item);
			}
        }
    }

    /**
     * This will add content to an element.
     *
     * @param {object} ele
     * @param {object|null} content
     */
    addContent(ele, content)
    {
        if(!content)
        {
            return;
        }

        if(content.textContent !== null)
        {
            ele.textContent = content.textContent;
        }
        else if(content.innerHTML)
        {
            ele.innerHTML = content.innerHTML;
        }
    }

	/**
	 * This will add html to an element.
	 *
	 * @param {object} obj
	 * @param {string} content
	 */
	addHtml(obj, content)
	{
		if(typeof content !== 'undefined' && content !== '')
		{
			/* we need to check if we are adding inner
			html content or just a string */
			let pattern = /(?:<[a-z][\s\S]*>)/i;
			if(pattern.test(content))
			{
				/* html */
				obj.innerHTML = content;
			}
			else
			{
				/* string */
				obj.textContent = content;
			}
		}
	}

	/**
	 * This will add an element attribute.
	 *
	 * @param {object} obj
	 * @param {object} attr
	 */
	addAttr(obj, attr)
	{
        const key = attr.key;
        const value = attr.value;
		if(value === '' || !key)
		{
			return false;
		}

		/* we want to check to add a value or an event listener */
		if(typeof value === 'function')
		{
			/* this will add the event using the base events
			so the event is tracked */
			base.addListener(key, obj, value);
		}
		else
		{
			obj[key] = value;
		}
	}

	/**
	 * This will create a doc fragment.
	 *
	 * @return {object}
	 */
	createDocFragment()
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
	createTextNode(text, container)
	{
		let obj = document.createTextNode(text);

		if(container)
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
	setupSelectOptions(selectElem, optionArray, defaultValue)
	{
		if(!selectElem || typeof selectElem !== 'object')
		{
			return false;
		}

		if(!optionArray || !optionArray.length)
		{
			return false;
		}

		/* create each option then add it to the select */
		for(var n = 0, maxLength = optionArray.length; n < maxLength; n++)
		{
			var settings = optionArray[n];
			var option = selectElem.options[n] = new Option(settings.label, settings.value);

			/* we can select an option if a default value
			has been sumbitted */
			if(defaultValue !== null && option.value == defaultValue)
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
	removeElementData(ele)
	{
		/* we want to do a recursive remove child
		removal */
		let children = ele.childNodes;
		if(children)
		{
			let length = children.length - 1;
			for(var i = length; i >= 0; i--)
			{
				var child = children[i];
				if(child)
				{
					/* this will remove the child element data
					before the parent is removed */
					this.removeElementData(child);
				}
			}
		}

		dataTracker.remove(ele);

		/* this will loop though the element attrs to
		check for any event listeners to cancel and
		remove any data binding */
		let attributes = ele.attributes;
		if(attributes)
		{
			/* this will only remove the data bind */
			let bound = attributes['data-bind-id'];
			if(bound)
			{
				/* this will check to remove any data bindings
				to the element */
				dataBinder.unbind(ele);
			}
		}
	}

	/**
	 * This will remove an element and its data.
	 *
	 * @param {object} obj
	 */
	removeElement(obj)
	{
		let container;

		if(!obj || !(container = obj.parentNode))
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
	 */
	removeChild(child)
	{
		this.removeElement(child);
	}

	/**
	 * This will remove all elements from the container.
	 *
	 * @param {object} container
	 */
	removeAll(container)
	{
		if(typeof container === 'object')
		{
			let children = container.childNodes;
			for(var child in children)
			{
				if(children.hasOwnProperty(child))
				{
					this.removeElementData(children[child]);
				}
			}
			container.innerHTML = '';
		}
	}

	/**
	 * This change the parent of an element.
	 *
	 * @param {object} child
	 * @param {object} newParent
	 */
	changeParent(child, newParent)
	{
		newParent.appendChild(child);
	}

	/**
	 * This will append a child element.
	 *
	 * @param {object} parent
	 * @param {object} child
	 */
	append(parent, child)
	{
		parent.appendChild(child);
	}

	/**
	 * This will prepend a child element.
	 *
	 * @param {object} parent
	 * @param {object} child
	 * @param {object} [optionalNode]
	 */
	prepend(parent, child, optionalNode)
	{
		var node = optionalNode || parent.firstChild;
		parent.insertBefore(child, node);
	}

	/**
	 * This will clone an element.
	 *
	 * @param {object} node
	 * @param {boolean} deepCopy
	 * @return {object}
	 */
	clone(node, deepCopy)
	{
		if(!node || typeof node !== 'object')
		{
			return false;
		}

		deepCopy = deepCopy || false;
		return node.cloneNode(deepCopy);
	}
}