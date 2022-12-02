/**
 * Base Framework
 * @version 2.6.0
 * @author Chris Durfee
 * @file This is a javascript framework to allow complex
 * functions to work in many browsers and versions.
 */

 import {Objects} from './shared/objects.js';
 import {DataTracker} from './data-tracker.js';

const global = window;

/**
 * base framework constructor
 * @class
 */
class Base
{
	constructor()
	{
		/**
		 * @member {string} version
		 */
		this.version = '2.6.0';

		/**
		 * @member {array} errors
		 */
		this.errors = [];

		/**
		 * @member {object} dataTracker
		 */
		this.dataTracker = new DataTracker();
	}

	/**
	 * this will augement the base framework with new functionality.
	 *
	 * @param {object} methods The new methods to add.
	 * @return {object} An instance of base.
	 */
	augment(methods)
	{
		if(!methods || typeof methods !== 'object')
		{
			return this;
		}

		const prototype = this.constructor.prototype;
		for(var property in methods)
		{
			if(methods.hasOwnProperty(property))
			{
				prototype[property] = methods[property];
			}
		}
		return this;
	}

	/**
	 * This will convert a nodelist into an array.
	 *
	 * @param {object} list
	 * @return {array}
	 */
	listToArray(list)
	{
		return Array.prototype.slice.call(list);
	}

	/**
	 * This will override a method function with a new function.
	 *
	 * @param {object} obj The object being modified.
	 * @param {string} methodName the method name being overriden.
	 * @param {function} overrideMethod The new function to call.
	 * @param {array} args The args to pass to the first function call.
	 *
	 * @return {*} The results of the function being called.
	 */
	override(obj, methodName, overrideMethod, args)
	{
		return (obj[methodName] = overrideMethod).apply(obj, this.listToArray(args));
	}

	/**
	 * This will get the last error.
	 * @return {(object|boolean)} The last error or false.
	 */
	getLastError()
	{
		const errors = this.errors;
		return (errors.length)? errors.pop() : false;
	}

	/**
	 * This will add an error.
	 *
	 * @param {object} err
	 */
	addError(err)
	{
		this.errors.push(err);
	}

	/**
	 * This will parse a query string.
	 *
	 * @param {string} [str] The string to parse or the global
	 * location will be parsed.
	 * @param {bool} [decode]
	 * @return {object}
	 */
	parseQueryString(str, decode)
	{
		if(typeof str !== 'string')
		{
			str = global.location.search;
		}

		let objURL = {},
		regExp = /([^?=&]+)(=([^&]*))?/g;
		str.replace(regExp, function(a, b, c, d)
		{
			/* we want to save the key and the
			value to the objURL */
			objURL[b] = (decode !== false)? decodeURIComponent(d) : d;
		});

		return objURL;
	}

	/**
	 * This will check if an object is empty.
	 *
	 * @param {object} obj
	 * @return {boolean}
	 */
	isEmpty(obj)
	{
		if(this.isObject(obj) === false)
		{
			return true;
		}

		/* we want to loop through each property and
		check if it belongs to the object directly */
		for(var key in obj)
		{
			if(obj.hasOwnProperty(key))
			{
				return false;
			}
		}
		return true;
	}

	/**
	 * This will select an element by id.
	 *
	 * @param {string} id
	 * @return {(object|boolean)} The element object or false.
	 */
	getById(id)
	{
		if(typeof id !== 'string')
		{
			return false;
		}
		let obj = document.getElementById(id);
		return (obj || false);
	}

	/**
	 * This will select elements by name.
	 *
	 * @param {string} name
	 * @return {(object|boolean)} The elements array or false.
	 */
	getByName(name)
	{
		if(typeof name !== 'string')
		{
			return false;
		}
		let obj = document.getElementsByName(name);
		return (obj)? this.listToArray(obj) : false;
	}

	/**
	 * This will select by css selector.
	 *
	 * @param {string} selector
	 * @param {boolean} single Set to true if you only want one result.
	 * @return {*}
	 */
	getBySelector(selector, single)
	{
		if(typeof selector !== 'string')
		{
			return false;
		}

		/* we want to check if we are only selecting
		the first element or all elements */
		single = single || false;
		if(single === true)
		{
			let obj = document.querySelector(selector);
			return (obj || false);
		}

		let elements = document.querySelectorAll(selector);
		if(elements)
		{
			/* if there is only one result just return the
			first element in the node list */
			return (elements.length === 1)? elements[0] : this.listToArray(elements);
		}
		return false;
	}

