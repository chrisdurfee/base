import { Arrays } from './arrays.js';
import { Strings } from './strings.js';
import { Types } from './types.js';

/**
 * Dom
 *
 * This will contain methods for working with the dom.
 *
 * @module
 * @name Dom
 */
export class Dom
{
    /**
	 * This will select an element by id.
	 *
	 * @param {string} id
	 * @returns {object|boolean} The element object or false.
	 */
	static getById(id)
	{
		if (typeof id !== 'string')
		{
			return false;
		}

		const obj = document.getElementById(id);
		return (obj || false);
	}

	/**
	 * This will select elements by name.
	 *
	 * @param {string} name
	 * @returns {object|boolean} The elements array or false.
	 */
	static getByName(name)
	{
		if (typeof name !== 'string')
		{
			return false;
		}

		const obj = document.getElementsByName(name);
		return (obj)? Arrays.toArray(obj) : false;
	}

	/**
	 * This will select by css selector.
	 *
	 * @param {string} selector
	 * @param {boolean} single Set to true if you only want one result.
	 * @returns {*}
	 */
	static getBySelector(selector, single)
	{
		if (typeof selector !== 'string')
		{
			return false;
		}

		/* we want to check if we are only selecting
		the first element or all elements */
		single = single || false;
		if (single === true)
		{
			const obj = document.querySelector(selector);
			return (obj || false);
		}

		const elements = document.querySelectorAll(selector);
		if (!elements)
		{
			return false;
		}

		/* if there is only one result just return the
		first element in the node list */
		return (elements.length === 1)? elements[0] : Arrays.toArray(elements);
	}

	/**
	 * This will get or set the innerHTML or an element.
	 *
	 * @param {object} obj
	 * @param {string} [html] If the html is not set, the html of the
	 * element will be returned.
	 *
	 * @returns {*}
	 */
	static html(obj, html)
	{
		if (Types.isObject(obj) === false)
		{
			return false;
		}

		/* we want to check if we are getting the
		html or adding the html */
		if (Types.isUndefined(html) === false)
		{
			obj.innerHTML = html;
			return this;
		}

		return obj.innerHTML;
	}

	/**
	 * This will set the css property of an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {string} value
	 * @returns {object} an instance of base.
	 */
	static setCss(obj, property, value)
	{
		if (Types.isObject(obj) === false || Types.isUndefined(property))
		{
			return this;
		}

		property = Strings.uncamelCase(property);
		obj.style[property] = value;
		return this;
	}

	/**
	 * This will get the css property of an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @returns {*}
	 */
	static getCss(obj, property)
	{
		if (!obj || typeof property === 'undefined')
		{
			return false;
		}

		property = Strings.uncamelCase(property);
		let css = obj.style[property];
		if (css !== '')
		{
			return css;
		}

		/* we want to check if we have an inherited
		value */
		let currentValue = null;
		const currentStyle = obj.currentStyle;
		if (currentStyle && (currentValue = currentStyle[property]))
		{
			return currentValue;
		}

		const inheritedStyle = window.getComputedStyle(obj, null);
		if (inheritedStyle)
		{
			return inheritedStyle[property];
		}

		return css;
	}

	/**
	 * This will get or set the css propety or an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {string} [value]
	 * @returns {*}
	 */
	static css(obj, property, value)
	{
		/* we want to check if we are getting the
		value or setting the value */
		if (typeof value !== 'undefined')
		{
			this.setCss(obj, property, value);

			return this;
		}

		return this.getCss(obj, property);
	}

	/**
	 * This will remove an attribute from an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @returns {object} an instance of base.
	 */
	static removeAttr(obj, property)
	{
		if (Types.isObject(obj))
		{
			obj.removeAttribute(property);
		}
		return this;
	}

	/**
	 * This will set an attribute of an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {string} value
	 * @returns {void}
	 */
	static setAttr(obj, property, value)
	{
		obj.setAttribute(property, value);
	}

	/**
	 * This will get an attribute of an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @returns {string}
	 */
	static getAttr(obj, property)
	{
		return obj.getAttribute(property);
	}

	/**
	 * This will get or set an attribute from an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {string} [value]
	 * @returns {*}
	 */
	static attr(obj, property, value)
	{
		if (Types.isObject(obj) === false)
		{
			return false;
		}

		/* we want to check if we are getting the
		value or setting the value */
		if (typeof value !== 'undefined')
		{
			/* we want to check to set the value */
			this.setAttr(obj, property, value);

			return this;
		}

		return this.getAttr(obj, property);
	}

