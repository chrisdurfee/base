/**
 * Base Framework
 * @version 2.5.0
 * @author Chris Durfee
 * @file This is a javascript framework to allow complex
 * functions to work in many browsers and versions.
 */

(function(global)
{
	"use strict";

	/* this will check to stop setup if already setup */
	if(global.base)
	{
		return false;
	}

	/**
	 * base framework constructor
	 * @class
	 */
	var Base = function()
	{
		/**
		 * @member {string} version
		 */
		this.version = '2.5.0';

		/**
		 * @member {array} errors
		 */
		this.errors = [];
	};

	Base.prototype =
	{
		/**
		 * @constructor
		 */
		constructor: Base,

		/**
		 * this will augement the base framework with new functionality.
		 *
		 * @param {object} methods The new methods to add.
		 * @return {object} An instance of base.
		 */
		augment: function(methods)
		{
			if(!methods || typeof methods !== 'object')
			{
				return this;
			}

			var prototype = this.constructor.prototype;
			for(var property in methods)
			{
				if(methods.hasOwnProperty(property))
				{
					prototype[property] = methods[property];
				}
			}
			return this;
		}
	};

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
	var base = global._b = global.base = new Base();

	/* this will add the object creating and extending methods
	to allow classes to be created in es5 */
	base.augment(
	{
		/**
		 * This will convert a nodelist into an array.
		 *
		 * @param {object} list
		 * @return {array}
		 */
		listToArray: function(list)
		{
			return Array.prototype.slice.call(list);
		},

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
		override: function(obj, methodName, overrideMethod, args)
		{
			return (obj[methodName] = overrideMethod).apply(obj, this.listToArray(args));
		},

		/**
		 * This will create a new object.
		 *
		 * @param {object} [object] An object to extend.
		 * @return {object}
		 */
		createObject: function(object)
		{
			/* create a local function to perform the check
			once then override the function */
			var createObject;
			if(typeof Object.create === 'function')
			{
				// modern browsers
				createObject = function(object)
				{
					return Object.create(object);
				};
			}
			else
			{
				// old browsers
				createObject = function(object)
				{
					var obj = function(){};
					obj.prototype = object;
					return new obj();
				};
			}

			return this.override(this, 'createObject', createObject, arguments);
		},

		/**
		 * This will extend an object to another object.
		 *
		 * @param {(function|object)} sourceObj
		 * @param {(function|object)} targetObj
		 * @return {object}
		 */
		extendObject: function(sourceObj, targetObj)
		{
			if(typeof sourceObj === 'undefined' || typeof targetObj === 'undefined')
			{
				return false;
			}

			for(var property in sourceObj)
			{
				if(sourceObj.hasOwnProperty(property) && typeof targetObj[property] === 'undefined')
				{
					targetObj[property] = sourceObj[property];
				}
			}

			return targetObj;
		},

		/**
		 * This will clone an object.
		 *
		 * @param {object} obj
		 * @return {object}
		 */
		cloneObject: function(obj)
		{
			return JSON.parse(JSON.stringify(obj));
		},

		/**
		 * This will get the class prototype.
		 *
		 * @param {(function|object)} object
		 * @return {object}
		 */
		_getClassObject: function(object)
		{
			return (typeof object === 'function')? object.prototype : object;
		},

		/**
		 * This will extend an object to another object.
		 *
		 * @param {(function|object)} sourceClass
		 * @param {(function|object)} targetClass
		 * @return {object}
		 */
		extendClass: function(sourceClass, targetClass)
		{
			/* if we are using a class constructor function
			we want to get the class prototype object */
			var source = this._getClassObject(sourceClass),
			target = this._getClassObject(targetClass);

			if(typeof source !== 'object' || typeof target !== 'object')
			{
				return false;
			}

			/* we want to create a new object and add the source
			prototype to the new object */
			var obj = this.createObject(source);

			/* we want to add any additional properties from the
			target class to the new object */
			for(var prop in target)
			{
				obj[prop] = target[prop];
			}

			return obj;
		}
	});

	/**
	 * This will create a base class that other classes
	 * can use to create a class like object in es5.
	 *
	 * @class
	 */
	var Class = function()
	{

	};

	Class.prototype =
	{
		constructor: Class
	};

	/**
	 * This will extend the parent object to a child object.
	 *
	 * @static
	 * @param {object} child
	 * @return {function} The child constructor.
	 */
	Class.extend = function(child)
	{
		if(!child)
		{
			return false;
		}

		var parent = this.prototype;

		/* the child constructor must be set to set
		the parent static methods on the child */
		var constructor = child.constructor || false;
		if(child.hasOwnProperty('constructor') === false)
		{
			constructor = function()
			{
				var args = base.listToArray(arguments);
				parent.constructor.apply(this, args);
			};
		}

		/* this will add the parent class to the
		child class */
		constructor.prototype = base.extendClass(parent, child);

		/* this will add the static methods from the parent to
		the child constructor. */
		base.extendObject(this, constructor);
		return constructor;
	};

	base.extend.Class = Class;

	/**
	 * TrackerTypes
	 *
	 * This will add and remove tracker types to the data tracker.
	 *
	 */
	var TrackerTypes =
	{
		/**
		 * @member {object} The Type and callBack that is called
		 * when the type is removed from the object.
		 */
		types: {},

		/**
		 * This will add a type.
		 * @param {string} type
		 * @param {function} callBack The function to call when an object
		 * is having the type removed.
		 */
		add: function(type, callBack)
		{
			this.types[type] = callBack;
		},

		/**
		 * This will get a type or return false.
		 * @param {string} type
		 * @return {(function|boolean)} The callBack or false.
		 */
		get: function(type)
		{
			return this.types[type] || false;
		},

		/**
		 * This will remove a type.
		 * @param {string} type
		 */
		remove: function(type)
		{
			delete this.types[type];
		}
	};

	/**
	 * Tracker
	 *
	 * This will create a tracker for an object that will
	 * store each type added and the data stored to
	 * each type.
	 *
	 * @class
	 */
	var Tracker = base.Class.extend(
	{
		/**
		 * @constructor
		 */
		constructor: function()
		{
			/**
			 * @member {object} types
			 */
			this.types = {};
		},

		/**
		 * This will add data to a type.
		 *
		 * @public
		 * @param {string} addingType The type of data.
		 * @param {*} data The data to store
		 */
		add: function(addingType, data)
		{
			var type = this.types[addingType] || (this.types[addingType] = []);
			type.push(data);
		},

		/**
		 * This will get all the data stored to a data type.
		 * @param {string} type
		 * @return {*|boolean} the data or false.
		 */
		get: function(type)
		{
			return this.types[type] || false;
		},

		/**
		 * This will call the callBack with the data.
		 *
		 * @private
		 * @param {function} callBack
		 * @param {*} data
		 */
		removeByCallBack: function(callBack, data)
		{
			if(typeof callBack === 'function')
			{
				callBack(data);
			}
		},

		/**
		 * This will remove the data by type.
		 *
		 * @private
		 * @param {string} removingType
		 */
		removeType: function(removingType)
		{
			var types = this.types;
			if(types)
			{
				var type = types[removingType];
				if(type.length)
				{
					var callBack = TrackerTypes.get(removingType);
					for(var i = 0, length = type.length; i < length; i++)
					{
						var data = type[i];
						if(data)
						{
							// this will stop any circular referrences
							type[i] = null;

							this.removeByCallBack(callBack, data);
						}
					}
					delete types[type];
				}
			}
		},

		/**
		 * This will remove the data by type or all if no type is
		 * set.
		 *
		 * @public
		 * @param {string} [type]
		 */
		remove: function(type)
		{
		 	if(type)
			{
				this.removeType(type);
			}
			else
			{
				var types = this.types;
				for(var prop in types)
				{
					if(types.hasOwnProperty(prop))
					{
						type = types[prop];
						if(!type)
						{
							continue;
						}

						this.removeType(prop);
					}
				}

				delete this.types;
			}
		}
	});

	/**
	 * DataTracker
	 *
	 * This will add data tracking for objects. The DataTracker is
	 * a single point where any data can be tracked to an object
	 * or element. Modules can register types to store their own
	 * data that can allow the data to be removed when the element
	 * is removed.
	 *
	 * @class
	 */
	var DataTracker = base.Class.extend(
	{
		/**
		 * @constructor
		 */
		constructor: function()
		{
			/**
			 * @private
			 * @member trackers This is an object that stores all tracker
			 * objects by tracking id.
			 */
			this.trackers = {};

			/**
			 * @private
			 * @member {int} trackingCount
			 */
			this.trackingCount = 0;
		},

		/**
		 * This will add a new type to the data tracker.
		 *
		 * @public
		 * @param {string} type The new type.
		 * @param {function} callBack The callBack to help clean
		 * up data when removed.
		 */
		addType: function(type, callBack)
		{
			TrackerTypes.add(type, callBack);
		},

		/**
		 * This will remove a type from the data tracker.
		 * @param {string} type
		 */
		removeType: function(type)
		{
			TrackerTypes.remove(type);
		},

		/**
		 * This will get the object tracking id or set it if
		 * not set.
		 *
		 * @param {object} obj
		 * @return {string}
		 */
		getTrackingId: function(obj)
		{
			return obj.trackingId || (obj.trackingId = 'dt' + this.trackingCount++);
		},

		/**
		 * This will add data to an object.
		 *
		 * @param {object} obj
		 * @param {string} type The type name.
		 * @param {*} data The data to track.
		 */
		add: function(obj, type, data)
		{
			var id = this.getTrackingId(obj),
			tracker = this.find(id);

			tracker.add(type, data);
		},

		/**
		 * This will get the data from a type or the tracker object
		 * if type is not set.
		 *
		 * @param {object} obj
		 * @param {string} [type]
		 * @return {*}
		 */
		get: function(obj, type)
		{
			var id = obj.trackingId,
			tracker = this.trackers[id];
			if(!tracker)
			{
				return false;
			}

			return (type)? tracker.get(type) : tracker;
		},

		/**
		 * This will get the tracker or create a new tracker
		 * if no tracker is set.
		 *
		 * @param {string} id
		 * @return {object} The tracker.
		 */
		find: function(id)
		{
			var trackers = this.trackers;
			return (trackers[id] || (trackers[id] = new Tracker()));
		},

		/**
		 * This will remove a type or all data for an object if
		 * no type is set.
		 *
		 * @param {object} obj
		 * @param {stirng} [type]
		 */
		remove: function(obj, type)
		{
			var id = obj.trackingId;
			if(!id)
			{
				return true;
			}

			var tracker = this.trackers[id];
			if(!tracker)
			{
				return false;
			}

			if(type)
			{
				tracker.remove(type);

				/* this will remove the msg from the elements
				if no elements are listed under the msg */
				if(base.isEmpty(tracker.types))
				{
					delete this.trackers[id];
				}
			}
			else
			{
				tracker.remove();

				delete this.trackers[id];
			}
		}
	});

	base.extend.DataTracker = new DataTracker();

	/* we want to add additional methods to the base prototype
	so they can be inherited */
	base.augment(
	{
		/**
		 * This will get the last error.
		 * @return {(object|boolean)} The last error or false.
		 */
		getLastError: function()
		{
			var errors = this.errors;
			return (errors.length)? errors.pop() : false;
		},

		/**
		 * This will add an error.
		 *
		 * @param {object} err
		 */
		addError: function(err)
		{
			this.errors.push(err);
		},

		/**
		 * This will parse a query string.
		 *
		 * @param {string} [str] The string to parse or the global
		 * location will be parsed.
		 * @param {bool} [decode]
		 * @return {object}
		 */
		parseQueryString: function(str, decode)
		{
			if(typeof str !== 'string')
			{
				str = global.location.search;
			}

			var objURL = {},
			regExp = /([^?=&]+)(=([^&]*))?/g;
			str.replace(regExp, function(a, b, c, d)
			{
				/* we want to save the key and the
				value to the objURL */
				objURL[b] = (decode !== false)? decodeURIComponent(d) : d;
			});

			return objURL;
		},

		/**
		 * This will check if an object is empty.
		 *
		 * @param {object} obj
		 * @return {boolean}
		 */
		isEmpty: function(obj)
		{
			if(!obj || typeof obj !== 'object')
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
		},

		/**
		 * This will select an element by id.
		 *
		 * @param {string} id
		 * @return {(object|boolean)} The element object or false.
		 */
		getById: function(id)
		{
			if(typeof id !== 'string')
			{
				return false;
			}
			var obj = document.getElementById(id);
			return (obj || false);
		},

		/**
		 * This will select elements by name.
		 *
		 * @param {string} name
		 * @return {(object|boolean)} The elements array or false.
		 */
		getByName: function(name)
		{
			if(typeof name !== 'string')
			{
				return false;
			}
			var obj = document.getElementsByName(name);
			return (obj)? this.listToArray(obj) : false;
		},

		/**
		 * This will select by css selector.
		 *
		 * @param {string} selector
		 * @param {boolean} single Set to true if you only want one result.
		 * @return {*}
		 */
		getBySelector: function(selector, single)
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
				var obj = document.querySelector(selector);
				return (obj || false);
			}

			var elements = document.querySelectorAll(selector);
			if(elements)
			{
				/* if there is only one result just return the
				first element in the node list */
				return (elements.length === 1)? elements[0] : this.listToArray(elements);
			}
			return false;
		},

		/**
		 * This will get or set the innerHTML or an element.
		 *
		 * @param {object} obj
		 * @param {string} [html] If the html is not set, the html of the
		 * element will be returned.
		 *
		 * @return {(string|void)}
		 */
		html: function(obj, html)
		{
			if(!obj || typeof obj !== 'object')
			{
				 return false;
			}

			/* we want to check if we are getting the
			html or adding the html */
			if(typeof html !== 'undefined')
			{
				obj.innerHTML = html;
				return this;
			}

			return obj.innerHTML;
		},

		/**
		 * This will set the css property of an element.
		 *
		 * @param {object} obj
		 * @param {string} property
		 * @param {string} value
		 * @return {object} an instance of base.
		 */
		setCss: function(obj, property, value)
		{
			if(!obj || typeof obj !== 'object' || typeof property === 'undefined')
			{
				return this;
			}

			property = this.uncamelCase(property);
			obj.style[property] = value;
			return this;
		},

		/**
		 * This will get the css property of an element.
		 *
		 * @param {object} obj
		 * @param {string} property
		 * @return {(string|null)}
		 */
		getCss: function(obj, property)
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
		},

		/**
		 * This will get or set the css propety or an element.
		 *
		 * @param {object} obj
		 * @param {string} property
		 * @param {string} [value]
		 * @return {(string|void)}
		 */
		css: function(obj, property, value)
		{
			/* we want to check if we are getting the
			value or setting the value */
			if(typeof value !== 'undefined')
			{
				this.setCss(obj, property, value);

				return this;
			}

			return this.getCss(obj, property);
		},

		/**
		 * This will remove an attribute from an element.
		 *
		 * @private
		 * @return {*}
		 */
		_removeAttr: function()
		{
			var removeAttr;
			if(typeof document.documentElement.removeAttribute === 'function')
			{
				removeAttr = function(obj, property)
				{
					obj.removeAttribute(property);
				};
			}
			else
			{
				removeAttr = function(obj, property)
				{
					/* we cannot remove the attr through the remove
					attr method so we want to null the value.
					we want to camel caps the propety */
					property = base.camelCase(property);
					obj.property = null;
				};
			}

			return this.override(this, '_removeAttr', removeAttr, arguments);
		},

		/**
		 * This will remove an attribute from an element.
		 *
		 * @param {object} obj
		 * @param {string} property
		 * @return {object} an instance of base.
		 */
		removeAttr: function(obj, property)
		{
			if(obj && typeof obj === 'object')
			{
				this._removeAttr(obj, property);
			}
			return this;
		},

		/**
		 * This will set an attribute of an element.
		 *
		 * @private
		 * @return {void}
		 */
		setAttr: function()
		{
			/* create a local function to perform the check
			once then override the function */
			var setAttr;
			if(typeof document.documentElement.setAttribute === 'function')
			{
				// modern browsers
				setAttr = function(obj, property, value)
				{
					obj.setAttribute(property, value);
				};
			}
			else
			{
				// old browsers
				setAttr = function(obj, property, value)
				{
					obj[property] = value;
				};
			}

			return this.override(this, 'setAttr', setAttr, arguments);
		},

		/**
		 * This will get an attribute of an element.
		 *
		 * @return {string}
		 */
		getAttr: function()
		{
			/* create a local function to perform the check
			once then override the function */
			var getAttr;
			if(typeof document.documentElement.getAttribute === 'function')
			{
				// modern browsers
				getAttr = function(obj, property)
				{
					return obj.getAttribute(property);
				};
			}
			else
			{
				// old browsers
				getAttr = function(obj, property)
				{
					return obj[property];
				};
			}

			/* this will override method with cached method
			and we need to return and call with object */
			return this.override(this, 'getAttr', getAttr, arguments);
		},

		/**
		 * This will get or set an attribute from an element.
		 *
		 * @param {object} obj
		 * @param {string} property
		 * @param {string} [value]
		 * @return {(string|void)}
		 */
		attr: function(obj, property, value)
		{
			if(!obj || typeof obj !== 'object')
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
		},

		/**
		 * This will prefix a string with "data-" if not set.
		 *
		 * @protected
		 * @param {string} prop
		 * @return {string}
		 */
		_checkDataPrefix: function(prop)
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
		},

		/**
		 * This will remove "data-" from a string.
		 *
		 * @protected
		 * @param {string} prop
		 * @return {string}
		 */
		_removeDataPrefix: function(prop)
		{
			if(typeof prop === 'string' && prop.substring(0, 5) === 'data-')
			{
				prop = prop.substring(5);
			}
			return prop;
		},

		/**
		 * This will set data to an element.
		 *
		 * @param {object} obj
		 * @param {string} property
		 * @param {string} value
		 */
		setData: function()
		{
			var self = this;
			/* create a local function to perform the check
			once then override the function */
			var setData;
			if(typeof document.documentElement.dataset !== 'undefined')
			{
				// modern browsers
				setData = function(obj, property, value)
				{
					/* this will return the property without the data prefix */
					property = self._removeDataPrefix(property);
					property = base.camelCase(property);

					obj.dataset[property] = value;
				};
			}
			else
			{
				// old browsers
				setData = function(obj, property, value)
				{
					/* we need to check the prop prefix */
					property = self._checkDataPrefix(property);
					base.attr(obj, property, value);
				};
			}

			return this.override(this, 'setData', setData, arguments);
		},

		/**
		 * This will get data from an element.
		 *
		 * @param {object} obj
		 * @param {string} property
		 * @param {string} value
		 * @return {string}
		 */
		getData: function()
		{
			var self = this;
			/* create a local function to perform the check
			once then override the function */
			var getData;
			if(typeof document.documentElement.dataset !== 'undefined')
			{
				// modern browsers
				getData = function(obj, property)
				{
					property = base.camelCase(self._removeDataPrefix(property));
					return obj.dataset[property];
				};
			}
			else
			{
				// old browsers
				getData = function(obj, property)
				{
					property = self._checkDataPrefix(property);
					return base.attr(obj, property);
				};
			}

			return this.override(this, 'getData', getData, arguments);
		},

		/**
		 * This will get or set data to an element.
		 *
		 * @param {object} obj
		 * @param {string} property
		 * @param {string} [value]
		 * @return {(string|void)}
		 */
		data: function(obj, property, value)
		{
			if(!obj || typeof obj !== 'object')
			{
				return false;
			}

			if(typeof value !== 'undefined')
			{
				this.setData(obj, property, value);
				return this;
			}

			/* we need to check the prop prefix */
			return this.getData(obj, property);
		},

		/**
		 * This will find elements in an element.
		 *
		 * @param {object} obj
		 * @param {string} queryString
		 * @return {array}
		 */
		find: function(obj, queryString)
		{
			if(!obj || typeof queryString !== 'string')
			{
				return false;
			}

			return obj.querySelectorAll(queryString);
		},

		/**
		 * This will display an element.
		 *
		 * @param {object} obj
		 * @return {object} An instance of base.
		 */
		show: function(obj)
		{
			if(!obj || typeof obj !== 'object')
			{
				return this;
			}

			/* we want to get the previous display style
			from the data-style-display attr */
			var previous = this.data(obj, 'style-display'),
			value = (typeof previous === 'string')? previous : '';

			this.css(obj, 'display', value);
			return this;
		},

		/**
		 * This will hide an element.
		 *
		 * @param {object} obj
		 * @return {object} An instance of base.
		 */
		hide: function(obj)
		{
			if(!obj || typeof obj !== 'object')
			{
				return this;
			}

			/* we want to set the previous display style
			on the element as a data attr */
			var previous = this.css(obj, 'display');
			if(previous !== 'none' && previous)
			{
				this.data(obj, 'style-display', previous);
			}

			this.css(obj, 'display', 'none');
			return this;
		},

		/**
		 * This will toggle the display an element.
		 *
		 * @param {object} obj
		 * @return {object} An instance of base.
		 */
		toggle: function(obj)
		{
			if(!obj || typeof obj !== 'object')
			{
				return this;
			}

			var mode = this.css(obj, 'display');
			if(mode !== 'none')
			{
				this.hide(obj);
			}
			else
			{
				this.show(obj);
			}
			return this;
		},

		/**
		 * This will camelCase a string.
		 *
		 * @param {string} str
		 * @return {(string|boolean)} The string or false.
		 */
		camelCase: function(str)
		{
			if(typeof str !== 'string')
			{
				return false;
			}

			var regExp = /(-|\s|\_)+\w{1}/g;
			return str.replace(regExp, function(match)
			{
				return match[1].toUpperCase();
			});
		},

		/**
		 * This will uncamel-case a string.
		 *
		 * @param {string} str
		 * @param {string} delimiter
		 * @return {(string|boolean)} The string or false.
		 */
		uncamelCase: function(str, delimiter)
		{
			if(typeof str !== 'string')
			{
				return false;
			}

			delimiter = delimiter || '-';

			var regExp = /([A-Z]{1,})/g;
			return str.replace(regExp, function(match)
			{
				return delimiter + match.toLowerCase();
			}).toLowerCase();
		},

		/**
		 * This will get the size of an element.
		 *
		 * @param {object} obj
		 * @return {(object|boolean)} A size object or false.
		 */
		getSize: function(obj)
		{
			if(!obj || typeof obj !== 'object')
			{
				return false;
			}

			return {
				width: this.getWidth(obj),
				height: this.getHeight(obj)
			};
		},

		/**
		 * This will get the width of an element.
		 *
		 * @param {object} obj
		 * @return {(int|boolean)} A width or false.
		 */
		getWidth: function(obj)
		{
			/* we want to check if the object is not supplied */
			return (obj && typeof obj === 'object')? obj.offsetWidth : false;
		},

		/**
		 * This will get the height of an element.
		 *
		 * @param {object} obj
		 * @return {(int|boolean)} A height or false.
		 */
		getHeight: function(obj)
		{
			/* we want to check if the object is not supplied */
			return (obj && typeof obj === 'object')? obj.offsetHeight : false;
		},

		/**
		* This will get the scroll position.
		*
		* @param {object} [obj] The element or document element if not set.
		* @return {object}
		*/
		getScrollPosition: function(obj)
		{
			var left = 0, top = 0;
			if(typeof obj === 'undefined')
			{
				/* we want to use the document body */
				obj = document.documentElement;
				left = (window.pageXOffset || obj.scrollLeft);
				top = (window.pageYOffset || obj.scrollTop);
			}
			else if(typeof obj === 'object')
			{
				left = obj.scrollLeft;
				top = obj.scrollTop;
			}

			if(!obj || typeof obj !== 'object')
			{
				return false;
			}

			return {
				left: left - (obj.clientLeft || 0),
				top: top - (obj.clientTop || 0)
			};
		},

		/**
		 * This will get the scroll top position.
		 *
		 * @param {object} [obj] The element or document element if not set.
		 * @return {object}
		 */
		getScrollTop: function(obj)
		{
			var position = this.getScrollPosition(obj);
			return position.top;
		},

		/**
		 * This will get the scroll left position.
		 *
		 * @param {object} [obj] The element or document element if not set.
		 * @return {object}
		 */
		getScrollLeft: function(obj)
		{
			var position = this.getScrollPosition(obj);
			return position.left;
		},

		/**
		 * This will get the window size.
		 *
		 * @return {object}
		 */
		getWindowSize: function()
		{
			var w = window,
			doc = document,
			de = doc.documentElement,
			b = doc.getElementsByTagName('body')[0],
			width = w.innerWidth || de.clientWidth || b.clientWidth,
			height = w.innerHeight || de.clientHeight || b.clientHeight;

			return {
				width: width,
				height: height
			};
		},

		/**
		 * This will get the document size.
		 *
		 * @return {object}
		 */
		getDocumentSize: function()
		{
			var doc = document,
			body = doc.body,
			html = doc.documentElement;

			var height = Math.max(
				body.scrollHeight,
				body.offsetHeight,
				html.clientHeight,
				html.scrollHeight,
				html.offsetHeight
			);

			var width = Math.max(
				body.scrollWidth,
				body.offsetWidth,
				html.clientWidth,
				html.scrollWidth,
				html.offsetWidth
			);

			return {
				width: width,
				height: height
			};
		},

		/**
		 * This will get the document height.
		 *
		 * @return {object}
		 */
		getDocumentHeight: function()
		{
			return this.getDocumentSize().height;
		},

		/**
		 * This will get the value from a property on an object.
		 *
		 * @param {object} obj
		 * @param {string} property
		 * @param {*} [defaultText] A value if no value is set.
		 * @return {string}
		 */
		getProperty: function(obj, property, defaultText)
		{
			if(!obj || typeof obj !== 'object')
			{
				return '';
			}

			var value = obj[property];
			if(value)
			{
				return value;
			}

			/* if no value was available
			we want to return an empty string */
			return (typeof defaultText !== 'undefined')? defaultText : '';
		},

		/**
		 * This will get the position of an element.
		 *
		 * @param {object} obj
		 * @param {boolean} [depth] The number of levels, default is 1, 0 is to the root.
		 * @return {object}
		 */
		position: function(obj, depth)
		{
			var position = {x: 0, y: 0};

			if(!obj || typeof obj !== 'object')
			{
				return position;
			}

			depth = typeof depth === 'undefined'? 1 : depth;

			/* if the depth is 0 we will travel to the
			top element */
			var count = 0;
			while(obj && (depth === 0 || count < depth))
			{
				count++;
				position.x += (obj.offsetLeft + obj.clientLeft);
				position.y += (obj.offsetTop + obj.clientTop);
				obj = obj.offsetParent;
			}

			return position;
		},

		/**
		 * This will add a class to an element.
		 *
		 * @protected
		 * @param {object} obj
		 * @param {string} tmpClassName
		 */
		_addClass: function()
		{
			/* create a local function to perform the check
			once then override the function */
			var addClass;
			if(typeof document.documentElement.classList !== 'undefined')
			{
				// modern browsers
				addClass = function(obj, tmpClassName)
				{
					obj.classList.add(tmpClassName);
				};
			}
			else
			{
				// old browsers
				addClass = function(obj, tmpClassName)
				{
					obj.className = obj.className + ' ' + tmpClassName;
				};
			}

			/* this will override method with cached method
			and we need to return and call with object */
			return this.override(this, '_addClass', addClass, arguments);
		},

		/**
		 * This will add a class to an element.
		 *
		 * @param {object} obj
		 * @param {string} tmpClassName
		 */
		addClass: function(obj, tmpClassName)
		{
			if(!obj || typeof obj !== 'object' || tmpClassName === '')
			{
				return this;
			}

			if(typeof tmpClassName === 'string')
			{
				/* we want to divide the string by spaces and
				add any class listed */
				var adding = tmpClassName.split(' ');
				for(var i = 0, maxLength = adding.length; i < maxLength; i++)
				{
					this._addClass(obj, adding[i]);
				}
			}
			return this;
		},

		/**
		 * This will remove a class from an element.
		 *
		 * @protected
		 * @param {object} obj
		 * @param {string} tmpClassName
		 */
		_removeClass: function()
		{
			/* create a local function to perform the check
			once then override the function */
			var removeClass;
			if(typeof document.documentElement.classList !== 'undefined')
			{
				// modern browsers
				removeClass = function(obj, tmpClassName)
				{
					obj.classList.remove(tmpClassName);
				};
			}
			else
			{
				// old browsers
				removeClass = function(obj, tmpClassName)
				{
					/* we want to get the object classes in an array */
					var classNames = obj.className.split(' ');
					for(var i = 0, maxLength = classNames.length; i < maxLength; i++)
					{
						if(classNames[i] === tmpClassName)
						{
							classNames.splice(i, 1);
						}
					}
					obj.className = classNames.join(' ');
				};
			}

			/* this will override method with cached method
			and we need to return and call with object */
			return this.override(this, '_removeClass', removeClass, arguments);
		},

		/**
		 * This will remove a class or classes from an element.
		 *
		 * @param {object} obj
		 * @param {string} [tmpClassName]
		 */
		removeClass: function(obj, tmpClassName)
		{
			if(!obj || typeof obj !== 'object' || tmpClassName === '')
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
				this._removeClass(obj, tmpClassName);
			}
			return this;
		},

		/**
		 * This will check if an element has a class.
		 *
		 * @protected
		 * @param {object} obj
		 * @param {string} tmpClassName
		 * @return {boolean}
		 */
		_hasClass: function()
		{
			/* create a local function to perform the check
			once then override the function */
			var hasClass;
			if(typeof document.documentElement.classList !== 'undefined')
			{
				// modern browsers
				hasClass = function(obj, tmpClassName)
				{
					return obj.classList.contains(tmpClassName);
				};
			}
			else
			{
				// old browsers
				hasClass = function(obj, tmpClassName)
				{
					/* we want to get the object classes in an array */
					var check = false,
					classNames = obj.className.split(' ');
					for(var i = 0, maxLength = classNames.length; i < maxLength; i++)
					{
						if(classNames[i] === tmpClassName)
						{
							check = true;
							break;
						}
					}
					return check;
				};
			}

			/* this will override method with cached method
			and we need to return and call with object */
			return this.override(this, '_hasClass', hasClass, arguments);
		},

		/**
		 * This will check if an element has a class.
		 *
		 * @param {object} obj
		 * @param {string} tmpClassName
		 * @return {boolean}
		 */
		hasClass: function(obj, tmpClassName)
		{
			if(!obj || typeof obj !== 'object' || tmpClassName === '')
			{
				return false;
			}

			return this._hasClass(obj, tmpClassName);
		},

		/**
		 * This will toggle a class on an element.
		 *
		 * @param {object} obj
		 * @param {string} tmpClassName
		 * @return {object} An instance of base.
		 */
		toggleClass: function(obj, tmpClassName)
		{
			if(!obj || typeof obj !== 'object')
			{
				return this;
			}

			var hasClass = this.hasClass(obj, tmpClassName);
			if(hasClass === true)
			{
				this.removeClass(obj, tmpClassName);
			}
			else
			{
				this.addClass(obj, tmpClassName);
			}
			return this;
		},

		/**
		 * This will get the type of a variable.
		 *
		 * @param {*} data
		 * @return {string}
		 */
		getType: function(data)
		{
			var type = typeof data;
			if(type !== 'object')
			{
				return type;
			}

			return (this.isArray(data))? 'array' : type;
		},

		/**
		 * This will check if the variable is an array.
		 *
		 * @param {*} array
		 * @return {boolean}
		 */
		isArray: function(array)
		{
			/* create a local function to perform the check once */
			var isArray;
			if(typeof Array.isArray === 'function')
			{
				// modern browsers
				isArray = function(array)
				{
					return Array.isArray(array);
				};
			}
			else
			{
				// old browsers
				isArray = function(array)
				{
					return (array instanceof Array);
				};
			}

			return this.override(this, 'isArray', isArray, arguments);
		},

		/**
		 * This will check if a value is found in an array.
		 *
		 * @protected
		 * @param {array} array
		 * @param {string} element
		 * @param {int} [fromIndex]
		 * @return {int}
		 */
		_inArray: function()
		{
			/* create a local function to perform the check
			once then override the function */
			var inArray;
			if(typeof Array.prototype.indexOf === 'function')
			{
				// modern browsers
				inArray = function(array, element, fromIndex)
				{
					return array.indexOf(element, fromIndex);
				};
			}
			else
			{
				// old browsers
				inArray = function(array, element, fromIndex)
				{
					var length = (array.length),
					start = (!isNaN(fromIndex))? fromIndex : 0;

					for(var i = start; i < length; i++)
					{
						if(element === array[i])
						{
							return i;
						}
					}
					return -1;
				};
			}

			return this.override(this, '_inArray', inArray, arguments);
		},

		/**
		 * This will check if a value is found in an array.
		 *
		 * @param {array} array
		 * @param {string} element
		 * @param {int} [fromIndex]
		 * @return {int} This will return -1 if not found.
		 */
		inArray: function(array, element, fromIndex)
		{
			if(!array || typeof array !== 'object')
			{
				return -1;
			}

			return this._inArray(array, element, fromIndex);
		},

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
		createCallBack: function(obj, method, argArray, addArgs)
		{
			if(typeof method !== 'function')
			{
				return false;
			}

			argArray = argArray || [];
			return function()
			{
				if(addArgs === true)
				{
					var args = base.listToArray(arguments);
					argArray = argArray.concat(args);
				}

				return method.apply(obj, argArray);
			};
		},

		/**
		 * This will bind scope to a method.
		 *
		 * @param {object} obj
		 * @param {function} method
		 * @return {function}
		 */
		bind: function(obj, method)
		{
			/* create a local function to perform the check
			once then override the function */
			var bind;
			if(typeof Function.prototype.bind === 'function')
			{
				// modern browsers
				bind = function(obj, method)
				{
					return method.bind(obj);
				};
			}
			else
			{
				// old browsers
				bind = function(obj, method)
				{
					return function()
					{
						return method.apply(obj, arguments);
					};
				};
			}

			return this.override(this, 'bind', bind, arguments);
		},

		/**
		 * This will prepare a json object to be used in an
		 * xhr request. This will sanitize the object values
		 * by encoding them to not break the param string.
		 *
		 * @param {object} obj
		 * @return {string}
		 */
		prepareJsonUrl: function(obj)
		{
			var escapeChars = function(str)
			{
				if(typeof str !== 'string')
				{
					str = String(str);
				}

				var tab = /\t/g;
				return str.replace(tab, "\\t");
			};

			var sanitize = function(text)
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
				var pattern = /\%22/g;
				return text.replace(pattern, '"');
			};

			var prepareUrl = function(data)
			{
				var type = typeof data;
				if(type === "undefined")
				{
					return data;
				}

				if(type !== 'object')
				{
					data = sanitize(data);
					return data;
				}

				for(var prop in data)
				{
					if(data.hasOwnProperty(prop) && data[prop] !== null)
					{
						var childType = typeof data[prop];
						if(childType)
						{
							data[prop] = prepareUrl(data[prop]);
						}
						else
						{
							data[prop] = sanitize(data[prop]);
						}
					}
				}
				return data;
			};

			/* we want to check to clone object so we won't modify the
			original object */
			var before = (typeof obj === 'object')? this.cloneObject(obj) : obj,
			after = prepareUrl(before);
			return this.jsonEncode(after);
		},

		/**
		 * This will parse JSON data.
		 *
		 * @param {string} data
		 * @return {*}
		 */
		jsonDecode: function(data)
		{
			return (typeof data !== "undefined" && data.length > 0)? JSON.parse(data) : false;
		},

		/**
		 * This will encode JSON data.
		 *
		 * @param {*} data
		 * @return {string}
		 */
		jsonEncode: function(data)
		{
			return (typeof data !== "undefined")? JSON.stringify(data) : false;
		},

		/**
		 * This will parse xml data.
		 *
		 * @protected
		 * @param {string} data
		 * @return {object}
		 */
		_xmlParse: function()
		{
			/* create a local function to perform the check
			once then override the function */
			var xmlParse;
			if(typeof window.DOMParser !== 'undefined')
			{
				// modern browsers
				xmlParse = function(data)
				{
					var parser = new DOMParser();
					return parser.parseFromString(data, "text/xml");
				};
			}
			else
			{
				// old browsers
				xmlParse = function(data)
				{
					var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
					xmlDoc.async = false;
					return xmlDoc.loadXML(data);
				};
			}

			/* this will override method with cached method
			and we need to return and call with object */
			return this.override(this, '_xmlParse', xmlParse, arguments);
		},

		/**
		 * This will parse xml data.
		 *
		 * @param {string} data
		 * @return {object}
		 */
		xmlParse: function(data)
		{
			return (typeof data !== "undefined")? this._xmlParse(data) : false;
		}

	});

	/**
	 * This will count the properties of an object.
	 *
	 * @param {object} obj
	 * @return {int}
	 */
	var countProperty = function(obj)
	{
		var count = 0;
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
	var matchProperties = function(obj1, obj2)
	{
		var matched = false;

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

			var value1 = obj1[property],
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
	var compareObjects = function(obj1, obj2)
	{
		/* we want to check if they have the same number of
		properties */
		var option1Count = countProperty(obj1),
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
		equals: function(option1, option2)
		{
			/* we want to check if there types match */
			var option1Type = typeof option1,
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

})(this);

/* base framework module */
/*
	this adds event support
*/
(function(global)
{
	"use strict";

	var DataTracker = base.DataTracker;

	/* this will register the event system to the
	data tracker to remove events that have been
	added in layouts. */
	DataTracker.addType('events', function(data)
	{
		base.events.removeEvent(data);
	});

	base.extend.events =
	{
		/**
		 * This will get the events on an element.
		 *
		 * @param {object} obj
		 * @return {(array|boolean)}
		 */
		getEvents: function(obj)
		{
			if(!obj || typeof obj !== 'object')
			{
				return false;
			}
			return DataTracker.get(obj, 'events');
		},

		/**
		 * This will create an object to use with the DataTracker.
		 *
		 * @param {string} event The event name.
		 * @param {object} obj
		 * @param {function} fn
		 * @param {boolean} [capture]
		 * @param {boolean} [swapped]
		 * @param {function} [originalFn]
		 * @return {object}
		 */
		create: function(event, obj, fn, capture, swapped, originalFn)
		{
			/* we want to check if the swapped param was set */
			swapped = (swapped === true);

			return {
				event: event,
				obj: obj,
				fn: fn,
				capture: capture,
				swapped: swapped,
				originalFn: originalFn
			};
		},

		/* this will setup the add function to cache the
		proper function so we only check one time.
		@return (function) the function */
		/**
		 * This will add an event.
		 * @param {string} event The event name.
		 * @param {object} obj
		 * @param {function} fn
		 * @param {boolean} [capture]
		 */
		_add: function()
		{
			/* create a local function to perform the check
			once then override the function */
			var addEvent;
			if(typeof global.addEventListener === 'function')
			{
				// modern browsers
				addEvent = function(obj, event, fn, capture)
				{
					obj.addEventListener(event, fn, capture);
				};
			}
			else if(typeof document.attachEvent === 'function')
			{
				// old ie
				addEvent = function(obj, event, fn, capture)
				{
					obj.attachEvent("on" + event, fn);
				};
			}
			else
			{
				addEvent = function(obj, event, fn, capture)
				{
					obj["on" + event] = fn;
				};
			}

			base.override(this, '_add', addEvent, arguments);
		},

		/**
		 * This will add an event to an object.
		 *
		 * @param {string} event The event name.
		 * @param {object} obj
		 * @param {function} fn
		 * @param {boolean} [capture]
		 * @param {boolean} [swapped]
		 * @param {function} [originalFn]
		 */
		add: function(event, obj, fn, capture, swapped, originalFn)
		{
			if(!obj || typeof obj !== 'object')
			{
				return this;
			}

			capture = capture || false;

			/* we want to create an event object and add it the
			the active events to track */
			var data = this.create(event, obj, fn, capture, swapped, originalFn);
			DataTracker.add(obj, 'events', data);

			this._add(obj, event, fn, capture);

			return this;
		},

		/**
		 * This will remove an event from an object.
		 *
		 * @param {string} event The event name.
		 * @param {object} obj
		 * @param {function} fn
		 * @param {boolean} [capture]
		 * @return {object} a reference to the event object.
		 */
		remove: function(event, obj, fn, capture)
		{
			capture = capture || false;

			/* we want to select the event from the active events array */
			var result = this.getEvent(event, obj, fn, capture);
			if(result === false)
			{
				return this;
			}

			if(typeof result === 'object')
			{
				/* we want to use the remove event method and just
				pass the listener object */
				this.removeEvent(result);
			}
			return this;
		},

		/**
		 * This will remove an event from an object.
		 *
		 * @protected
		 * @param {string} event The event name.
		 * @param {object} obj
		 * @param {function} fn
		 * @param {boolean} [capture]
		 */
		_remove: function()
		{
			/* create a local function to perform the check
			once then override the function */
			var removeEvent;
			if(typeof global.removeEventListener === 'function')
			{
				// modern browsers
				removeEvent = function(obj, event, fn, capture)
				{
					obj.removeEventListener(event, fn, capture);
				};
			}
			else if(typeof document.detachEvent === 'function')
			{
				// old ie
				removeEvent = function(obj, event, fn, capture)
				{
					obj.detachEvent("on" + event, fn);
				};
			}
			else
			{
				removeEvent = function(obj, event, fn, capture)
				{
					obj["on" + event] = null;
				};
			}

			base.override(this, '_remove', removeEvent, arguments);
		},

		/**
		 * This will remove an event listener.
		 * @param {object} listener
		 * @return {object} a reference to the event object.
		 */
		removeEvent: function(listener)
		{
			if(typeof listener === 'object')
			{
				this._remove(listener.obj, listener.event, listener.fn, listener.capture);
			}
			return this;
		},

		/**
		 * This will search for an event.
		 *
		 * @protected
		 * @param {string} event The event name.
		 * @param {object} obj
		 * @param {function} fn
		 * @param {boolean} [capture]
		 * @return {(object|boolean)}
		 */
		getEvent: function(event, obj, fn, capture)
		{
			if(typeof obj !== 'object')
			{
				return false;
			}

			var events = this.getEvents(obj);
			if(!events || events.length < 1)
			{
				return false;
			}

			var eventObj = this.create(event, obj, fn, capture);
			/* if the search returns anything but false we
			found our active event */
			return this.search(eventObj, events);
		},

		/**
		 * This will search for an event from the object events.
		 *
		 * @param {object} eventObj
		 * @param {array} events
		 * @return {(object|boolean)}
		 */
		search: function(eventObj, events)
		{
			var swappable = this.isSwappable(eventObj.event);
			for(var i = 0, maxLength = events.length; i < maxLength; i++)
			{
				var listener = events[i];
				if(listener.event !== eventObj.event || listener.obj !== eventObj.obj)
				{
					continue;
				}

				if(listener.fn === eventObj.fn || (swappable === true && listener.originalFn === eventObj.fn))
				{
					return listener;
				}
			}

			return false;
		},

		/**
		 * This will remove all events on an object.
		 *
		 * @param {object} obj
		 * @return {object} a reference to the events object.
		 */
		removeEvents: function(obj)
		{
			if(!obj || typeof obj !== 'object')
			{
				return this;
			}

			DataTracker.remove(obj, 'events');

			return this;
		},

		/**
		 * @member {array} swap The swappable events.
		 */
		swap: [
			'DOMMouseScroll',
			'wheel',
			'mousewheel',
			'mousemove',
			'popstate'
		],

		/**
		 * This will a event type to the swappable array.
		 *
		 * @param {string} type
		 */
		addSwapped: function(type)
		{
			this.swap.push(type);
		},

		/**
		 * This will check if an event is swappable.
		 *
		 * @param {string} event
		 * @return {boolean}
		 */
		isSwappable: function(event)
		{
			/* we want to check if the event type is in the
			swapped event array */
			var index = base.inArray(this.swap, event);
			return (index > -1);
		}
	};

	base.augment(
	{
		/**
		 * This will add an event to an object.
		 *
		 * @param {string} event The event name.
		 * @param {object} obj
		 * @param {function} fn
		 * @param {boolean} [capture]
		 * @return {object} An instance of base.
		 */
		addListener: function(event, obj, fn, capture)
		{
			this.events.add(event, obj, fn, capture);

			return this;
		},

		/**
		 * This will add an event to an object.
		 *
		 * @param {string} event The event name.
		 * @param {object} obj
		 * @param {function} fn
		 * @param {boolean} [capture]
		 * @return {object} An instance of base.
		 */
		on: function(event, obj, fn, capture)
		{
			var events = this.events;
			if(this.isArray(event))
			{
				for(var i = 0, length = event.length; i < length; i++)
				{
					var evt = event[i];
					events.add(evt, obj, fn, capture);
				}
			}
			else
			{
				events.add(event, obj, fn, capture);
			}
			return this;
		},

		/**
		 * This will remove an event from an object.
		 *
		 * @param {string} event The event name.
		 * @param {object} obj
		 * @param {function} fn
		 * @param {boolean} [capture]
		 * @return {object} An instance of base.
		 */
		off: function(event, obj, fn, capture)
		{
			var events = this.events;
			if(this.isArray(event))
			{
				for(var i = 0, length = event.length; i < length; i++)
				{
					var evt = event[i];
					events.remove(evt, obj, fn, capture);
				}
			}
			else
			{
				events.remove(event, obj, fn, capture);
			}
			return this;
		},

		/**
		 * This will remove an event from an object.
		 *
		 * @param {string} event The event name.
		 * @param {object} obj
		 * @param {function} fn
		 * @param {boolean} [capture]
		 * @return {object} An instance of base.
		 */
		removeListener: function(event, obj, fn, capture)
		{
			/* we want to remove this from the active events */
			this.events.remove(event, obj, fn, capture);

			return this;
		},

		/**
		 * This will create a custom event.
		 *
		 * @protected
		 * @param {object} obj
		 * @param {object} event
		 * @param {string} eventType
		 * @param {object} [settings]
		 * @param {object} [params]
		 * @return {object}
		 */
		_createEvent: function()
		{
			/* create a local function to perform the check
			once then override the function */
			var createEvent;
			if('CustomEvent' in window)
			{
				createEvent = function(obj, event, eventType, settings, params)
				{
					var e;
					if(eventType === 'HTMLEvents')
					{
						e = new Event(event);
					}
					else if(eventType === 'MouseEvents')
					{
						e = new MouseEvent(event, settings);
					}
					else
					{
						e = new CustomEvent(event, params);
					}
					return e;
				};
			}
			else if('createEventObject' in document)
			{
				createEvent = function(obj, event, eventType, settings, params)
				{
					var e = document.createEventObject();
					e.eventType = event;
					return e;
				};
			}
			else
			{
				createEvent = function(obj, event, eventType, settings, params)
				{
					var e = document.createEvent(eventType);
					if (eventType === 'HTMLEvents')
					{
						obj.initEvent(event, settings.bubbles, settings.cancelable);
					}
					else if(eventType === 'MouseEvents')
					{
						e.initMouseEvent(
							event,
							settings.canBubble,
							settings.cancelable,
							settings.view,
							settings.detail,
							settings.screenX,
							settings.screenY,
							settings.clientX,
							settings.clientY,
							settings.ctrlKey,
							settings.altKey,
							settings.shiftKey,
							settings.metaKey,
							settings.button,
							settings.relatedTarget
						);
					}
					else if(eventType === 'CustomEvent')
					{
						e.initCustomEvent(event, settings.bubbles, settings.cancelable, params);
					}
					return e;
				};
			}

			/* this will override method with cached method
			and we need to return and call with object */
			return this.override(this, '_createEvent', createEvent, arguments);
		},

		/**
		 * This will create a custom event. This supports html, mouse,
		 * and customevents.
		 *
		 * @param {string} event
		 * @param {object} obj
		 * @param {object} [options]
		 * @param {object} [params]
		 * @return {object}
		 */
		createEvent: function(event, obj, options, params)
		{
			if(!obj || typeof obj !== 'object')
			{
				return false;
			}

			var settings =
			{
				pointerX: 0,
				pointerY: 0,
				button: 0,
				view: window,
				detail: 1,
				screenX: 0,
				screenY: 0,
				clientX: 0,
				clientY: 0,
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				metaKey: false,
				bubbles: true,
				cancelable: true,
				relatedTarget: null
			};

			if(options && typeof options === 'object')
			{
				settings = base.extendObject(settings, options);
			}

			var eventType = this._getEventType(event);
			return this._createEvent(obj, event, eventType, settings, params);
		},

		/**
		 * This will get thetype of an event.
		 *
		 * @protected
		 * @param {string} event
		 * @return {string}
		 */
		_getEventType: function(event)
		{
			var eventTypes = {
				'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
				'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
			};

			var eventType = 'CustomEvent';
			for(var prop in eventTypes)
			{
				if(eventTypes.hasOwnProperty(prop))
				{
					var value = eventTypes[prop];
					if(event.match(value))
					{
						eventType = prop;
						break;
					}
				}
			}
			return eventType;
		},

		/**
		 * This will trigger an event.
		 *
		 * @protected
		 * @param {object} obj
		 * @param {object} event
		 */
		_trigger: function()
		{
			/* create a local function to perform the check
			once then override the function */
			var trigger;
			if('createEvent' in document)
			{
				trigger = function(obj, event)
				{
					obj.dispatchEvent(event);
				};
			}
			else
			{
				// old ie
				trigger = function(obj, event)
				{
					var type = event.type;
					obj.fireEvent('on' + type, event);
				};
			}

			this.override(this, '_trigger', trigger, arguments);
		},

		/**
		 * This will trigger an event.
		 *
		 * @param {(string|object)} event
		 * @param {object} obj
		 * @param {object} [params]
		 * @return {object}
		 */
		trigger: function(event, obj, params)
		{
			if(!obj || typeof obj !== 'object')
			{
				return this;
			}

			var e = (typeof event === 'string')? this.createEvent(event, obj, null, params) : event;
			this._trigger(obj, e);
			return this;
		},

		/**
		 * @member {string} mouseWheelEventType The mouse wheel event name.
		 * @protected
		 */
		mouseWheelEventType: null,

		/**
		 * This will get the system mouse event.
		 *
		 * @protected
		 * @return {string}
		 */
		getWheelEventType: function()
		{
			/* this will check what mouse wheel type
			the client supports
			@return (string) the event name */
			var getMouseWheelType = function()
			{
				var type = 'wheel';
				if('onmousewheel' in global)
				{
					type = 'mousewheel';
				}
				else if('DOMMouseScroll' in global)
				{
					type = 'DOMMouseScroll';
				}
				return type;
			};

			/* this will get the event type or
			one time set the type and return the type */
			return this.mouseWheelEventType || (
				this.mouseWheelEventType = getMouseWheelType()
			);
		},

		/**
		 * This will add a mouse event to  an object.
		 *
		 * @param {function} callBackFn
		 * @param {object} [obj]
		 * @param {boolean} [cancelDefault]
		 * @param {boolean} capture
		 * @return {object} base object.
		 */
		onMouseWheel: function(callBackFn, obj, cancelDefault, capture)
		{
			if(typeof obj === "undefined")
			{
				 obj = window;
			}

			var self = this;

			/* we want to return the mousewheel data
			to this private callback function before
			returning to the call back function*/
			var mouseWheelResults = function(e)
			{
				e = e || window.event;
				var delta = Math.max(-1, Math.min(1, (-e.deltaY || e.wheelDelta || -e.detail)));

				/* we can now send the mouse wheel results to
				the call back function */
				if(typeof callBackFn === 'function')
				{
					callBackFn(delta, e);
				}

				/* we want to check to cancel default */
				if(cancelDefault === true)
				{
					self.preventDefault(e);
				}
			};

			var event = this.getWheelEventType();
			this.events.add(event, obj, mouseWheelResults, capture, true, callBackFn);
			return this;
		},

		/**
		 * This will remove a mouse event
		 *
		 * @param {function} callBackFn
		 * @param {object} [obj]
		 * @param {boolean} capture
		 * @return {object} base object.
		 */
		offMouseWheel: function(callBackFn, obj, capture)
		{
			if(typeof obj === "undefined")
			{
				obj = window;
			}

			var event = this.getWheelEventType();
			this.off(event, obj, callBackFn, capture);
			return this;
		},

		/**
		 * This will prevent default on an event.
		 *
		 * @param {object} e
		 * @return {object} base object.
		 */
		preventDefault: function(e)
		{
			e = e || window.event;

			if(typeof e.preventDefault === 'function')
			{
				e.preventDefault();
			}
			else
			{
				e.returnValue = false;
			}

			return this;
		},

		/**
		 * This will stop an event from propigating.
		 *
		 * @param {object} e
		 * @return {object} base object.
		 */
		stopPropagation: function(e)
		{
			e = e || window.event;

			if(typeof e.stopPropagation === 'function')
			{
				e.stopPropagation();
			}
			else
			{
				e.cancelBubble = true;
			}

			return this;
		}
	});

})(this);