	/**
	 * This will get or set the innerHTML or an element.
	 *
	 * @param {object} obj
	 * @param {string} [html] If the html is not set, the html of the
	 * element will be returned.
	 *
	 * @return {(string|void)}
	 */
	html(obj, html)
	{
		if(this.isObject(obj) === false)
		{
			return false;
		}

		/* we want to check if we are getting the
		html or adding the html */
		if(this.isUndefined(html) === false)
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
	 * @return {object} an instance of base.
	 */
	setCss(obj, property, value)
	{
		if(this.isObject(obj) === false || this.isUndefined(property))
		{
			return this;
		}

		property = this.uncamelCase(property);
		obj.style[property] = value;
		return this;
	}

	/**
	 * This will get the css property of an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @return {(string|null)}
	 */
	getCss(obj, property)
	{
		if(!obj || typeof property === 'undefined')
		{
			return false;
		}

		property = this.uncamelCase(property);
		var css = obj.style[property];
		if(css !== '')
		{
			return css;
		}

		/* we want to check if we have an inherited
		value */
		var currentValue = null,
		currentStyle = obj.currentStyle;
		if(currentStyle && (currentValue = currentStyle[property]))
		{
			css = currentValue;
		}
		else
		{
			var inheritedStyle = window.getComputedStyle(obj, null);
			if(inheritedStyle)
			{
				css = inheritedStyle[property];
			}
		}

		return css;
	}

	/**
	 * This will get or set the css propety or an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {string} [value]
	 * @return {(string|void)}
	 */
	css(obj, property, value)
	{
		/* we want to check if we are getting the
		value or setting the value */
		if(typeof value !== 'undefined')
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
	 * @return {object} an instance of base.
	 */
	removeAttr(obj, property)
	{
		if(this.isObject(obj))
		{
			obj.removeAttribute(property);
		}
		return this;
	}

	/**
	 * This will set an attribute of an element.
	 *
	 * @private
	 * @param {object} obj
	 * @param {string} property
	 * @param {string} value
	 * @return {void}
	 */
	setAttr(obj, property, value)
	{
		obj.setAttribute(property, value);
	}

	/**
	 * This will get an attribute of an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @return {string}
	 */
	getAttr(obj, property)
	{
		return obj.getAttribute(property);
	}

	/**
	 * This will get or set an attribute from an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {string} [value]
	 * @return {(string|void)}
	 */
	attr(obj, property, value)
	{
		if(this.isObject(obj) === false)
		{
			return false;
		}

		/* we want to check if we are getting the
		value or setting the value */
		if(typeof value !== 'undefined')
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
	 * @return {string}
	 */
	_checkDataPrefix(prop)
	{
		if(typeof prop !== 'string')
		{
			return prop;
		}

		/* we want to de camelcase if set */
		prop = base.uncamelCase(prop);
		if(prop.substring(0, 5) !== 'data-')
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
	 * @return {string}
	 */
	_removeDataPrefix(prop)
	{
		if(typeof prop === 'string' && prop.substring(0, 5) === 'data-')
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
	setData(obj, property, value)
	{
		/* this will return the property without the data prefix */
		property = this._removeDataPrefix(property);
		property = base.camelCase(property);

		obj.dataset[property] = value;
	}

	/**
	 * This will get data from an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {string} value
	 * @return {string}
	 */
	getData(obj, property)
	{
		property = base.camelCase(this._removeDataPrefix(property));
		return obj.dataset[property];
	}

	/**
	 * This will get or set data to an element.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {string} [value]
	 * @return {(string|void)}
	 */
	data(obj, property, value)
	{
		if(this.isObject(obj) === false)
		{
			return false;
		}

		if(typeof value !== 'undefined')
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
	 * @return {array}
	 */
	find(obj, queryString)
	{
		if(!obj || typeof queryString !== 'string')
		{
			return false;
		}

		return obj.querySelectorAll(queryString);
	}

	/**
	 * This will display an element.
	 *
	 * @param {object} obj
	 * @return {object} An instance of base.
	 */
	show(obj)
	{
		if(this.isObject(obj) === false)
		{
			return this;
		}

		/* we want to get the previous display style
		from the data-style-display attr */
		let previous = this.data(obj, 'style-display'),
		value = (typeof previous === 'string')? previous : '';

		this.css(obj, 'display', value);
		return this;
	}

	/**
	 * This will hide an element.
	 *
	 * @param {object} obj
	 * @return {object} An instance of base.
	 */
	hide(obj)
	{
		if(this.isObject(obj) === false)
		{
			return this;
		}

		/* we want to set the previous display style
		on the element as a data attr */
		let previous = this.css(obj, 'display');
		if(previous !== 'none' && previous)
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
	 * @return {object} An instance of base.
	 */
	toggle(obj)
	{
		if(this.isObject(obj) === false)
		{
			return this;
		}

		let mode = this.css(obj, 'display');
		if(mode !== 'none')
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
	 * This will camelCase a string.
	 *
	 * @param {string} str
	 * @return {(string|boolean)} The string or false.
	 */
	camelCase(str)
	{
		if(typeof str !== 'string')
		{
			return false;
		}

		let regExp = /(-|\s|\_)+\w{1}/g;
		return str.replace(regExp, function(match)
		{
			return match[1].toUpperCase();
		});
	}

	/**
	 * This will uncamel-case a string.
	 *
	 * @param {string} str
	 * @param {string} delimiter
	 * @return {(string|boolean)} The string or false.
	 */
	uncamelCase(str, delimiter)
	{
		if(typeof str !== 'string')
		{
			return false;
		}

		delimiter = delimiter || '-';

		let regExp = /([A-Z]{1,})/g;
		return str.replace(regExp, function(match)
		{
			return delimiter + match.toLowerCase();
		}).toLowerCase();
	}

	/**
	 * This will get the size of an element.
	 *
	 * @param {object} obj
	 * @return {(object|boolean)} A size object or false.
	 */
	getSize(obj)
	{
		if(this.isObject(obj) === false)
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
	 * @return {(int|boolean)} A width or false.
	 */
	getWidth(obj)
	{
		/* we want to check if the object is not supplied */
		return (this.isObject(obj))? obj.offsetWidth : false;
	}

	/**
	 * This will get the height of an element.
	 *
	 * @param {object} obj
	 * @return {(int|boolean)} A height or false.
	 */
	getHeight(obj)
	{
		/* we want to check if the object is not supplied */
		return (this.isObject(obj))? obj.offsetHeight : false;
	}

	/**
	* This will get the scroll position.
	*
	* @param {object} [obj] The element or document element if not set.
	* @return {object}
	*/
	getScrollPosition(obj)
	{
		let left = 0, top = 0;
		switch(typeof obj)
		{
			case 'undefined':
				obj = document.documentElement;
				left = (window.pageXOffset || obj.scrollLeft);
				top = (window.pageYOffset || obj.scrollTop);
				break;
			case 'object':
				left = obj.scrollLeft;
				top = obj.scrollTop;
				break;
		}

		if(this.isObject(obj) === false)
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
	 * @return {object}
	 */
	getScrollTop(obj)
	{
		let position = this.getScrollPosition(obj);
		return position.top;
	}

	/**
	 * This will get the scroll left position.
	 *
	 * @param {object} [obj] The element or document element if not set.
	 * @return {object}
	 */
	getScrollLeft(obj)
	{
		let position = this.getScrollPosition(obj);
		return position.left;
	}

	/**
	 * This will get the window size.
	 *
	 * @return {object}
	 */
	getWindowSize()
	{
		let w = window,
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
	 * @return {object}
	 */
	getDocumentSize()
	{
		let doc = document,
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
	 * @return {object}
	 */
	getDocumentHeight()
	{
		return this.getDocumentSize().height;
	}

	/**
	 * This will get the value from a property on an object.
	 *
	 * @param {object} obj
	 * @param {string} property
	 * @param {*} [defaultText] A value if no value is set.
	 * @return {string}
	 */
	getProperty(obj, property, defaultText)
	{
		if(this.isObject(obj) === false)
		{
			return '';
		}

		let value = obj[property];
		if(typeof value !== 'undefined')
		{
			return value;
		}

		/* if no value was available
		we want to return an empty string */
		return (typeof defaultText !== 'undefined')? defaultText : '';
	}

	/**
	 * This will get the position of an element.
	 *
	 * @param {object} obj
	 * @param {boolean} [depth] The number of levels, default is 1, 0 is to the root.
	 * @return {object}
	 */
	position(obj, depth = 1)
	{
		let position = {x: 0, y: 0};

		if(this.isObject(obj) === false)
		{
			return position;
		}

		/* if the depth is 0 we will travel to the
		top element */
		let count = 0;
		while(obj && (depth === 0 || count < depth))
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
	 */
	addClass(obj, tmpClassName)
	{
		if(this.isObject(obj) === false || tmpClassName === '')
		{
			return this;
		}

		if(typeof tmpClassName === 'string')
		{
			/* we want to divide the string by spaces and
			add any class listed */
			let adding = tmpClassName.split(' ');
			for(var i = 0, maxLength = adding.length; i < maxLength; i++)
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
	 */
	removeClass(obj, tmpClassName)
	{
		if(this.isObject(obj) === false || tmpClassName === '')
		{
			return this;
		}

		/* if no className was specified we will remove all classes from object */
		if(typeof tmpClassName === 'undefined')
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
	 * @return {boolean}
	 */
	hasClass(obj, tmpClassName)
	{
		if(this.isObject(obj) === false || tmpClassName === '')
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
	 * @return {object} An instance of base.
	 */
	toggleClass(obj, tmpClassName)
	{
		if(this.isObject(obj) === false)
		{
			return this;
		}

		obj.classList.toggle(tmpClassName);
		return this;
	}

	/**
	 * This will get the type of a variable.
	 *
	 * @param {*} data
	 * @return {string}
	 */
	getType(data)
	{
		const type = typeof data;
		if(type !== 'object')
		{
			return type;
		}

		return (this.isArray(data))? 'array' : type;
	}

	/**
	 * This will check if a request is undefined.
	 *
	 * @param {mixed} data
	 */
	isUndefined(data)
	{
		return (typeof data === 'undefined');
	}

	/**
	 * This will check if the request is an object.
	 * @param {object} obj
	 * @return {boolean}
	 */
	isObject(obj)
	{
		return (!obj || typeof obj !== 'object')? false : true;
	}

	/**
	 * This will check if the variable is an array.
	 *
	 * @param {*} array
	 * @return {boolean}
	 */
	isArray(array)
	{
		return Array.isArray(array);
	}

	/**
	 * This will check if a value is found in an array.
	 *
	 * @param {array} array
	 * @param {string} element
	 * @param {int} [fromIndex]
	 * @return {int} This will return -1 if not found.
	 */
	inArray(array, element, fromIndex)
	{
		if(!array || typeof array !== 'object')
		{
			return -1;
		}

		return array.indexOf(element, fromIndex);
	}

	/**
	 * This will create a callBack.
	 *
	 * @param {object} obj
	 * @param {function} method
	 * @param {array} [argArray] Default args to pass.
	 * @param {boolean} [addArgs] Set to add merge args from the
	 * curried function.
	 *
	 * @return {(function|boolean)} The callBack function or false.
	 */
	createCallBack(obj, method, argArray, addArgs)
	{
		if(typeof method !== 'function')
		{
			return false;
		}

		argArray = argArray || [];
		return function(...args)
		{
			if(addArgs === true)
			{
				argArray = argArray.concat(args);
			}

			return method.apply(obj, argArray);
		};
	}

	/**
	 * This will bind scope to a method.
	 *
	 * @param {object} obj
	 * @param {function} method
	 * @return {function}
	 */
	bind(obj, method)
	{
		return method.bind(obj);
	}

	/**
	 * This will prepare a json object to be used in an
	 * xhr request. This will sanitize the object values
	 * by encoding them to not break the param string.
	 *
	 * @param {object} obj
	 * @param {bool} [removeNewLines]
	 * @return {string}
	 */
	prepareJsonUrl(obj, removeNewLines = false)
	{
		var escapeChars = (str) =>
		{
			if(typeof str !== 'string')
			{
				str = String(str);
			}

			if(removeNewLines)
			{
				let newLine = /(\n|\r\n)/g;
				str = str.replace(newLine, "\\n");
			}

			let tab = /\t/g;
			return str.replace(tab, "\\t");
		};

		var sanitize = (text) =>
		{
			if(typeof text !== 'string')
			{
				return text;
			}

			/* we need to escape chars and encode the uri
			components */
			text = escapeChars(text);
			text = encodeURIComponent(text);

			/* we want to re-encode the double quotes so they
			will be escaped by the json encoder */
			let pattern = /\%22/g;
			return text.replace(pattern, '"');
		};

		var prepareUrl = (data) =>
		{
			let type = typeof data;
			if(type === "undefined")
			{
				return data;
			}

			if(type !== 'object')
			{
				data = sanitize(data);
				return data;
			}

			let value;
			for(var prop in data)
			{
				if(data.hasOwnProperty(prop))
				{
					value = data[prop];
					if(value === null)
					{
						continue;
					}

					data[prop] = (typeof value)? prepareUrl(value) : sanitize(value);
				}
			}
			return data;
		};

		/* we want to check to clone object so we won't modify the
		original object */
		let before = (typeof obj === 'object')? this.cloneObject(obj) : obj,
		after = prepareUrl(before);
		return this.jsonEncode(after);
	}

	/**
	 * This will parse JSON data.
	 *
	 * @param {string} data
	 * @return {*}
	 */
	jsonDecode(data)
	{
		return (typeof data !== "undefined" && data.length > 0)? JSON.parse(data) : false;
	}

	/**
	 * This will encode JSON data.
	 *
	 * @param {*} data
	 * @return {string}
	 */
	jsonEncode(data)
	{
		return (typeof data !== "undefined")? JSON.stringify(data) : false;
	}

	/**
	 * This will parse xml data.
	 *
	 * @param {string} data
	 * @return {object}
	 */
	xmlParse(data)
	{
		if(typeof data === "undefined")
		{
			return false;
		}

		var parser = new DOMParser();
		return parser.parseFromString(data, "text/xml");
	}
}

/**
 * This will return the base prototype to allow the module
 * to be added to base as a module.
 *
 * @static
 * @return {object} the base prototype.
 */
Base.prototype.extend = (function()
{
	return Base.prototype;
})();

/**
 * This is the instance of base that all modules will use.
 * @global
 */
export const base = new Base();

/**
 * This will add the Objects method to base.
 */
base.augment(Objects);

/**
 * This will count the properties of an object.
 *
 * @param {object} obj
 * @return {int}
 */
let countProperty = (obj) =>
{
	let count = 0;
	/* we want to count each property of the object */
	for(var property in obj)
	{
		if(obj.hasOwnProperty(property))
		{
			count++;
			/* we want to do a recursive count to get
			any child properties */
			if(typeof obj[property] === 'object')
			{
				count += countProperty(obj[property]);
			}
		}
	}
	return count;
};

/**
 * This will validate if the object properties match another object.
 *
 * @param {object} obj1
 * @param {object} obj2
 * @return {boolean}
 */
let matchProperties = (obj1, obj2) =>
{
	let matched = false;

	if(typeof obj1 !== 'object' || typeof obj2 !== 'object')
	{
		return matched;
	}

	/* we want to check each object1 property to the
	object 2 property */
	for(var property in obj1)
	{
		/* we want to check if the property is owned by the
		object and that they have matching types */
		if(!obj1.hasOwnProperty(property) || !obj2.hasOwnProperty(property))
		{
			break;
		}

		let value1 = obj1[property],
		value2 = obj2[property];

		if(typeof value1 !== typeof value2)
		{
			break;
		}

		/* we want to check if the type is an object */
		if(typeof value1 === 'object')
		{
			/* this will do a recursive check to the
			child properties */
			matched = matchProperties(value1, value2);
			if(matched !== true)
			{
				/* if a property did not match we can stop
				the comparison */
				break;
			}
		}
		else
		{
			if(value1 === value2)
			{
				matched = true;
			}
			else
			{
				break;
			}
		}
	}

	return matched;
};

/**
 * This will compare if two objects match.
 *
 * @param {object} obj1
 * @param {object} obj2
 * @return {boolean}
 */
let compareObjects = (obj1, obj2) =>
{
	/* we want to check if they have the same number of
	properties */
	let option1Count = countProperty(obj1),
	option2Count = countProperty(obj2);
	if(option1Count !== option2Count)
	{
		return false;
	}

	return matchProperties(obj1, obj2);
};

base.augment(
{
	/**
	 * This will compare if two values match.
	 *
	 * @param {*} option1
	 * @param {*} option2
	 * @return {boolean}
	 */
	equals(option1, option2)
	{
		/* we want to check if there types match */
		let option1Type = typeof option1,
		option2Type = typeof option2;
		if(option1Type !== option2Type)
		{
			return false;
		}

		/* we need to check if the options are objects
		because we will want to match all the
		properties */
		if(option1Type === 'object')
		{
			return compareObjects(option1, option2);
		}

		return (option1 === option2);
	}
});