	/**
	 * This will prefix a string with "data-" if not set.
	 *
	 * @protected
	 * @param {string} prop
	 * @returns {string}
	 */
	static _checkDataPrefix(prop)
	{
		if (typeof prop !== 'string')
		{
			return prop;
		}

		/* we want to de camelcase if set */
		prop = Strings.uncamelCase(prop);
		if (prop.substring(0, 5) !== 'data-')
		{
			prop = 'data-' + prop;
		}

		return prop;
	}

	/**
	 * This will remove "data-" from a string.
	 *
	 * @protected
	 * @param {string} prop
	 * @returns {string}
	 */
	static removeDataPrefix(prop)
	{
		if (typeof prop === 'string' && prop.substring(0, 5) === 'data-')
		{
			prop = prop.substring(5);
		}
		return prop;
	}

	/**
	 * This will set data to an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {string} value
	 */
	static setData(obj, property, value)
	{
		/* this will return the property without the data prefix */
		property = this.removeDataPrefix(property);
		property = Strings.camelCase(property);

		obj.dataset[property] = value;
	}

	/**
	 * This will get data from an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @returns {string}
	 */
	static getData(obj, property)
	{
		property = Strings.camelCase(this.removeDataPrefix(property));
		return obj.dataset[property];
	}

	/**
	 * This will get or set data to an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {string} [value]
	 * @returns {*}
	 */
	static data(obj, property, value)
	{
		if (Types.isObject(obj) === false)
		{
			return false;
		}

		if (typeof value !== 'undefined')
		{
			this.setData(obj, property, value);
			return this;
		}

		return this.getData(obj, property);
	}

	/**
	 * This will find elements in an element.
	 *
	 * @param {object} obj
	 * @param {string} queryString
	 * @returns {array}
	 */
	static find(obj, queryString)
	{
		if (!obj || typeof queryString !== 'string')
		{
			return [];
		}

		return obj.querySelectorAll(queryString);
	}

	/**
	 * This will display an element.
	 *
	 * @param {object} obj
	 * @returns {object} An instance of base.
	 */
	static show(obj)
	{
		if (Types.isObject(obj) === false)
		{
			return this;
		}

		/* we want to get the previous display style
		from the data-style-display attr */
		const previous = this.data(obj, 'style-display'),
		value = (typeof previous === 'string')? previous : '';

		this.css(obj, 'display', value);
		return this;
	}

	/**
	 * This will hide an element.
	 *
	 * @param {object} obj
	 * @returns {object} An instance of base.
	 */
	static hide(obj)
	{
		if (Types.isObject(obj) === false)
		{
			return this;
		}

		/* we want to set the previous display style
		on the element as a data attr */
		const previous = this.css(obj, 'display');
		if (previous !== 'none' && previous)
		{
			this.data(obj, 'style-display', previous);
		}

		this.css(obj, 'display', 'none');
		return this;
	}

	/**
	 * This will toggle the display an element.
	 *
	 * @param {object} obj
	 * @returns {object} An instance of base.
	 */
	static toggle(obj)
	{
		if (Types.isObject(obj) === false)
		{
			return this;
		}

		const mode = this.css(obj, 'display');
		if (mode !== 'none')
		{
			this.hide(obj);
		}
		else
		{
			this.show(obj);
		}
		return this;
	}

	/**
	 * This will get the size of an element.
	 *
	 * @param {object} obj
	 * @returns {object|boolean} A size object or false.
	 */
	static getSize(obj)
	{
		if (Types.isObject(obj) === false)
		{
			return false;
		}

		return {
			width: this.getWidth(obj),
			height: this.getHeight(obj)
		};
	}

	/**
	 * This will get the width of an element.
	 *
	 * @param {object} obj
	 * @returns {number|boolean} A width or false.
	 */
	static getWidth(obj)
	{
		/* we want to check if the object is not supplied */
		return (Types.isObject(obj))? obj.offsetWidth : false;
	}

	/**
	 * This will get the height of an element.
	 *
	 * @param {object} obj
	 * @returns {number|boolean} A height or false.
	 */
	static getHeight(obj)
	{
		/* we want to check if the object is not supplied */
		return (Types.isObject(obj))? obj.offsetHeight : false;
	}

	/**
	* This will get the scroll position.
	*
	* @param {object} [obj] The element or document element if not set.
	* @returns {object}
	*/
	static getScrollPosition(obj)
	{
		let left = 0, top = 0;
		switch (typeof obj)
		{
			case 'undefined':
				obj = document.documentElement;
				left = obj.scrollLeft;
				top = obj.scrollTop;
				break;
			case 'object':
				left = obj.scrollLeft;
				top = obj.scrollTop;
				break;
		}

		if (Types.isObject(obj) === false)
		{
			return false;
		}

		return {
			left: left - (obj.clientLeft || 0),
			top: top - (obj.clientTop || 0)
		};
	}

