/* base framework module */
(function()
{
	"use strict";

	/**
	 * DataPubSub
	 *
	 * This is a pub sub class to allow subscribers to
	 * listen for updates when published by publishers.
	 * @class
	 */
	var DataPubSub = base.Class.extend(
	{
		/**
		 * @constructor
		 */
		constructor: function()
		{
			/**
			 * @member {object} callBacks
			 * @protected
			 */
			this.callBacks = {};

			/**
			 * @member {int} lastToken
			 * @protected
			 */
			this.lastToken = -1;
		},

		/**
		 * This will get a subscriber array.
		 *
		 * @param {string} msg
		 * @return {array}
		 */
		get: function(msg)
		{
			var callBacks = this.callBacks;
			return (callBacks[msg] || (callBacks[msg] = []));
		},

		/**
		 * This will reset pub sub.
		 */
		reset: function()
		{
			this.callBacks = {};
			this.lastToken = -1;
		},

		/**
		 * This will add a subscriber.
		 *
		 * @param {string} msg
		 * @param {function} callBack
		 * @return {string} The subscriber token.
		 */
		on: function(msg, callBack)
		{
			var token = (++this.lastToken);
			var list = this.get(msg);
			list.push({
				token: token,
				callBack: callBack
			});
			return token;
		},

		/**
		 * This will remove a subscriber.
		 *
		 * @param {string} msg
		 * @param {string} token
		 */
		off: function(msg, token)
		{
			var list = this.callBacks[msg] || false;
			if(list === false)
			{
				return false;
			}

			var length = list.length;
			for (var i = 0; i < length; i++ )
			{
				var item = list[i];
				if(item.token === token)
				{
					list.splice(i, 1);
					break;
				}
			}
		},

		/**
		 * This will delete a message.
		 *
		 * @param {string} msg
		 */
		remove: function(msg)
		{
			var callBacks = this.callBacks;
			if(callBacks[msg])
			{
				delete callBacks[msg];
			}
		},

		/**
		 * This will publish a message.
		 *
		 * @param {string} msg
		 * @param {string} value
		 * @param {object} committer
		 */
		publish: function(msg)
		{
			var i, length,
			list = this.callBacks[msg] || false;
			if(list === false)
			{
				return false;
			}

			var args = Array.prototype.slice.call(arguments, 1);

			length = list.length;
			for (i = 0; i < length; i++)
			{
				var item = list[i];
				if(!item)
				{
					continue;
				}
				item.callBack.apply(this, args);
			}
		}
	});

	var pubSub = new DataPubSub();
	base.extend.DataPubSub = DataPubSub;

	/**
	 * Source
	 *
	 * This will create a new source to use with
	 * a connection.
	 * @class
	 */
	var Source = base.Class.extend(
	{
		/**
		 * @constructor
		 */
		constructor: function()
		{
			/**
			 * @member {string} msg
			 * @protected
			 */
			this.msg = null;

			/**
			 * @member {string} token
			 */
			this.token = null;
		},

		/**
		 * This will set the token.
		 *
		 * @param {string} token
		 */
		setToken: function(token)
		{
			this.token = token;
		}
	});

	/**
	 * OneWaySource
	 *
	 * This will create a one way source to use with
	 * a connection.
	 * @class
	 * @augments Source
	 */
	var OneWaySource = Source.extend(
	{
		/**
		 * This will setup the data source.
		 *
		 * @param {object} data
		 */
		constructor: function(data)
		{
			Source.call(this);
			this.data = data;
		},

		/**
		 * This will subscribe to a message.
		 *
		 * @param {string} msg
		 * @param {function} callBack
		 */
		subscribe: function(msg, callBack)
		{
			this.msg = msg;
			this.token = this.data.on(msg, callBack);
		},

		/**
		 * This will unsubscribe from the message.
		 */
		unsubscribe: function()
		{
			this.data.off(this.msg, this.token);
		}
	});

	/**
	 * TwoWaySource
	 *
	 * This will create a two way source to use with
	 * a connection.
	 * @class
	 * @augments Source
	 */
	var TwoWaySource = Source.extend(
	{
		/**
		 * @member {function} callBack
		 */
		callBack: null,

		/**
		 * This will subscribe to a message.
		 *
		 * @param {string} msg
		 */
		subscribe: function(msg)
		{
			this.msg = msg;
			var callBack = base.bind(this, this.callBack);
			this.token = pubSub.on(msg, callBack);
		},

		/**
		 * This will unsubscribe from a message.
		 */
		unsubscribe: function()
		{
			pubSub.off(this.msg, this.token);
		}
	});

	/**
	 * DataSource
	 *
	 * This will create a data source to use with
	 * a connection.
	 * @class
	 * @augments TwoWaySource
	 */
	var DataSource = TwoWaySource.extend(
	{
		/**
		 * @constructor
		 * @param {object} data
		 * @param {string} prop
		 */
		constructor: function(data, prop)
		{
			TwoWaySource.call(this);
			this.data = data;
			this.prop = prop;
		},

		/**
		 * This will set the data value.
		 *
		 * @param {*} value
		 */
		set: function(value)
		{
			this.data.set(this.prop, value);
		},

		/**
		 * This will get the data value.
		 */
		get: function()
		{
			return this.data.get(this.prop);
		},

		/**
		 * The callBack when updated.
		 *
		 * @param {*} value
		 * @param {object} committer
		 */
		callBack: function(value, committer)
		{
			if(this.data !== committer)
			{
				this.data.set(this.prop, value, committer);
			}
		}
	});

	/**
	 * This will set an element attr by the setAttribute method.
	 *
	 * @param {object} element
	 * @param {string} attr
	 * @param {mixed} value
	 */
	var SetAttr = function(element, attr, value)
	{
		base.setAttr(element, attr, value);
	};

	var UpdateRadioAttr = function(element, attr, value)
	{
		element.checked = (element.value === value);
	};

	var UpdateCheckboxAttr = function(element, attr, value)
	{
		value = (value == 1);
		UpdateAttr(element, attr, value);
	};

	/**
	 * This will update an element attr by the bracket notation.
	 *
	 * @param {object} element
	 * @param {string} attr
	 * @param {nixed} value
	 */
	var UpdateAttr = function(element, attr, value)
	{
		element[attr] = value;
	};

	var GetAttr = function(element, attr)
	{
		return base.getAttr(element, attr);
	};

	var GetAttribute = function(element, attr)
	{
		return element[attr];
	};

	/**
	 * ElementSource
	 *
	 * This will create an element source to use with
	 * a connection.
	 * @class
	 * @augments TwoWaySource
	 */
	var ElementSource = TwoWaySource.extend(
	{
		/**
		 * @constructor
		 * @param {object} element
		 * @param {string} attr
		 * @param {(string|function)} [filter]
		 */
		constructor: function(element, attr, filter)
		{
			TwoWaySource.call(this);
			this.element = element;
			this.attr = this.getAttrBind(attr);
			this.addSetMethod(element, this.attr);

			if(typeof filter === 'string')
			{
				filter = this.setupFilter(filter);
			}
			this.filter = filter;
		},

		addSetMethod: function(element, attr)
		{
			if(attr.substr(4, 1) === '-')
			{
				this.setValue = SetAttr;
				this.getValue = GetAttr;
			}
			else
			{
				this.getValue = GetAttribute;

				var type = element.type;
				if(type)
				{
					switch(type)
					{
						case 'checkbox':
							this.setValue = UpdateCheckboxAttr;
							return;
						case 'radio':
							this.setValue = UpdateRadioAttr;
							return;
					}
				}

				this.setValue = UpdateAttr;
			}
		},

		/**
		 * This will get the bind attribute.
		 *
		 * @param {string} [customAttr]
		 * @return {string}
		 */
		getAttrBind: function(customAttr)
		{
			/* this will setup the custom attr if the prop
			has specified one. */
			if(customAttr)
			{
				return customAttr;
			}

			var attr = 'textContent';
			/* if no custom attr has been requested we will get the
			default attr of the element */
			var element = this.element;
			if(!(element && typeof element === 'object'))
			{
				return attr;
			}

			var tagName = element.tagName.toLowerCase();
			if (tagName === "input" || tagName === "textarea" || tagName === "select")
			{
				var type = element.type;
				if(type)
				{
					switch(type)
					{
						case 'checkbox':
							attr = 'checked';
							break;
						case 'file':
							attr = 'files';
							break;
						default:
							attr = 'value';
					}
				}
				else
				{
					attr = 'value';
				}
			}
			return attr;
		},

		/**
		 * This will setup a filter callBack.
		 *
		 * @param {string} filter
		 * @return {function}
		 */
		setupFilter: function(filter)
		{
			var pattern = /(\[\[[^\]]+\]\])/;
			return function(value)
			{
				return filter.replace(pattern, value);
			};
		},

		/**
		 * This will set a value on an element.
		 *
		 * @param {*} value
		 */
		set: function(value)
		{
			var element = this.element;
			if(!element || typeof element !== 'object')
			{
				return false;
			}

			/* this will check to apply the option filter before
			setting the value */
			if(this.filter)
			{
				value = this.filter(value);
			}

			this.setValue(element, this.attr, value);
		},

		/**
		 * This will get the value from an element.
		 */
		get: function()
		{
			var element = this.element;
			if(!element || typeof element !== 'object')
			{
				return '';
			}

			return this.getValue(element, this.attr);
		},

		/**
		 * The callBack when updated.
		 *
		 * @param {*} value
		 * @param {object} committer
		 */
		callBack: function(value, committer)
		{
			if(committer !== this.element)
			{
				this.set(value);
			}
		}
	});

	/**
	 * Connection
	 *
	 * This will create a connection.
	 * @class
	 */
	var Connection = base.Class.extend(
	{
		/**
		 * This will be used to unsubscribe.
		 */
		unsubscribe: function()
		{

		}
	});

	/**
	 * OneWayConnection
	 *
	 * This will create a one way connection.
	 * @class
	 * @augments Connection
	 */
	var OneWayConnection = Connection.extend(
	{
		/**
		 * @constructor
		 */
		constructor: function()
		{
			/**
			 * @member {object} source
			 */
			this.source = null;
		},

		/**
		 * This will setup the connection source.
		 *
		 * @param {object} data
		 * @return {object}
		 */
		addSource: function(data)
		{
			return (this.source = new OneWaySource(data));
		},

		/**
		 * This will be used to unsubscribe.
		 * @override
		 */
		unsubscribe: function()
		{
			this.source.unsubscribe();
			this.source = null;
		}
	});

	/**
	 * TwoWayConnection
	 *
	 * This will setup a two way connection.
	 * @class
	 * @augments Connection
	 */
	var TwoWayConnection = Connection.extend(
	{
		/**
		 * @constructor
		 */
		constructor: function()
		{
			this.element = null;
			this.data = null;
		},

		/**
		 * This will add the element source.
		 *
		 * @param {object} element
		 * @param {string} attr
		 * @param {(string|function)} filter
		 * @return {object}
		 */
		addElement: function(element, attr, filter)
		{
			return (this.element = new ElementSource(element, attr, filter));
		},

		/**
		 * This will add the data source.
		 *
		 * @param {object} data
		 * @param {string} prop
		 * @return {object}
		 */
		addData: function(data, prop)
		{
			return (this.data = new DataSource(data, prop));
		},

		/**
		 * This will unsubscribe from a source.
		 *
		 * @param {object} source
		 */
		unsubscribeSource: function(source)
		{
			if(source)
			{
				source.unsubscribe();
			}
		},

		/**
		 * This will be used to unsubscribe.
		 * @override
		 */
		unsubscribe: function()
		{
			this.unsubscribeSource(this.element);
			this.unsubscribeSource(this.data);

			this.element = null;
			this.data = null;
		}
	});

	/**
	 * ConnectionTracker
	 *
	 * This will create a new connection tracker to track active
	 * connections in the data binder.
	 * @class
	 */
	var ConnectionTracker = base.Class.extend(
	{
		/**
		 * @constructor
		 */
		constructor: function()
		{
			/**
			 * @member {object} connections
			 */
			this.connections = {};
		},

		/**
		 * This will add a new connection to be tracked.
		 *
		 * @param {string} id
		 * @param {string} attr
		 * @param {object} connection
		 * @return {object}
		 */
		add: function(id, attr, connection)
		{
			var connections = this.find(id);
			return (connections[attr] = connection);
		},

		/**
		 * This will get a connection.
		 *
		 * @param {string} id
		 * @param {string} attr
		 * @return {(object|bool)}
		 */
		get: function(id, attr)
		{
			var connections = this.connections[id];
			if(connections)
			{
				return (connections[attr] || false);
			}
			return false;
		},

		/**
		 * This will find a connection.
		 *
		 * @param {string} id
		 * @return {object}
		 */
		find: function(id)
		{
			var connections = this.connections;
			return (connections[id] || (connections[id] = {}));
		},

		/**
		 * This will remove a connection or all connections by id.
		 * @param {string} id
		 * @param {string} [attr]
		 */
		remove: function(id, attr)
		{
			var connections = this.connections[id];
			if(!connections)
			{
				return false;
			}

			var connection;
			if(attr)
			{
				connection = connections[attr];
				if(connection)
				{
					connection.unsubscribe();
					delete connections[attr];
				}

				/* this will remove the msg from the elements
				if no elements are listed under the msg */
				if(base.isEmpty(connections))
				{
					delete this.connections[id];
				}
			}
			else
			{
				for(var prop in connections)
				{
					if(connections.hasOwnProperty(prop))
					{
						connection = connections[prop];
						if(connection)
						{
							connection.unsubscribe();
						}
					}
				}

				delete this.connections[id];
			}
		}
	});

	/**
	 * DataBinder
	 *
	 * This will create a data binder object that can
	 * create one way and two way data bindings.
	 * @class
	 */
	var DataBinder = base.Class.extend(
	{
		/**
		 * @constructor
		 */
		constructor: function()
		{
			this.version = "1.0.1";
			this.attr = 'bindId';

			this.connections = new ConnectionTracker();

			this.idCount = 0;
			this.setup();
		},

		/**
		 * This will setup the events.
		 * @protected
		 */
		setup: function()
		{
			this.setupEvents();
		},

		/**
		 * This will bind an element to a data property.
		 *
		 * @param {object} element
		 * @param {object} data
		 * @param {string} prop
		 * @param {(string|function)} [filter]
		 * @return {object} an instance of the databinder.
		 */
		bind: function(element, data, prop, filter)
		{
			var bindProp = prop,
			bindAttr = null;

			if(prop.indexOf(':') !== -1)
			{
				/* this will setup the custom attr if the prop
				has specified one. */
				var parts = prop.split(':');
				if(parts.length > 1)
				{
					bindProp = parts[1];
					bindAttr = parts[0];
				}
			}

			/* this will setup the model bind attr to the
			element and assign a bind id attr to support
			two way binding */
			var connection = this.setupConnection(element, data, bindProp, bindAttr, filter);

			/* we want to get the starting value of the
			data and set it on our element */
			var connectionElement = connection.element,
			value = data.get(prop);
			if(typeof value !== 'undefined')
			{
				connectionElement.set(value);
			}
			else
			{
				/* this will set the element value
				as the prop value */
				value = connectionElement.get();
				if(value !== '')
				{
					connection.data.set(value);
				}
			}
			return this;
		},

		/**
		 * This will bind an element to a data property.
		 *
		 * @protected
		 * @param {object} element
		 * @param {object} data
		 * @param {string} prop
		 * @param {string} customAttr
		 * @param {(string|function)} [filter]
		 * @return {object} The new connection.
		 */
		setupConnection: function(element, data, prop, customAttr, filter)
		{
			var id = this.getBindId(element);
			var connection = new TwoWayConnection();

			// this will create the data source
			var dataSource = connection.addData(data, prop);
			// this will subscribe the data to the element
			dataSource.subscribe(id);

			/* this will add the data binding
			attr to our element so it will subscribe to
			the two data changes */
			var dataId = data.getDataId(),
			msg = dataId + ':' + prop;

			// this will create the element source
			var elementSource = connection.addElement(element, customAttr, filter);
			// this will subscribe the element to the data
			elementSource.subscribe(msg);

			this.addConnection(id, 'bind', connection);

			return connection;
		},

		/**
		 * This will add a new connection to the
		 * connection tracker.
		 *
		 * @protected
		 * @param {string} id
		 * @param {string} attr
		 * @param {object} connection
		 */
		addConnection: function(id, attr, connection)
		{
			this.connections.add(id, attr, connection);
		},

		/**
		 * This will set the bind id.
		 *
		 * @param {object} element
		 */
		setBindId: function(element)
		{
			var id = 'db-' + this.idCount++;
			element.dataset[this.attr] = id;
			element[this.attr] = id;
			return id;
		},

		/**
		 * This will get the bind id.
		 *
		 * @param {object} element
		 * @return {string}
		 */
		getBindId: function(element)
		{
			return element[this.attr] || this.setBindId(element);
		},

		/**
		 * This will unbind the element.
		 *
		 * @param {object} element
		 * @return {object} an instance of the data binder.
		 */
		unbind: function(element)
		{
			var id = element[this.attr];
			if(id)
			{
				this.connections.remove(id);
			}
			return this;
		},

		/**
		 * This will setup a watcher for an element.
		 *
		 * @param {object} element
		 * @param {object} data
		 * @param {string} prop
		 * @param {function} callBack
		 */
		watch: function(element, data, prop, callBack)
		{
			if(!element || typeof element !== 'object')
			{
				return false;
			}

			var connection = new OneWayConnection();

			// this will create the one way source
			var source = connection.addSource(data);
			source.subscribe(prop, callBack);

			// this will add the new connection to the connection tracker
			var id = this.getBindId(element);
			var attr = data.getDataId() + ':' + prop;
			this.addConnection(id, attr, connection);

			var value = data.get(prop);
			if(typeof value !== 'undefined')
			{
				callBack(value);
			}
		},

		/**
		 * This will remove a watcher from an element.
		 *
		 * @param {object} element
		 * @param {object} data
		 * @param {string} prop
		 */
		unwatch: function(element, data, prop)
		{
			if(!element || typeof element !== 'object')
			{
				return false;
			}

			var id = element[this.attr];
			if(id)
			{
				var attr = data.getDataId() + ':' + prop;
				this.connections.remove(id, attr);
			}
		},

		/**
		 * This will publish to the pub sub.
		 *
		 * @param {string} msg
		 * @param {*} value
		 * @param {object} committer
		 * @return {object} an instance of the data binder.
		 */
		publish: function(msg, value, committer)
		{
			pubSub.publish(msg, value, committer);
			return this;
		},

		/**
		 * This will check if an element is bound.
		 *
		 * @protected
		 * @param {object} element
		 * @return {boolean}
		 */
		isDataBound: function(element)
		{
			if(element)
			{
				var id = element[this.attr];
				if(id)
				{
					return id;
				}
			}
			return false;
		},

		/**
		 * @member {array} blockedKeys
		 * @protected
		 */
		blockedKeys: [
			20, //caps lock
			37, //arrows
			38,
			39,
			40
		],

		isBlocked: function(evt)
		{
			if(evt.type !== 'keyup')
			{
				return false;
			}

			/* this will check to block ctrl, shift or alt +
			buttons */
			return (base.inArray(this.blockedKeys, evt.keyCode) !== -1);
		},

		/**
		 * This is the callBack for the chnage event.
		 *
		 * @param {object} evt
		 */
		bindHandler: function(evt)
		{
			if(this.isBlocked(evt))
			{
				return true;
			}

			var target = evt.target || evt.srcElement;
			var id = this.isDataBound(target);
			if(id)
			{
				var connection = this.connections.get(id, 'bind');
				if(connection)
				{
					var value = connection.element.get();
					/* this will publish to the ui and to the
					model that subscribes to the element */
					pubSub.publish(id, value, target);
				}
			}
			evt.stopPropagation();
		},

		/* this will setup the on change handler and
		add the events. this needs to be setup before adding
		the events. */
		changeHandler: null,

		/**
		 * This wil setup the events.
		 * @protected
		 */
		setupEvents: function()
		{
			this.changeHandler = base.bind(this, this.bindHandler);

			this.addEvents();
		},

		/**
		 * This will add the events.
		 */
		addEvents: function()
		{
			base.on(["change", "keyup"], document, this.changeHandler, false);
		},

		/**
		 * This will remove the events.
		 */
		removeEvents: function()
		{
			base.off(["change", "keyup"], document, this.changeHandler, false);
		}
	});

	base.extend.DataBinder = new DataBinder();
})();