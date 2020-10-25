/* base framework module */
(function()
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
			var token,
			remoteTarget = base.state.getTarget(remoteTargetId);

			var value = remoteTarget.get(actionEvent);
			if(typeof value !== 'undefined')
			{
				target.set(actionEvent, value);
			}

			token = remoteTarget.on(actionEvent, function(state, prevState, committer)
			{
				if(committer === target)
				{
					return false;
				}

				target.set(actionEvent, state, remoteTarget);
			});

			target.on(actionEvent, function(state, prevState, committer)
			{
				if(committer === remoteTarget)
				{
					return false;
				}

				remoteTarget.set(actionEvent, state, target);
			});

			return token;
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
	var Component = base.Class.extend(
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
		 * @param {bool} isComponent
		 */
		isComponent: true,

		/**
		 * This will setup the component number and unique
		 * instance id for the component elements.
		 * @protected
		 */
		init: function()
		{
			var constructor = this.constructor;
			this.number = (typeof constructor.number === 'undefined')? constructor.number = 0 : (++constructor.number);

			var name = this.overrideTypeId || this.componentTypeId;
			this.id = name + this.number;
		},

		/**
		 * This will setup the component props.
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
		 * override this to do something when created.
		 */
		onCreated: function()
		{

		},

		/**
		 * This will render the component.
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
		 * This will create the component layout.
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
		 * component.
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

			if(layout instanceof base.Component)
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
		 * This will get an id of the component or the full
		 * id that has the component id prepended to the
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
		 * This will initialize the component.
		 * @protected
		 */
		initialize: function()
		{
			this.beforeSetup();
			this.addStates();
			this.buildLayout();
			this.addEvents();
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
		 * This will setup and render the component.
		 * @param {object} container
		 */
		setup: function(container)
		{
			this.container = container;
			this.initialize();
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
		 * This will remove the component.
		 * @protected
		 */
		remove: function()
		{
			this.prepareDestroy();

			var panel = this.panel || this.id;
			builder.removeElement(panel);
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
		},

		/**
		 * Override this to do something before destroy.
		 */
		beforeDestroy: function()
		{

		},

		/**
		 * This will destroy the component.
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

	var componentTypeNumber = 0;

	/**
	 * This will extend the parent component to a child
	 * component.
	 *
	 * @static
	 * @param {object} child
	 * @return {function}
	 */
	Component.extend = function(child)
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
		component */
		constructor.prototype.componentTypeId = 'bs-cp-' + (componentTypeNumber++) + '-';

		/* this will add the static methods from the parent to
		the child constructor. could use assign but ie doesn't
		support it */
		//Object.assign(constructor, this);
		base.extendObject(this, constructor);
		return constructor;
	};

	/* this will add a reference to the component
	object */
	base.extend.Component = Component;

})();