	/**
	 * This will get the scroll top position.
	 *
	 * @param {object} [obj] The element or document element if not set.
	 * @returns {object}
	 */
	static getScrollTop(obj)
	{
		const position = this.getScrollPosition(obj);
		return position.top;
	}

	/**
	 * This will get the scroll left position.
	 *
	 * @param {object} [obj] The element or document element if not set.
	 * @returns {object}
	 */
	static getScrollLeft(obj)
	{
		const position = this.getScrollPosition(obj);
		return position.left;
	}

	/**
	 * This will get the window size.
	 *
	 * @returns {object}
	 */
	static getWindowSize()
	{
		const w = window,
		doc = document,
		de = doc.documentElement,
		b = doc.getElementsByTagName('body')[0],
		width = w.innerWidth || de.clientWidth || b.clientWidth,
		height = w.innerHeight || de.clientHeight || b.clientHeight;

		return {
			width,
			height
		};
	}

	/**
	 * This will get the document size.
	 *
	 * @returns {object}
	 */
	static getDocumentSize()
	{
		const doc = document,
		body = doc.body,
		html = doc.documentElement,

		height = Math.max(
			body.scrollHeight,
			body.offsetHeight,
			html.clientHeight,
			html.scrollHeight,
			html.offsetHeight
		),

		width = Math.max(
			body.scrollWidth,
			body.offsetWidth,
			html.clientWidth,
			html.scrollWidth,
			html.offsetWidth
		);

		return {
			width,
			height
		};
	}

	/**
	 * This will get the document height.
	 *
	 * @returns {object}
	 */
	static getDocumentHeight()
	{
		return this.getDocumentSize().height;
	}

	/**
	 * This will get the position of an element.
	 *
	 * @param {object} obj
	 * @param {number} [depth] The number of levels, default is 1, 0 is to the root.
	 * @returns {object}
	 */
	static position(obj, depth = 1)
	{
		const position = {x: 0, y: 0};

		if (Types.isObject(obj) === false)
		{
			return position;
		}

		/* if the depth is 0 we will travel to the
		top element */
		let count = 0;
		while (obj && (depth === 0 || count < depth))
		{
			count++;
			position.x += (obj.offsetLeft + obj.clientLeft);
			position.y += (obj.offsetTop + obj.clientTop);
			obj = obj.offsetParent;
		}

		return position;
	}

	/**
	 * This will add a class to an element.
	 *
	 * @param {object} obj
	 * @param {string} tmpClassName
	 * @returns {object}
	 */
	static addClass(obj, tmpClassName)
	{
		if (Types.isObject(obj) === false || tmpClassName === '')
		{
			return this;
		}

		if (typeof tmpClassName === 'string')
		{
			/* we want to divide the string by spaces and
			add any class listed */
			const adding = tmpClassName.split(' ');
			for (var i = 0, maxLength = adding.length; i < maxLength; i++)
			{
				obj.classList.add(tmpClassName);
			}
		}
		return this;
	}

	/**
	 * This will remove a class or classes from an element.
	 *
	 * @param {object} obj
	 * @param {string} [tmpClassName]
	 * @returns {object}
	 */
	static removeClass(obj, tmpClassName)
	{
		if (Types.isObject(obj) === false || tmpClassName === '')
		{
			return this;
		}

		/* if no className was specified we will remove all classes from object */
		if (typeof tmpClassName === 'undefined')
		{
			obj.className = '';
		}
		else
		{
			obj.classList.remove(tmpClassName);
		}
		return this;
	}

	/**
	 * This will check if an element has a class.
	 *
	 * @param {object} obj
	 * @param {string} tmpClassName
	 * @returns {boolean}
	 */
	static hasClass(obj, tmpClassName)
	{
		if (Types.isObject(obj) === false || tmpClassName === '')
		{
			return false;
		}

		return obj.classList.contains(tmpClassName);
	}

	/**
	 * This will toggle a class on an element.
	 *
	 * @param {object} obj
	 * @param {string} tmpClassName
	 * @returns {object}
	 */
	static toggleClass(obj, tmpClassName)
	{
		if (Types.isObject(obj) === false)
		{
			return this;
		}

		obj.classList.toggle(tmpClassName);
		return this;
	}
}