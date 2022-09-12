/* base framework module */
(function(global)
{
	"use strict";

	/**
	 * EventHelper
	 *
	 * This will create an event object to make
	 * adding and removing events easier.
	 * @class
	 */
	var EventHelper = base.Class.extend(
	{
		/**
		 * @constructor
		 */
		constructor: function()
		{
			this.events = [];
		},

		/**
		 * This will add an array of events.
		 *
		 * @param {array} events
		 */
		addEvents: function(events)
		{
			if(events.length < 1)
			{
				return false;
			}

			for(var i = 0, length = events.length; i < length; i++)
			{
				var event = events[i];
				this.on(event[0], event[1], event[2], event[3]);
			}
		},

		/**
		 * This will add an event.
		 *
		 * @param {string} event
		 * @param {object} obj
		 * @param {function} callBack
		 * @param {boolean} capture
		 */
		on: function(event, obj, callBack, capture)
		{
			base.on(event, obj, callBack, capture);

			this.events.push({
				event: event,
				obj: obj,
				callBack: callBack,
				capture: capture
			});
		},

		/**
		 * This will remove an event.
		 *
		 * @param {string} event
		 * @param {object} obj
		 * @param {function} callBack
		 * @param {boolean} capture
		 */
		off: function(event, obj, callBack, capture)
		{
			base.off(event, obj, callBack, capture);

			var option,
			events = this.events;
			for(var i = 0, length = events.length; i < length; i++)
			{
				option = events[i];
				if(option.event === event && option.obj === obj)
				{
					events.splice(i, 1);
					break;
				}
			}
		},

		/**
		 * This will set all events.
		 */
		set: function()
		{
			var event,
			events = this.events;
			for(var i = 0, length = events.length; i < length; i++)
			{
				event = events[i];
				base.on(event.event, event.obj, event.callBack, event.capture);
			}
		},

		unset: function()
		{
			var event,
			events = this.events;
			for(var i = 0, length = events.length; i < length; i++)
			{
				event = events[i];
				base.off(event.event, event.obj, event.callBack, event.capture);
			}
		},

		/**
		 * This will reset the events.
		 */
		reset: function()
		{
			this.unset();
			this.events = [];
		}
	});

	base.extend.EventHelper = EventHelper;

	/* this will register the component system to the
	data tracker to remove components that have been
	nested in layouts. */
	base.DataTracker.addType('components', function(data)
	{
		if(!data)
		{
			return false;
		}

		var component = data.component;
		if(component && component.rendered === true)
		{
			component.prepareDestroy();
		}
	});

	/**
	 * StateHelper
	 *
	 * This is a helper to manage component states.
	 */
	var StateHelper = base.Class.extend(
	{
		/**
		 * @constructor
		 * @param {object} state
		 * @param {object} states
		 */
		constructor: function(state, states)
		{
			this.remoteStates = [];

			var actions = this.convertStates(states);
			this.addStatesToTarget(state, actions);
		},

		/**
		 * This will add states to a state.
		 *
		 * @param {object} state
		 * @param {object} states
		 */
		addStates: function(state, states)
		{
			var actions = this.convertStates(states);
			this.addStatesToTarget(state, actions);
		},

		/**
		 * This will create a state object.
		 *
		 * @param {string} action
		 * @param {*} state
		 * @param {function} callBack
		 * @param {string} [targetId]
		 * @return {object}
		 */
		createState: function(action, state, callBack, targetId)
		{
			return {
				action: action,
				state: state,
				callBack: callBack,
				targetId: targetId,
				token: null
			};
		},

		/**
		 * This will convert an action object to a state array.
		 *
		 * @protected
		 * @param {object} action
		 * @return {array}
		 */
		convertStates: function(action)
		{
			var actions = [];
			for(var prop in action)
			{
				if(action.hasOwnProperty(prop) === false)
				{
					continue;
				}
				else if(prop === 'remotes')
				{
					this.setupRemoteStates(action[prop], actions);
					continue;
				}

				var targetId = null,
				callBack = null,
				state = action[prop];
				if(state && typeof state === 'object')
				{
					callBack = state.callBack;
					targetId = state.id || state.targetId;
					state = state.state;
				}

				actions.push(this.createState(
					prop,
					state,
					callBack,
					targetId
				));
			}
			return actions;
		},

		setupRemoteStates: function(remotes, actions)
		{
			var remote;
			for(var i = 0, length = remotes.length; i < length; i++)
			{
				remote = remotes[i];
				if(!remote)
				{
					continue;
				}

				for(var prop in remote)
				{
					if(remote.hasOwnProperty(prop) === false || prop === 'id')
					{
						continue;
					}

					var callBack = null,
					value = remote[prop],
					state = (value !== null)? value : undefined;
					if(state && typeof state === 'object')
					{
						callBack = state.callBack;
						state = state.state;
					}

					actions.push(this.createState(
						prop,
						state,
						callBack,
						remote.id
					));
				}
			}
		},

		/**
		 * This will remove remote states.
		 */
		removeRemoteStates: function()
		{
			var remoteStates = this.remoteStates;
			if(remoteStates)
			{
				this.removeActions(remoteStates);
			}
		},

		/**
		 * This will remove the actions.
		 *
		 * @param {array} actions
		 */
		removeActions: function(actions)
		{
			if(actions.length < 1)
			{
				return false;
			}

			var states = base.state;
			for(var i = 0, length = actions.length; i < length; i++)
			{
				var action = actions[i];
				states.remove(action.targetId, action.action, action.token);
			}
		},

		/**
		 * This will restore a state.
		 *
		 * @param {object} state
		 */
		restore: function(state)
		{
			state.restore();

			var remotes = this.remoteStates;
			if(!remotes)
			{
				return;
			}

			for(var i = 0, length = remotes.length; i < length; i++)
			{
				var action = remotes[i];
				action.token = this.bindRemoteState(state, action.action, action.targetId);
			}
		},

		/**
		 * This will setup a two way bind to a remote state.
		 *
		 * @param {object} target
		 * @param {string} actionEvent
		 * @param {string} remoteTargetId
		 * @return {string}
		 */
		bindRemoteState: function(target, actionEvent, remoteTargetId)
		{
			var remoteTarget = base.state.getTarget(remoteTargetId);

			return target.link(remoteTarget, actionEvent);
		},

		/**
		 * This will add the states to the target.
		 *
		 * @protected
		 * @param {object} state
		 * @param {array} actions
		 */
		addStatesToTarget: function(state, actions)
		{
			var remotes = this.remoteStates;

			for(var i = 0, length = actions.length; i < length; i++)
			{
				var action = actions[i],
				token = this.addAction(state, action);

				if(action.targetId)
				{
					action.token = token;
					remotes.push(action);
				}
			}

			if(remotes.length < 1)
			{
				this.remoteStates = null;
			}
		},

		/**
		 * This will add an action.
		 *
		 * @param {object} target
		 * @param {object} action
		 */
		addAction: function(target, action)
		{
			var token,
			actionEvent = action.action;

			/* this will check to select the remote target if set */
			var targetId = action.targetId;
			if(targetId)
			{
				token = this.bindRemoteState(target, actionEvent, targetId);
			}

			if(typeof action.state !== 'undefined')
			{
				target.addAction(actionEvent, action.state);
			}

			var callBack = action.callBack;
			if(typeof callBack === 'function')
			{
				target.on(actionEvent, callBack);
			}

			return token;
		}
	});

	var builder = base.builder;

	/**
	 * Unit
	 *
	 * @class
	 *
	 * This will allow units to be extended
	 * from a single factory.
	 *
	 * @example
	 * var Alert = base.Unit.extend(
	 *	{
	 *		constructor: function(props)
	 *		{
	 *			// this will setup the component id
	 *			base.Component.call(this, props);
	 *		},
 	 *
	 *		render: function()
	 *		{
	 *			return {
 	 *
	 *			};
	 *		}
	 *	});
	 */
	var Unit = base.Class.extend(
	{
		/**
		 * @constructor
		 * @param {object} [props]
		 */
		constructor: function(props)
		{
			this.init();
			this.setupProps(props);
			this.onCreated();

			this.rendered = false;
			this.container = null;
		},

		/**
		 * @param {bool} isUnit
		 */
		isUnit: true,

		/**
		 * This will setup the unit number and unique
		 * instance id for the unit elements.
		 * @protected
		 */
		init: function()
		{
			var constructor = this.constructor;
			this.number = (typeof constructor.number === 'undefined')? constructor.number = 0 : (++constructor.number);

			var name = this.overrideTypeId || this._typeId;
			this.id = name + this.number;
		},

		/**
		 * This will setup the unit props.
		 *
		 * @param {object} [props]
		 */
		setupProps: function(props)
		{
			if(!props || typeof props !== 'object')
			{
				return false;
			}

			for(var prop in props)
			{
				if(props.hasOwnProperty(prop))
				{
					this[prop] = props[prop];
				}
			}
		},

		/**
		 * This will get the parent context.
		 *
		 * @returns {object|null}
		 */
		getParentContext: function()
		{
			if(!this.parent)
			{
				return null;
			}

			return this.parent.getContext();
		},

		/**
		 * This will set up the context.
		 *
		 * @returns {void}
		 */
		setupContext: function()
		{
			var parentContext = this.getParentContext();
			var context = this.setContext(parentContext);
			if(context)
			{
				this.context = context;
				return;
			}

			this.context = parentContext;
			this.setupAddingContext();
		},

		/**
		 * This will set up the adding context.
		 *
		 * @returns {void}
		 */
		setupAddingContext: function()
		{
			var parentContext = this.context;
			var context = this.addContext(parentContext);
			if(!context)
			{
				return;
			}

			var branchName = context[0];
			if(!branchName)
			{
				return;
			}

			this.addingContext = true;
			this.contextBranchName = branchName;
			this.addContextBranch(branchName, context[1]);
		},

		/**
		 * This will add a branch to the context.
		 *
		 * @param {string} branchName
		 * @param {mixed} value
		 */
		addContextBranch: function(branchName, value)
		{
			this.context = this.context || {};
			this.context[branchName] = value;
		},

		/**
		 * This will set the component context.
		 *
		 * @param {object|null} context
		 * @returns {object|null}
		 */
		setContext: function(context)
		{
			return null;
		},

		/**
		 * This will add context to the parent context.
		 *
		 * @param {object|null} context
		 * @return {array|null}
		 */
		addContext: function(context)
		{
			return null;
		},

		/**
		 * This will remove the added context from the parent.
		 *
		 * @returns {void}
		 */
		removeContext: function()
		{
			if(!this.addingContext)
			{
				return;
			}

			this.removeContextBranch(this.contextBranchName);
		},

		/**
		 * This will remove a context branch.
		 *
		 * @param {string} branch
		 * @returns {void}
		 */
		removeContextBranch: function(branch)
		{
			if(!branch)
			{
				return;
			}

			delete this.context[branch];
		},

		/**
		 * This will get the context.
		 *
		 * @returns {object|null}
		 */
		getContext: function()
		{
			return this.context;
		},

		/**
		 * override this to do something when created.
		 */
		onCreated: function()
		{

		},

		/**
		 * This will render the unit.
		 *
		 * @return {object}
		 */
		render: function()
		{
			return {

			};
		},

		/**
		 * This will cache the layout panel and set the main id.
		 * @param {object} layout
		 * @return {object}
		 */
		_cacheRoot: function(layout)
		{
			if(!layout)
			{
				return layout;
			}

			if(!layout.id)
			{
				layout.id = this.getId();
			}

			layout.cache = 'panel';
			return layout;
		},

		/**
		 * This will create the unit layout.
		 * @protected
		 * @return {object}
		 */
		_createLayout: function()
		{
			if(this.persist)
			{
				return this._layout || (this._layout = this.render());
			}

			return this.render();
		},

		/**
		 * This will prepare the layout.
		 *
		 * @protected
		 * @return {object}
		 */
		prepareLayout: function()
		{
			var layout = this._createLayout();
			return this._cacheRoot(layout);
		},

		/**
		 * This will build the layout.
		 * @protected
		 */
		buildLayout: function()
		{
			var layout = this.prepareLayout();
			this.build(layout, this.container);

			base.DataTracker.add(this.panel, 'components',
			{
				component: this
			});

			this.rendered = true;
		},

		/**
		 * This will build a layout.
		 *
		 * @param {object} layout
		 * @param {object} container
		 * @return {object}
		 */
		build: function(layout, container)
		{
			return builder.build(layout, container, this);
		},

		/**
		 * This will prepend layout to a container.
		 *
		 * @param {object} layout
		 * @param {object} container
		 * @param {object} [optionalNode]
		 */
		prepend: function(layout, container, optionalNode)
		{
			var frag = this.build(layout, null);
			builder.prepend(container, frag, optionalNode);
		},

		/**
		 * This will rebuild a layout.
		 *
		 * @param {object} layout
		 * @param {object} container
		 * @return {object}
		 */
		rebuild: function(layout, container)
		{
			return builder.rebuild(container, layout, this);
		},

		/**
		 * This will render the content on condition of a property.
		 *
		 * @param {mixed} prop
		 * @param {mixed} content
		 * @returns {object}
		 */
		if: function(prop, content)
		{
			return (!prop)? null : (content || prop);
		},

		/**
		 * This will map an array to children elements.
		 *
		 * @param {array} items
		 * @param {function} callBack
		 * @returns {array}
		 */
		map: function(items, callBack)
		{
			var children = [];
			if(!items || items.length < 1)
			{
				return children;
			}

			for(var i = 0, length = items.length; i < length; i++)
			{
				var item = callBack(items[i], i);
				children.push(item);
			}
			return children;
		},

		/**
		 * This will remove children from an element.
		 *
		 * @param {object} layout
		 * @param {object} container
		 * @return {object}
		 */
		removeAll: function(ele)
		{
			return builder.removeAll(ele);
		},

		/**
		 * This will cache an element when its created by
		 * saving a reference to it as a property on the
		 * unit.
		 *
		 * @param {string} propName The name to use as
		 * the reference.
		 * @param {object} layout
		 * @param {function} [callBack]
		 * @return {object}
		 */
		cache: function(propName, layout, callBack)
		{
			if(!layout || typeof layout !== 'object')
			{
				return false;
			}

			if(layout.isUnit === true)
			{
				layout =
				{
					component: layout
				};
			}

			var self = this;
			layout.onCreated = function(element)
			{
				self[propName] = element;

				if(typeof callBack === 'function')
				{
					callBack(element);
				}
			};
			return layout;
		},

		/**
		 * This will get an id of the unit or the full
		 * id that has the unit id prepended to the
		 * requested id.
		 *
		 * @param {string} [id]
		 * @return {string}
		 */
		getId: function(id)
		{
			var mainId = this.id;
			if(typeof id === 'string')
			{
				mainId += '-' + id;
			}
			return mainId;
		},

		/**
		 * This will initialize the unit.
		 * @protected
		 */
		initialize: function()
		{
			this.setupContext();
			this.beforeSetup();
			this.buildLayout();
			this.afterSetup();
		},

		/**
		 * override this to do something before setup.
		 */
		beforeSetup: function()
		{

		},

		/**
		 * override this to do something after setup.
		 */
		afterSetup: function()
		{

		},

		/**
		 * This will setup and render the unit.
		 * @param {object} container
		 */
		setup: function(container)
		{
			this.container = container;
			this.initialize();
		},

		/**
		 * This will remove the unit.
		 * @protected
		 */
		remove: function()
		{
			this.prepareDestroy();
			this.removeContext();

			var panel = this.panel || this.id;
			builder.removeElement(panel);
		},

		/**
		 * This will prepare the unit to be destroyed.
		 */
		prepareDestroy: function()
		{
			this.rendered = false;
			this.beforeDestroy();
		},

		/**
		 * Override this to do something before destroy.
		 */
		beforeDestroy: function()
		{

		},

		/**
		 * This will destroy the unit.
		 */
		destroy: function()
		{
			this.remove();
		},

		/**
		 * This will bind and element to data.
		 *
		 * @param {object} element
		 * @param {object} data
		 * @param {string} prop
		 * @param {function} filter
		 */
		bindElement: function(element, data, prop, filter)
		{
			if(element)
			{
				base.DataBinder.bind(element, data, prop, filter);
			}
		}
	});

	var typeNumber = 0;

	/**
	 * This will extend the parent unit to a child
	 * unit.
	 *
	 * @static
	 * @param {object} child
	 * @return {function}
	 */
	Unit.extend = function(child)
	{
		if(!child)
		{
			return false;
		}

		var parent = this.prototype;

		/* the child constructor must be set to set
		the parent static methods on the child */
		var constructor = child && child.constructor? child.constructor : false;
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

		/* this will assign a unique id to the type of
		unit */
		constructor.prototype._typeId = 'cp-' + (typeNumber++) + '-';

		/* this will add the static methods from the parent to
		the child constructor. could use assign but ie doesn't
		support it */
		//Object.assign(constructor, this);
		base.extendObject(this, constructor);
		return constructor;
	};

	/**
	 * Component
	 *
	 * @class
	 *
	 * This will allow components to be extended
	 * from a single factory.
	 *
	 * @example
	 * var QuickFlashPanel = base.Component.extend(
	 *	{
	 *		constructor: function(props)
	 *		{
	 *			// this will setup the component id
	 *			base.Component.call(this, props);
	 *		},
 	 *
	 *		render: function()
	 *		{
	 *			return {
 	 *
	 *			};
	 *		}
	 *	});
	 */
	var Component = Unit.extend(
	{
		/**
		 * @param {bool} isComponent
		 */
		isComponent: true,

		/**
		 * This will initialize the component.
		 * @protected
		 */
		initialize: function()
		{
			this.setupContext();
			this.beforeSetup();
			this.addStates();
			this.buildLayout();
			this.addEvents();
			this.afterSetup();
		},

		/* this will allow the component to override the
		state target id to add a custom id */
		/**
		 * @member {string} [stateTargetId] // optional override of state id
		 */
		stateTargetId: null,

		/**
		 * This will setup the state target.
		 *
		 * @protected
		 * @param {string} [id]
		 */
		setupStateTarget: function(id)
		{
			var targetId = id || this.stateTargetId || this.id;
			this.state = base.state.getTarget(targetId);
		},

		/**
		 * Override this to setup the component states.
		 * @return {object}
		 */
		setupStates: function()
		{
			/*
			return {
				action: 'state'
			};

			or

			return {
				action:
				{
					state: 'state',
					callBack: function(state, prevState)
					{

					}
				}
			};*/

			return {

			};
		},

		/**
		 * This will add the states.
		 * @protected
		 */
		addStates: function()
		{
			/* this will check to restore previous a previous state if the
			component has been preserved. */
			var state = this.state;
			if(state)
			{
				this.stateHelper.restore(state);
				return;
			}

			/* this will only setupa state manager if
			we have states */
			var states = this.setupStates();
			if(base.isEmpty(states))
			{
				return;
			}

			this.setupStateTarget();
			this.stateHelper = new StateHelper(this.state, states);
		},

		/**
		 * This will remove the states.
		 * @protected
		 */
		removeStates: function()
		{
			var state = this.state;
			if(!state)
			{
				return false;
			}

			this.stateHelper.removeRemoteStates();
			state.remove();
		},

		/**
		 * This will setup the event helper.
		 *
		 * @protected
		 */
		setupEventHelper: function()
		{
			if(!this.events)
			{
				this.events = new EventHelper();
			}
		},

		/**
		 * This will setup the events.
		 *
		 * @protected
		 * @return {array}
		 */
		setupEvents: function()
		{
			return [
				//['action', element, function(e){}, false]
			];
		},

		/**
		 * This will add the events.
		 *
		 * @protected
		 */
		addEvents: function()
		{
			var events = this.setupEvents();
			if(events.length < 1)
			{
				return false;
			}

			this.setupEventHelper();
			this.events.addEvents(events);
		},

		/**
		 * This will remove the events.
		 * @protected
		 */
		removeEvents: function()
		{
			var events = this.events;
			if(events)
			{
				events.reset();
			}
		},

		/**
		 * This will prepare the component to be destroyed.
		 */
		prepareDestroy: function()
		{
			this.rendered = false;
			this.beforeDestroy();
			this.removeEvents();
			this.removeStates();
			this.removeContext();

			if(this.data && this.persist === false)
			{
				this.data.unlink();
			}
		}
	});

	/**
	 * This will store the jot shorthand method alaises.
	 */
	var JOT_SHORTHAND_METHODS =
	{
		created: 'onCreated',
		state: 'setupStates',
		events: 'setupEevents',
		before: 'beforeSetup',
		render: 'render',
		after: 'afterSetup',
		destroy: 'beforeDestroy'
	};

	/**
	 * This will get the jot method by value. If the method is an
	 * object, it will be nested in a function.
	 *
	 * @param {object|function} value
	 * @returns {function}
	 */
	var getJotShorthandMethod = function(value)
	{
		var valueType = (typeof value);
		return (valueType === 'function')? value : function()
		{
			return value;
		};
	};

	/**
	 * This will create a jot component object that will be used
	 * to create the jot component.
	 *
	 * @param {object} settings
	 * @returns {object}
	 */
	var JotComponent = function(settings)
	{
		var component = {};
		if(!settings)
		{
			return component;
		}

		for(var prop in settings)
		{
			if(settings.hasOwnProperty(prop) === false)
			{
				continue;
			}

			var value = settings[prop];
			var alias = JOT_SHORTHAND_METHODS[prop];
			if(alias)
			{
				component[alias] = getJotShorthandMethod(value);
				continue;
			}

			component[prop] = value;
		}

		return component;
	};

	/**
	 * This will create a shorthand component.
	 *
	 * @param {object|function} layout
	 * @returns {function}
	 */
	global.Jot = function(layout)
	{
		if(!layout)
		{
			return null;
		}

		switch(typeof layout)
		{
			case 'object':
				var settings;
				if(layout.render)
				{
					settings = JotComponent(layout);
					return base.Component.extend(settings);
				}

				settings = {
					render: function()
					{
						return layout;
					}
				};

				// this will create a stateless and dataless unit
				return base.Unit.extend(settings);
			case 'function':
				settings = {
					render: layout
				};

				// this will create a stateless and dataless unit
				return base.Unit.extend(settings);
		}
	};

	/* this will add a reference to the component
	object */
	base.extend.Unit = Unit;
	base.extend.Component = Component;

})(this);