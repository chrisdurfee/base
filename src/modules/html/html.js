import { DataTracker } from '../../main/data-tracker/data-tracker.js';
import { Events } from '../../main/events/events.js';
import { dataBinder } from '../data-binder/data-binder.js';

/**
 * Map for normalizing attribute names to their DOM property
 * equivalents. Map.get() is faster than plain-object lookup
 * for repeated reads on a fixed key set.
 *
 * @type {Map<string, string>}
 */
const NORMALIZED_NAMES = new Map([
	['class', 'className'],
	['text', 'textContent'],
	['for', 'htmlFor'],
	['readonly', 'readOnly'],
	['maxlength', 'maxLength'],
	['cellspacing', 'cellSpacing'],
	['rowspan', 'rowSpan'],
	['colspan', 'colSpan'],
	['tabindex', 'tabIndex'],
	['celpadding', 'cellPadding'],
	['useMap', 'useMap'],
	['frameborder', 'frameBorder'],
	['contenteditable', 'contentEditable']
]);

/**
 * This will get the javascript property name.
 *
 * @param {string} prop
 * @returns {string}
 */
export const normalizeAttr = (prop) =>
{
	return NORMALIZED_NAMES.get(prop) || prop;
};

/**
 * This will remove "on" from a property.
 *
 * @param {string} prop
 * @returns {string}
 */
export const removeEventPrefix = (prop) =>
{
	if (typeof prop === 'string' && prop.charCodeAt(0) === 111 /* o */ && prop.charCodeAt(1) === 110 /* n */)
	{
		return prop.substring(2);
	}
	return prop;
};

/**
 * Pre-compiled regex for detecting HTML markup in strings.
 * Hoisted to module level to avoid recompilation on every call.
 *
 * @type {RegExp}
 */
const HTML_PATTERN = /(?:<[a-z][\s\S]*>)/i;

/**
 * Html
 *
 * This will create html elements.
 *
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
	 * @returns {object} The new element.
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
	 * @param {object} obj
	 * @param {object} attrs
	 * @returns {void}
	 */
	static addAttributes(obj, attrs)
	{
		/* we want to check if we have attrributes to add */
		if (!attrs || typeof attrs !== 'object')
		{
			return;
		}

		/* we need to add the type if set to stop ie
		from removing the value if set after the value is
		added */
		const type = attrs.type;
		if (type !== undefined)
		{
			obj.setAttribute('type', type);
		}

		/* Object.keys + indexed for loop avoids the per-entry
		array allocation that Object.entries() creates. */
		const keys = Object.keys(attrs);
		for (let i = 0, len = keys.length; i < len; i++)
		{
			const prop = keys[i];
			const value = attrs[prop];

			/* we want to check to add the attr settings
			 by property name */
			if (prop === 'innerHTML')
			{
				obj.innerHTML = value;
			}
			else if (prop.indexOf('-') !== -1)
			{
				// this will handle data and aria attributes
				obj.setAttribute(prop, value);
			}
			else
			{
				this.addAttr(obj, prop, value);
			}
		}
	}

	/**
	 * This will add html to an element.
	 *
	 * @param {object} obj
	 * @param {string} content
	 * @returns {object}
	 */
	static addHtml(obj, content)
	{
		if (typeof content === 'undefined' || content === '')
		{
			return this;
		}

		/* we need to check if we are adding inner
		html content or just a string */
		if (HTML_PATTERN.test(content))
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
	 * @param {string} attr
	 * @param {*} value
	 * @returns {void}
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

			/**
			 * If the function has an originalCallback reference (added by Parser),
			 * pass it to Events.add so it can be properly tracked and removed.
			 */
			if (value.originalCallback)
			{
				Events.add(attr, obj, value, false, true, value.originalCallback);
			}
			else
			{
				Events.add(attr, obj, value);
			}
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
	 * @returns {object}
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
	 * @returns {object}
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
	 * @returns {object}
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
	 * @param {Array<any>} optionArray
	 * @param {string} [defaultValue]
	 */
	static setupSelectOptions(selectElem, optionArray, defaultValue)
	{
		if (!selectElem || typeof selectElem !== 'object')
		{
			return false;
		}

		if (!Array.isArray(optionArray))
		{
			return false;
		}

		optionArray.forEach((settings) =>
		{
			const option = new Option(settings.label, settings.value);
			selectElem.options.add(option);

			/* we can select an option if a default value
			has been sumbitted */
			if (defaultValue !== null && option.value == defaultValue)
			{
				option.selected = true;
			}
		});
	}

	/**
	 * This will remove an elements data.
	 *
	 * Uses an iterative depth-first traversal instead of recursion
	 * to avoid call-stack overhead on deep DOM trees.
	 *
	 * @param {object} ele
	 */
	static removeElementData(ele)
	{
		/* Seed the stack with the root element. */
		const stack = [ele];

		while (stack.length > 0)
		{
			const node = stack.pop();

			/* Push children first so they are processed before removal.
			 * Text nodes (nodeType 3) are skipped: the framework never
			 * attaches directives, events, bindings or tracker data to
			 * them, and they often make up half the nodes in a subtree. */
			const childNodes = node.childNodes;
			if (childNodes && childNodes.length > 0)
			{
				for (let i = childNodes.length - 1; i >= 0; i--)
				{
					const child = childNodes[i];
					if (child.nodeType !== 3)
					{
						stack.push(child);
					}
				}
			}

			DataTracker.remove(node);

			if (node.bindId)
			{
				dataBinder.unbind(node);
			}
		}
	}

	/**
	 * This will remove an element and its data.
	 *
	 * @param {object} obj
	 * @returns {object} this
	 */
	static removeElement(obj)
	{
		if (!obj)
		{
			return this;
		}

		/**
		 * This will check if the element has a manual destroy tracker.
		 */
		const manualDestroy = DataTracker.has(obj, 'manual-destroy');

		/* this will remove all element data and binding
		and remove from the parent container */
		this.removeElementData(obj);

		/**
		 * This will only remove the element if it does not have a
		 * manual destroy tracker.
		 */
		if (manualDestroy === false)
		{
			obj.remove();
		}

		return this;
	}

	/**
	 * This will remove an element.
	 *
	 * @param {object} child
	 * @returns {object} this
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
	 * @returns {object} this
	 */
	static removeAll(container)
	{
		if (!container || typeof container !== 'object')
		{
			return this;
		}

		/* Walk children and clean data/bindings, then remove in one pass.
		 * Using while + firstChild avoids both the Array.from snapshot
		 * and the innerHTML clear, keeping a single traversal. */
		let child;
		while ((child = container.firstChild))
		{
			this.removeElementData(child);
			container.removeChild(child);
		}

		return this;
	}

	/**
	 * This change the parent of an element.
	 *
	 * @param {object} child
	 * @param {object} newParent
	 * @returns {object} this
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
	 * @returns {object} this
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
	 * @returns {object}
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
	 * @param {boolean} [deepCopy=false]
	 * @returns {object}
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