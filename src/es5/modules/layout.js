/* base framework module */
/*
	this will create a layout builder object
	and shortcut functions.
*/
(function(global)
{
	"use strict";

	/**
	 * LayoutParser
	 *
	 * This will parse JSON layouts.
	 * @class
	 */
	var LayoutParser = base.Class.extend(
	{
		/**
		 * @member {array} _reserved
		 * @protected
		 */
		_reserved: [
			'tag',
			'bind',
			'onCreated',
			'route',
			'switch',
			'useParent',
			'useState',
			'useData',
			'addState',
			'map',
			'for',
			'html',
			'onSet',
			'onState',
			'watch',
			'cache'
		],

		/**
		 * This will get the tag name of an element.
		 *
		 * @param {object} obj
		 * @return {string}
		 */
		getElementTag: function(obj)
		{
			var type = 'div';

			var node = obj.tag || obj.t;
			if (typeof node !== 'undefined')
			{
				type = obj.tag = node;
			}

			return type;
		},

		/**
		 * This will setup the element children.
		 *
		 * @param {object} obj
		 */
		setupChildren: function(obj)
		{
			if(obj.nest)
			{
				obj.children = obj.nest;
				obj.nest = null;
			}

			if(typeof obj.children === 'undefined')
			{
				obj.children = null;
			}
		},

		/**
		 * This will parse a layout element.
		 *
		 * @param {object} obj
		 * @return {object}
		 */
		parseElement: function(obj)
		{
			var attr = {},
			children = [];

			var tag = this.getElementTag(obj);
			if(tag === 'button')
			{
				attr.type = attr.type || 'button';
			}

			this.setupChildren(obj);
			var reserved = this._reserved;

			for (var key in obj)
			{
				if (obj.hasOwnProperty(key))
				{
					var value = obj[key];
					if (value === null || base.inArray(reserved, key) !== -1)
					{
						continue;
					}

					/* we need to filter the children from the attr
					settings. the children need to keep their order. */
					if (typeof value !== 'object')
					{
						attr[key] = value;
					}
					else
					{
						if (key === 'children')
						{
							//Array.prototype.push.apply(children, value);
							children = children.concat(value);
						}
						else
						{
							children.push(value);
						}
					}
				}
			}

			return {
				tag: tag,
				attr: attr,
				children: children
			};
		}
	});

	var WATCHER_PATTERN = /(\[\[(.*?)\]\])/g;

	/**
	 * WatcherHelper
	 *
	 * This helper creates watcher callBacks, parses watcher strings
	 * and sets up watchers.
	 */
	var WatcherHelper =
	{
		/**
		 * This will get the property names to be watched.
		 *
		 * @protected
		 * @param {string} string
		 * @return {(array|null)}
		 */
		_getWatcherProps: function(string)
		{
			var pattern = /\[\[(.*?)\]\]/g;
			var matches = string.match(pattern);
			if(matches)
			{
				pattern = /(\[\[|\]\])/g;
				for(var i = 0, length = matches.length; i < length; i++)
				{
					matches[i] = matches[i].replace(pattern, '');
				}
			}
			return matches;
		},

		/**
		 * This will update an element attribute.
		 *
		 * @protected
		 * @param {object} ele
		 * @param {string} attr
		 * @param {string} value
		 */
		updateAttr: function(ele, attr, value)
		{
			if(attr === 'text' || attr === 'textContent')
			{
				ele.textContent = value;
			}
			else if(attr === 'innerHTML')
			{
				ele.innerHTML = value;
			}
			else
			{
				if(attr.substr(4, 1) === '-')
				{
					base.setAttr(ele, attr, value);
				}
				else
				{
					ele[attr] = value;
				}
			}
		},

		/**
		 * This will get a watcher callBack.
		 *
		 * @protected
		 * @param {object} ele
		 * @param {(object|array)} data
		 * @param {string} string
		 * @param {string} attr
		 * @param {boolean} isArray
		 * @return {function}
		 */
		_getWatcherCallBack: function(ele, data, string, attr, isArray)
		{
			var self = this;
			return function()
			{
				var count = 0,
				value = string.replace(WATCHER_PATTERN, function()
				{
					var watcherData = (isArray)? data[count] : data;
					count++;
					var result = watcherData.get(arguments[2]);
					return (typeof result !== 'undefined'? result : '');
				});
				self.updateAttr(ele, attr, value);
			};
		},

		/**
		 * This will get a watcher value.
		 *
		 * @private
		 * @param {(string|object)} settings
		 * @param {object} parent
		 * @return {array}
		 */
		getValue: function(settings, parent)
		{
			if(typeof settings === 'string')
			{
				settings =
				{
					value: settings
				};
			}

			var value = settings.value;
			if(base.isArray(value) === false)
			{
				value = [value, (parent.data || parent.state)];
			}
			return value;
		},

		/**
		 * This will get the prop values.
		 *
		 * @param {object} data
		 * @param {string} string
		 * @param {bool} isArray
		 * @return {array}
		 */
		getPropValues: function(data, props, isArray)
		{
			var values = [];

			for(var i = 0, length = props.length; i < length; i++)
			{
				var watcherData = (isArray)? data[i] : data;
				var value = watcherData.get(props[i]);
				value = (typeof value !== 'undefined'? value : '');
				values.push(value);
			}

			return values;
		},

		/**
		 * This will get the watcher callBack.
		 *
		 * @param {object} settings
		 * @param {object} ele
		 * @param {object} data
		 * @param {string} string
		 * @param {bool} isDataArray
		 * @return {function}
		 */
		getCallBack: function(settings, ele, data, string, isDataArray)
		{
			var callBack,
			overrideCallBack = settings.callBack;
			if(typeof overrideCallBack === 'function')
			{
				var self = this;
				var props = string.match(WATCHER_PATTERN);
				var isMultiProp = (props && props.length > 1);
				callBack = function(value, committer)
				{
					value = (isMultiProp !== true)? value : self.getPropValues(data, props, isDataArray);
					overrideCallBack(ele, value, committer);
				};
			}
			else
			{
				var attr = settings.attr || 'textContent';
				callBack = this._getWatcherCallBack(ele, data, string, attr, isDataArray);
			}
			return callBack;
		},

		/**
		 * This will add a data watcher.
		 *
		 * @private
		 * @param {object} ele
		 * @param {(string|object)} settings
		 * @param {object} parent
		 */
		addDataWatcher: function(ele, settings, parent)
		{
			var value = this.getValue(settings, parent),
			data = value[1];
			if(!data)
			{
				return false;
			}

			var string = value[0],
			isDataArray = base.isArray(data);

			var callBack = this.getCallBack(settings, ele, data, string, isDataArray);
			var props = this._getWatcherProps(string);
			for(var i = 0, length = props.length; i < length; i++)
			{
				var watcherData = (isDataArray)? data[i] : data;
				this.addWatcher(ele, watcherData, props[i], callBack);
			}
		},

		/**
		 * This will setup a data watcher.
		 *
		 * @param {object} ele
		 * @param {(string|object)} settings
		 * @param {object} parent
		 */
		setup: function(ele, settings, parent)
		{
			if(!settings)
			{
				return false;
			}

			this.addDataWatcher(ele, settings, parent);
		},

		/**
		 * This will add a watcher.
		 *
		 * @private
		 * @param {object} ele
		 * @param {object} data
		 * @param {string} prop
		 * @param {function} callBack
		 */
		addWatcher: function(ele, data, prop, callBack)
		{
			base.DataBinder.watch(ele, data, prop, callBack);
		}
	};

	/**
	 * This will create a watch element.
	 *
	 * @param {object} data
	 * @param {string} prop
	 * @returns {function}
	 */
	global.Watch = function(data, prop)
	{
		return function(callBack)
		{
			return {
				onSet: [data, prop, function(ele, value)
				{
					return callBack(value);
				}]
			};
		};
	};

	var parser = new LayoutParser();

	/**
	 * LayoutBuilder
	 *
	 * This will build JSON layouts.
	 *
	 * @class
	 * @augments base.htmlBuilder
	 */
	var LayoutBuilder = base.htmlBuilder.extend(
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
		create: function(nodeName, attrObject, container, parent)
		{
			var obj = document.createElement(nodeName);
			this._addElementAttrs(obj, attrObject, parent);
			this.append(container, obj);
			return obj;
		},

		/**
		 * This will add the element attributes.
		 *
		 * @protected
		 * @param {object} obj
		 * @param {object} attrObject
		 * @param {object} parent
		 */
		_addElementAttrs: function(obj, attrObject, parent)
		{
			/* we want to check if we have attrributes to add */
			if(!attrObject || typeof attrObject !== 'object')
			{
				return false;
			}

			/* we need to add the type if set to stop ie
			from removing the value if set after the value is
			added */
			var type = attrObject.type;
			if(typeof type !== 'undefined')
			{
				base.setAttr(obj, 'type', type);
			}

			/* we want to add each attr to the obj */
			for(var prop in attrObject)
			{
				/* we have already added the type so we need to
				skip if the prop is type */
				if(attrObject.hasOwnProperty(prop) === false || prop === 'type')
				{
					continue;
				}

				var attrPropValue = attrObject[prop];

				/* we want to check to add the attr settings
				 by property name */
				if(prop === 'innerHTML')
				{
					obj.innerHTML = attrPropValue;
				}
				else if(prop.substr(4, 1) === '-')
				{
					// this will handle data and aria attributes
					base.setAttr(obj, prop, attrPropValue);
				}
				else
				{
					this.addAttr(obj, prop, attrPropValue, parent);
				}
			}
		},

		/**
		 * This will add an element attribute.
		 *
		 * @param {object} obj
		 * @param {object} attr
		 * @param {string} value
		 */
		addAttr: function(obj, attr, value, parent)
		{
			if(value === '' || !attr)
			{
				return false;
			}

			/* we want to check to add a value or an event listener */
			var type = typeof value;
			if(type === 'function')
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
				var attrName = normalizeAttr(attr);
				obj[attrName] = value;
			}
		},

		/**
		 * This will render a function/Unit/Component.
		 *
		 * @param {object|function} layout
		 * @param {object} container
		 * @returns {object} The layout Unit or Component
		 */
		render: function(layout, container)
		{
			if(!layout)
			{
				return;
			}

			switch(typeof layout)
			{
				case 'object':
					if(layout.isUnit === true)
					{
						layout.setup(container);
						return layout;
					}
				default:
					var component = Jot(layout);
					var jot = new component();
					jot.setup(container);
					return jot;
			}
		},

		/**
		 * This will build a JSON layout.
		 *
		 * @param {object} obj The JSON layout.
		 * @param {object} [container] The parent receiving the layout.
		 * @param {object} [parent] The component adding the layout.
		 * @return {object} The doc Frag element.
		 */
		build: function(obj, container, parent)
		{
			var fragment = this.createDocFragment();

			if (base.isArray(obj))
			{
				var item;
				for (var i = 0, length = obj.length; i < length; i++)
				{
					item = obj[i];
					this.buildElement(item, fragment, parent);
				}
			}
			else
			{
				this.buildElement(obj, fragment, parent);
			}

			if(container && typeof container === 'object')
			{
				container.appendChild(fragment);
			}
			return fragment;
		},

		/**
		 * This will build an element or component.
		 *
		 * @param {object} obj
		 * @param {object} container
		 * @param {object} [parent] The component adding the layout.
		 */
		buildElement: function(obj, container, parent)
		{
			if(!obj)
			{
				return;
			}

			if(obj.component || obj.isUnit === true)
			{
				this.createComponent(obj, container, parent);
			}
			else
			{
				this.createElement(obj, container, parent);
			}
		},

		/**
		 * This will append a child element to a parent.
		 *
		 * @override
		 * @param {object} parent
		 * @param {object} child
		 */
		append: function(parent, child)
		{
			parent.appendChild(child);
		},

		/**
		 * This will create an element.
		 *
		 * @protected
		 * @param {object} obj
		 * @param {object} container
		 * @param {object} [parent] The component adding the layout.
		 */
		createElement: function(obj, container, parent)
		{
			var settings = parser.parseElement(obj);
			var ele = this.createNode(settings, container, parent);

			var propName = obj.cache;
			if(parent && propName)
			{
				parent[propName] = ele;
			}

			/* we want to recursively add the children to
			the new element */
			var children = settings.children;
			if (children.length > 0)
			{
				var child;
				for (var i = 0, length = children.length; i < length; i++)
				{
					child = children[i];
					if(child === null)
					{
						continue;
					}

					this.buildElement(child, ele, parent);
				}
			}

			if(typeof obj.onCreated === 'function')
			{
				obj.onCreated(ele);
			}

			/* this will check to bind the element to
			the prop of a data */
			var bind = obj.bind;
			if(bind)
			{
				this.bindElement(ele, bind, parent);
			}

			if(obj.route)
			{
				this.addRoute(ele, obj.route, parent);
			}

			if(obj.switch)
			{
				this.addSwitch(ele, obj.switch, parent);
			}

			if(obj.html)
			{
				this.addHtml(ele, obj.html);
			}

			if(parent)
			{
				var onState = obj.onState;
				if(onState && onState.length)
				{
					this.onState(ele, onState, parent);
				}

				var onSet = obj.onSet;
				if(onSet && onSet.length)
				{
					this.onSet(ele, onSet, parent);
				}

				var map = obj.map;
				if(map && map.length)
				{
					this.map(ele, map, parent);
				}

				var forBind = obj.for;
				if(forBind && forBind.length)
				{
					this.for(ele, forBind, parent);
				}

				var useParent = obj.useParent;
				if(useParent)
				{
					this.useParent(ele, useParent, parent);
				}

				var useData = obj.useData;
				if(useData)
				{
					this.useData(ele, useData, parent);
				}

				var useState = obj.useState;
				if(useState)
				{
					this.useState(ele, useState, parent);
				}

				var addState = obj.addState;
				if(addState)
				{
					this.addState(ele, addState, parent);
				}
			}

			if(obj.watch)
			{
				this.watch(ele, obj.watch, parent);
			}
		},

		/**
		 * This will get the data source from the parent component.
		 *
		 * @protected
		 * @param {object} parent
		 * @return {(object|boolean)}
		 */
		_getDataSource: function(parent)
		{
			if(!parent)
			{
				return false;
			}

			return (parent.data || parent.state || false);
		},

		/**
		 * This will bind an element to data.
		 *
		 * @protected
		 * @param {object} ele
		 * @param {(string|array)} bind
		 * @param {*} parent
		 */
		bindElement: function(ele, bind, parent)
		{
			var data, prop, filter;

			if(typeof bind === 'string')
			{
				data = this._getDataSource(parent);
				if(!data)
				{
					return false;
				}

				prop = bind;
			}
			else
			{
				if(typeof bind[0] !== 'object')
				{
					var dataSource = this._getDataSource(parent);
					if(!dataSource)
					{
						return false;
					}
					else
					{
						bind.unshift(dataSource);
					}
				}

				data = bind[0];
				prop = bind[1];
				filter = bind[2];
			}

			base.DataBinder.bind(ele, data, prop, filter);
		},

		/**
		 * This will add a route.
		 *
		 * @protected
		 * @param {object} ele
		 * @param {(object|array)} route
		 * @param {object} parent
		 */
		addRoute: function(ele, route, parent)
		{
			if(!route)
			{
				return false;
			}

			if(base.isArray(route))
			{
				for(var i = 0, length = route.length; i < length; i++)
				{
					this.setupRoute(ele, route[i], parent);
				}
			}
			else
			{
				this.setupRoute(ele, route, parent);
			}
		},

		/**
		 * This will setup a route.
		 *
		 * @protected
		 * @param {object} ele
		 * @param {object} route
		 * @param {object} parent
		 */
		setupRoute: function(ele, route, parent)
		{
			// this will check to resume route
			// if(this.checkResume(route))
			// {
			// 	this.resumeRoute(ele, route.component.route);
			// 	return;
			// }

			route.container = ele;
			route.parent = parent;
			var newRoute = base.router.add(route);

			this.trackRoute(ele, newRoute);
		},

		/**
		 * This will check to resume route.
		 *
		 * @param {object} route
		 */
		checkResume: function(route)
		{
			return (route && route.component && route.component.route);
		},

		/**
		 * This will resume a route.
		 *
		 * @param {object} ele
		 * @param {object} route
		 */
		resumeRoute: function(ele, route)
		{
			base.router.resume(route, ele);

			this.trackRoute(ele, route);
		},

		/**
		 * This will track a route.
		 *
		 * @param {object} ele
		 * @param {object} route
		 */
		trackRoute: function(ele, route)
		{
			base.DataTracker.add(ele, 'routes',
			{
				route: route
			});
		},

		/**
		 * This will add a switch.
		 *
		 * @protected
		 * @param {object} ele
		 * @param {array} group
		 * @param {object} parent
		 */
		addSwitch: function(ele, group, parent)
		{
			var route = group[0];
			// this will check to resume switch
			// if(this.checkResume(route))
			// {
			// 	this.resumeSwitch(ele, group);
			// 	return;
			// }

			for(var i = 0, length = group.length; i < length; i++)
			{
				route = group[i];
				route.container = ele;
				route.parent = parent;
			}

			var id = base.router.addSwitch(group);
			this.trackSwitch(ele, id);
		},

		resumeSwitch: function(ele, group)
		{
			var id = base.router.resumeSwitch(group, ele);
			this.trackSwitch(ele, id);
		},

		/**
		 * This will track a switch.
		 *
		 * @param {object} ele
		 * @param {int} id
		 */
		trackSwitch: function(ele, id)
		{
			base.DataTracker.add(ele, 'switch',
			{
				id: id
			});
		},

		/**
		 * This will add a watcher.
		 *
		 * @protected
		 * @param {object} ele
		 * @param {(array|object)} watcher
		 * @param {object} [parent]
		 */
		watch: function(ele, watcher, parent)
		{
			if(!watcher)
			{
				return false;
			}

			if(base.isArray(watcher))
			{
				for(var i = 0, length = watcher.length; i < length; i++)
				{
					WatcherHelper.setup(ele, watcher[i], parent);
				}
			}
			else
			{
				WatcherHelper.setup(ele, watcher, parent);
			}
		},

		/**
		 * This will pass the parent state to the callBack.
		 *
		 * @param {object} ele
		 * @param {function} callBack
		 * @param {object} parent
		 */
		useParent: function(ele, callBack, parent)
		{
			if(!callBack || !parent)
			{
				return false;
			}

			callBack(parent, ele);
		},

		/**
		 * This will pass the parent state to the callBack.
		 *
		 * @param {object} ele
		 * @param {function} callBack
		 * @param {object} parent
		 */
		useData: function(ele, callBack, parent)
		{
			if(!callBack || !parent)
			{
				return false;
			}

			callBack(parent.data, ele);
		},

		/**
		 * This will pass the parent state to the callBack.
		 *
		 * @param {object} ele
		 * @param {function} callBack
		 * @param {object} parent
		 */
		useState: function(ele, callBack, parent)
		{
			if(!callBack || !parent)
			{
				return false;
			}

			callBack(parent.state, ele);
		},

		/**
		 * This will pass the parent state to the callBack.
		 *
		 * @param {object} ele
		 * @param {function} callBack
		 * @param {object} parent
		 */
		addState: function(ele, callBack, parent)
		{
			if(!callBack || !parent)
			{
				return false;
			}

			if(parent.stateHelper)
			{
				var state = parent.state;
				var states = callBack(state);
				parent.stateHelper.addStates(states);
			}
		},

		/**
		 * This will map children to the element.
		 *
		 * @param {object} ele
		 * @param {array} settings
		 * @param {object} parent
		 */
		map: function(ele, settings, parent)
		{
			var items = settings[0];
			if(!items || items.length < 1)
			{
				return;
			}

			var item = settings[1];
			var children = [];
			for(var i = 0, length = items.length; i < length; i++)
			{
				var layout = item(items[i], i);
				if(layout === null)
				{
					continue;
				}

				children.push(layout);
			}

			return this.build(children, ele, parent);
		},

		/**
		 * This will watch a data attr and update the
		 * children to the element when the attr value is updated.
		 *
		 * @param {object} ele
		 * @param {array} settings
		 * @param {object} parent
		 */
		for: function(ele, settings, parent)
		{
			var data, prop, item;

			if(settings.length < 3)
			{
				if(!parent.data)
				{
					return;
				}

				data = parent.data;
				prop = settings[0];
				item = settings[1];
			}
			else
			{
				data = settings[0];
				prop = settings[1];
				item = settings[2];
			}

			var self = this;
			base.DataBinder.watch(ele, data, prop, function(items)
			{
				self.removeAll(ele);
				if(!items || items.length < 1)
				{
					return;
				}

				self.map(ele, [items, item], parent);
			});
		},

		/**
		 * This will add an onState watcher.
		 *
		 * @param {object} ele
		 * @param {array} onState
		 * @param {object} parent
		 */
		onState: function(ele, onState, parent)
		{
			this.onUpdate(ele, parent.state, onState, parent);
		},

		/**
		 * This will add an onSet watcher.
		 *
		 * @param {object} ele
		 * @param {array} onSet
		 * @param {object} parent
		 */
		onSet: function(ele, onSet, parent)
		{
			this.onUpdate(ele, parent.data, onSet, parent);
		},

		/**
		 * This will setup a data watcher.
		 *
		 * @param {object} ele
		 * @param {object} data
		 * @param {string} prop
		 * @param {(function|object)} callBack
		 * @param {string} parent
		 */
		onUpdate: function(ele, data, settings, parent)
		{
			var prop,
			self = this,
			callBack, update;

			if(base.isArray(settings[0]))
			{
				for(var i = 0, maxLength = settings.length; i < maxLength; i++)
				{
					var itemSettings = settings[i];
					if(!itemSettings)
					{
						continue;
					}

					this.onUpdate(ele, data, itemSettings, parent);
				}
				return;
			}

			if(settings.length < 3)
			{
				prop = settings[0];
				callBack = settings[1];
			}
			else
			{
				data = settings[0];
				prop = settings[1];
				callBack = settings[2];
			}

			if(!data || !prop)
			{
				return false;
			}

			switch(typeof callBack)
			{
				case 'object':
					update = function(value)
					{
						self.addClass(ele, callBack, value);
					};
					break;
				case 'function':
					update = function(value)
					{
						self.updateElement(ele, callBack, prop, value, parent);
					};
					break;
			}

			base.DataBinder.watch(ele, data, prop, update);
		},

		/**
		 * This will setup a data watcher.
		 *
		 * @private
		 * @param {object} ele
		 * @param {function} callBack
		 * @param {string} value
		 * @param {string} parent
		 */
		updateElement: function(ele, callBack, prop, value, parent)
		{
			var result = callBack(ele, value);
			switch(typeof result)
			{
				case 'object':
					if(parent && result && result.isUnit === true && parent.persist === true && parent.state)
					{
						var key = prop + ':' + value,
						state = parent.state,
						previousResult = state.get(key);
						if(typeof previousResult !== 'undefined')
						{
							result = previousResult;
						}

						state.set(key, result);
					}
					this.rebuild(ele, result, parent);
					break;
				case 'string':
					this.addHtml(ele, result);
					break;
			}
		},

		/**
		 * This will add or remove a class from an element.
		 *
		 * @param {object} ele
		 * @param {object} stateStyles
		 * @param {*} newValue
		 */
		addClass: function(ele, stateStyles, newValue)
		{
			for(var prop in stateStyles)
			{
				if(!stateStyles.hasOwnProperty(prop) || !prop)
				{
					continue;
				}

				if(stateStyles[prop] === newValue)
				{
					base.addClass(ele, prop);
				}
				else
				{
					base.removeClass(ele, prop);
				}
			}
		},

		/**
		 * This will reset an element innerHTML and rebuild.
		 *
		 * @private
		 * @param {object} ele
		 * @param {object} layout
		 * @param {object} parent
		 */
		rebuild: function(ele, layout, parent)
		{
			this.removeAll(ele);
			this.build(layout, ele, parent);
		},

		/**
		 * This will create a component.
		 *
		 * @protected
		 * @param {object} obj
		 * @param {object} container
		 * @param {object} parent
		 */
		createComponent: function(obj, container, parent)
		{
			// this will allow both cached components or native components
			var component = obj.component || obj;
			component.parent = parent;

			if(parent && parent.persist === true && component.persist !== false)
			{
				component.persist = true;
			}

			component.setup(container);

			if(obj.component && typeof obj.onCreated === 'function')
			{
				obj.onCreated(component);
			}
		},

		/**
		 * This will create a node.
		 *
		 * @param {object} settings
		 * @param {object} container
		 * @param {object} parent
		 * @return {object}
		 */
		createNode: function(settings, container, parent)
		{
			var tag = settings.tag;
			if(tag !== 'text')
			{
				return this.create(tag, settings.attr, container, parent);
			}

			var attr = settings.attr;
			var text = attr.textContent || attr.text;
			return this.createTextNode(text, container);
		}
	});

	var builder = base.extend.builder = new LayoutBuilder();

	/**
	 * This will build a JSON layout.
	 *
	 * @param {object} obj
	 * @param {object} [container]
	 * @param {object} [parent]
	 * @return {object}
	 */
	base.extend.buildLayout = function(obj, container, parent)
	{
		builder.build(obj, container, parent);
	};
})(this);