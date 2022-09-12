/* base framework module */
(function()
{
	"use strict"; 
	
	/* 
		DataPubSub 
		
		this will create a pub sub object 
		to allow messages to be subscribed to and 
		publish changes that will be pushed to the 
		subscribers. 

	*/ 
	var DataPubSub = base.Class.extend(
	{ 
		constructor: function()
		{ 
			this.callBacks = {}; 
			this.lastToken = -1; 
		}, 

		/* this will get the subscriber array for the 
		message or create a new subscriber array if none 
		is setup already. 
		@param (string) msg 
		@return (array) subscriber array */ 
		get: function(msg) 
		{ 
			var callBacks = this.callBacks;
			return (callBacks[msg] || (callBacks[msg] = []));
		},

		reset: function() 
		{ 
			this.callBacks = {}; 
		}, 

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
		
		off: function(msg, token) 
		{ 
			var list = this.callBacks[msg] || false;
			if(list)
			{
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
			}
		}, 
		
		remove: function(msg) 
		{ 
			var callBacks = this.callBacks; 
			if(callBacks[msg])
			{ 
				delete callBacks[msg]; 
			}
		}, 
		
		publish: function(msg) 
		{ 
			var i, length,
			list = this.callBacks[msg] || false; 
			if(list !== false)
			{ 
				length = list.length;
				for (i = 0; i < length; i++ ) 
				{
					list[i].callBack.apply(this, arguments);
				}
			}
		}
	}); 
	
	var pubSub = new DataPubSub(); 
	base.extend.DataPubSub = DataPubSub;
	
	var Source = base.Class.extend(
	{
		constructor: function()
		{ 
			this.msg = null; 
			this.token = null; 
		}, 
		
		setToken: function(token)
		{
			this.token = token; 
		}, 
		
		callBack: null, 
		
		subscribe: function(msg)
		{
			this.msg = msg; 
			var callBack = base.bind(this, this.callBack); 
			this.token = pubSub.on(msg, callBack); 
		}, 
		
		unsubscribe: function()
		{
			pubSub.off(this.msg, this.token); 
		}
	}); 
	
	var DataSource = Source.extend(
	{
		constructor: function(data, prop)
		{
			Source.call(this); 
			this.data = data;  
			this.prop = prop;   
		}, 
		
		set: function(value)
		{
			this.data.set(this.prop, value); 
		}, 
		
		get: function()
		{
			return this.data.get(this.prop);
		}, 
		
		callBack: function(evt, prop, value, committer) 
		{
			if(this.data !== this.committer) 
			{
				this.data.set(prop, value, committer); 
			}
		}
	}); 
	
	var ElementSource = Source.extend(
	{
		constructor: function(element, attr, filter)
		{
			Source.call(this);   
			this.element = element; 
			this.attr = this.getAttrBind(attr); 
			
			if(typeof filter === 'string')
			{
				filter = this.setupFilter(filter);  
			}
			this.filter = filter; 
		}, 
		
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
			if(element && typeof element === 'object') 
			{ 
				var tagName = element.tagName.toLowerCase();
				if (tagName === "input" || tagName === "textarea" || tagName === "select") 
				{
					var type = element.type; 
					if(type && (type === 'checkbox' || type === 'radio')) 
					{ 
						attr = 'checked'; 
					}
					else 
					{ 
						attr = 'value';
					}
				} 
			}
			return attr; 
		}, 
		
		setupFilter: function(filter)
		{
			var pattern = /(\[\[[^\]]+\]\])/;
			return function(value)
			{
				return filter.replace(pattern, value);
			}; 
		}, 
		
		/* this will set a value on an elememnt.  
		@param (mixed) value */ 
		set: function(value) 
		{ 
			var element = this.element; 
			if(element && typeof element === 'object') 
			{ 
				/* this will check to apply the option filter before 
				settings the value */ 
				if(this.filter)
				{
					value = this.filter(value); 
				} 
				
				var attr = this.attr, 
				type = element.type; 
				if(type && (type === 'checkbox' || type === 'radio')) 
				{ 
					value = (value == 1); 
				}
				
				if(attr.substring(0, 5) === 'data-')
				{
					base.data(element, attr, value); 
				}
				else 
				{
					element[attr] = value; 
				}
			} 
		}, 

		/* this will get a value on an elememnt.  
		@return (mixed) the element value */ 
		get: function() 
		{ 
			var value = '', 
			element = this.element;
			if(element && typeof element === 'object') 
			{ 
				var attr = this.attr; 
				if(attr.substring(0, 5) === 'data-')
				{
					value = base.data(element, attr); 
				}
				else 
				{
					value = element[attr];  
				}
			} 
			return value;
		}, 
		
		callBack: function(evt, prop, value, committer) 
		{
			if(committer !== this.element)
			{
				this.set(value);
			}
		}
	});
	
	var Connection = base.Class.extend(
	{
		constructor: function()
		{
			this.element = null; 
			this.data = null; 
		}, 
		
		addElement: function(element, attr, filter)
		{
			return (this.element = new ElementSource(element, attr, filter)); 
		}, 
		
		addData: function(data, prop)
		{
			return (this.data = new DataSource(data, prop));  
		}, 
		
		unsubscribeSource: function(source)
		{
			if(source)
			{
				source.unsubscribe(); 
			}
		}, 
		
		unsubscribe: function()
		{
			this.unsubscribeSource(this.element); 
			this.unsubscribeSource(this.data); 
			
			this.element = null; 
			this.data = null;
		}
	}); 
	
	var ConnectionTracker = base.Class.extend(
	{ 
		constructor: function() 
		{  
			this.connections = {};  
		}, 
		
		add: function(id, connection)
		{
			var connections = this.connections; 
			return (connections[id] = connection);  
		}, 
		
		get: function(id)
		{
			return (this.connections[id] || false); 
		}, 
		
		remove: function(id)
		{
			var connection = this.connections[id]; 
			if(connection)
			{
				connection.unsubscribe(); 
				delete this.connections[id]; 
			}
		}
	}); 
	
	var WatcherTracker = base.Class.extend(
	{ 
		constructor: function() 
		{  
			this.watchers = {};  
		}, 
		
		find: function(id)
		{
			var watchers = this.watchers; 
			return (watchers[id] || (watchers[id] = []));
		}, 
		
		add: function(id, data, prop, callBack)
		{
			var subscriptions = this.find(id); 
			subscriptions.push({
				data: data, 
				msg: prop, 
				token: this.getSubscription(data, prop, callBack)
			}); 
		}, 
		
		getSubscription: function(data, prop, callBack)
		{
			return data.on(prop, callBack); 
		}, 
		
		get: function(id)
		{
			return (this.watchers[id] || false); 
		}, 
		
		remove: function(id)
		{
			var subscriptions = this.watchers[id]; 
			if(subscriptions)
			{
				for(var i = 0, length = subscriptions.length; i < length; i++)
				{
					var subscription = subscriptions[i]; 
					if(subscription)
					{
						subscription.data.off(subscription.msg, subscription.token); 
					}
				}
				delete this.watchers[id]; 
			}
		}
	});

	/*
		DataBinder

		this create a data bind module to add 
		two way data binding to base models. 
	*/
	var DataBinder = base.Class.extend(
	{ 
		constructor: function() 
		{ 
			this.version = "1.0.1";
			this.attr = 'data-bind'; 

			this.connections = new ConnectionTracker(); 
			this.watchers = new WatcherTracker(); 

			this.idCount = 0; 
			this.setup(); 
		}, 

		setup: function() 
		{ 
			this.setupEvents();
		}, 

		/* this will add the data bind attr on an 
		element for a model property. 
		@param (object) element 
		@param (object) data 
		@param (string) prop
		@return (object) the instance of the data binder */
		bind: function(element, data, prop, filter) 
		{ 
			var bindSettings = this.getPropSettings(prop); 
			prop = bindSettings.prop; 
			
			/* this will setup the model bind attr to the 
			element and assign a bind id attr to support 
			two way binding */ 
			var connection = this.setupConnection(element, data, prop, bindSettings.attr, filter);   

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
		
		setupConnection: function(element, data, prop, customAttr, filter)
		{
			var connection = new Connection();
			
			var id = this.getBindId(element);
			var dataSource = connection.addData(data, prop); 
			dataSource.subscribe(id); 
			
			/* this will add the data binding 
			attr to out element so it will subscribe to 
			the two data changes */
			var dataId = data.getDataId(), 
			msg = dataId + ':' + prop; 
			
			var elementSource = connection.addElement(element, customAttr, filter); 
			elementSource.subscribe(msg); 
			
			this.addConnection(id, connection);
			
			return connection;  
		}, 
		
		addConnection: function(id, connection)
		{
			this.connections.add(id, connection);
		}, 
		
		setBindId: function(element)
		{
			var id = 'bs-db-' + this.idCount++; 
			base.attr(element, this.attr + '-id', id);
			return id; 
		}, 
		
		getBindId: function(element)
		{
			var id = base.attr(element, this.attr + '-id'); 
			if(!id) 
			{
				id = this.setBindId(element); 
			}
			return id; 
		}, 
		
		getPropSettings: function(prop)
		{
			var bindProp = prop, 
			bindAttr = null; 
			
			/* this will setup the custom attr if the prop 
			has specified one. */ 
			var parts = prop.split(':'); 
			if(parts.length > 1)
			{
				bindProp = parts[1]; 
				bindAttr = parts[0]; 
			}
			
			return {
				prop: bindProp, 
				attr: bindAttr
			}; 
		}, 
		
		/* this will remove an element from the data binder
		@param (object) element
		@return (object) the instance of the data binder*/ 
		unbind: function(element) 
		{ 
			var id = base.data(element, this.attr + '-id'); 
			if(id)
			{
				this.connections.remove(id);
				this.watchers.remove(id); 
			} 
			return this;
		}, 
		
		watch: function(element, data, prop, callBack)
		{
			if(!element || typeof element !== 'object')
			{
				return false; 
			}
			
			var id = this.getBindId(element); 
			this.watchers.add(id, data, prop, callBack); 
		}, 
		
		unwatch: function(element)
		{
			if(!element || typeof element !== 'object')
			{
				return false; 
			} 
			
			var id = base.attr(element, this.attr + '-id'); 
			if(id)
			{
				this.watchers.remove(element);
			} 
		}, 

		/* this will publish a change to the data binder. 
		@param (string) message e.g id:change 
		@param (string) attrName = the model prop name 
		@param (mixed) the prop value 
		@param (object) the object committing the change */ 
		publish: function(msg, attr, value, committer)
		{ 
			pubSub.publish(msg, attr, value, committer);
			return this;
		}, 
		
		isDataBound: function(element) 
		{ 
			if(element)
			{ 
				var dataAttr = this.attr; 
				var id = base.data(element, dataAttr + '-id'); 
				if(id)
				{
					return id; 
				}
			}
			return false; 
		}, 
		
		blockedKeys: [
			17, //ctrl 
			9, //tab 
			16, //shift
			18, //alt 
			20, //caps lock 
			37, //arrows 
			38, 
			39, 
			40 
		], 
		
		bindHandler: function(evt) 
		{
			if(evt.type === 'keyup')
			{ 
				/* this will check to block ctrl, shift or alt + 
				buttons */ 
				if(evt.ctrlKey !== false || evt.shiftKey !== false || evt.altKey !== false || base.inArray(this.blockedKeys, evt.keyCode) !== -1)
				{ 
					return true; 
				}
			} 

			var target = evt.target || evt.srcElement; 
			var id = this.isDataBound(target); 
			if(id)
			{ 
				var connection = this.connections.get(id); 
				if(connection)
				{
					var value = connection.element.get(); 
					/* this will publish to the ui and to the
					model that subscribes to the element */ 
					pubSub.publish(id, connection.data.prop, value, target);
				} 
			}
			evt.stopPropagation();
		}, 

		/* this will setup the on change handler and 
		add the events. this needs to be setup before adding 
		the events. */ 
		changeHandler: null, 
		setupEvents: function() 
		{  
			this.changeHandler = base.bind(this, this.bindHandler); 

			this.addEvents();  
		}, 

		/* this will add the binder events */ 
		addEvents: function() 
		{ 
			base.on(["change", "keyup"], document, this.changeHandler, false); 
		}, 

		/* this will remove the binder events */
		removeEvents: function() 
		{ 
			base.off(["change", "keyup"], document, this.changeHandler, false);
		}
	}); 
	
	base.extend.DataBinder = new DataBinder(); 
})();