/* base framework module */
/*
	this will create a layout builder object
	and shortcut functions.
*/
(function()
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
			
			if(typeof obj.children === 'undefined')
			{
				obj.children = null; 
			}
			
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
				base.setAttr(ele, attr, value);
			}
		}, 
		
		/**
		 * This will get a watcher callBack. 
		 * 
		 * @protected
		 * @param {object} ele 
		 * @param {(string|array)} data 
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
				pattern = /(\[\[(.*?)\]\])/g, 
				value = string.replace(pattern, function()
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
				callBack = function(value, committer)
				{
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
		 * @param {boolean} [prepend=false] Add to the begining of the container. 
		 * @return {object} The new element. 
		 */
		create: function(nodeName, attrObject, container, prepend)
		{ 
			var obj = document.createElement(nodeName);
			this._addElementAttrs(obj, attrObject); 
			this.append(container, obj); 
			return obj;  
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
			if(obj.component || obj.isComponent === true)
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
			var ele = this.createNode(settings, container); 
			
			var propName = obj.cache; 
			if(parent && propName)
			{
				parent[propName] = ele; 
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
			}
			
			if(obj.watch)
			{
				this.watch(ele, obj.watch, parent); 
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
		}, 
		
		/**
		 * This will get the data source from the parent component. 
		 * 
		 * @protected
		 * @param {object} [parent] 
		 * @return {(object|boolean)}
		 */
		_getDataSource: function(parent)
		{
			if(!parent)
			{
				return false; 
			} 

			var data = (parent.data || parent.state);
			return data || false;
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
			else if(base.isArray(bind)) 
			{
				if((typeof bind[0] !== 'object'))
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
			route.container = ele; 
			route.parent = parent;
			var newRoute = base.router.add(route); 
			
			base.DataTracker.add(ele, 'routes', 
			{
				route: newRoute
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
			for(var i = 0, length = group.length; i < length; i++)
			{
				var route = group[i]; 
				route.container = ele;
				route.parent = parent;
			}
			
			var id = base.router.addSwitch(group); 
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
					if(parent && parent.persist === true && parent.state)
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

			if(parent && parent.persist === true)
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
		 * @return {object}
		 */
		createNode: function(settings, container)
		{ 
			var tag = settings.tag; 
			if(tag !== 'text')
			{ 
				return this.create(tag, settings.attr, container); 
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
})();