import {base} from '../../core.js';
import {builder} from '../layout/layout-builder.js';
import {state} from '../state/state.js';
import {dataBinder} from '../data-binder/data-binder.js';
import {EventHelper} from './event-helper.js';
import {StateHelper} from './state-helper.js';

/* this will register the component system to the
data tracker to remove components that have been
nested in layouts. */
base.dataTracker.addType('components', (data) =>
{
	if(!data)
	{
		return;
	}

	let component = data.component;
	if(component && component.rendered === true)
	{
		component.prepareDestroy();
	}
});

let componentNumber = 0;

/**
 * Component
 *
 * @class
 *
 * This will allow components to be extended
 * from a single factory.
 *
 * @example
 * class QuickFlashPanel extends base.Component
 *	{
 *		constructor(props)
 *		{
 *			// this will setup the component id
 *			super(props);
 *		},
 *
 *		render()
 *		{
 *			return {
 *
 *			};
 *		}
 *	}
 */
export class Component
{
	/**
	 * @constructor
	 * @param {object} [props]
	 */
	constructor(props)
	{
		/**
		 * @param {bool} isComponent
		 */
		this.isComponent = true;

		/* this will allow the component to override the
		state target id to add a custom id */
		/**
		 * @member {string} [stateTargetId] // optional override of state id
		 */
		this.stateTargetId = null;

		this.init();
		this.setupProps(props);
		this.onCreated();

		this.rendered = false;
		this.container = null;
	}

	/**
	 * This will setup the component number and unique
	 * instance id for the component elements.
	 * @protected
	 */
	init()
	{
		this.id = 'cp-' + (componentNumber++);
	}

	/**
	 * This will setup the component props.
	 *
	 * @param {object} [props]
	 */
	setupProps(props)
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
	}

	/**
	 * override this to do something when created.
	 */
	onCreated()
	{

	}

	/**
	 * This will render the component.
	 *
	 * @return {object}
	 */
	render()
	{
		return {

		};
	}

	/**
	 * This will cache the layout panel and set the main id.
	 * @param {object} layout
	 * @return {object}
	 */
	_cacheRoot(layout)
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
	}

	/**
	 * This will create the component layout.
	 * @protected
	 * @return {object}
	 */
	_createLayout()
	{
		if(this.persist)
		{
			return this._layout || (this._layout = this.render());
		}

		return this.render();
	}

	/**
	 * This will prepare the layout.
	 *
	 * @protected
	 * @return {object}
	 */
	prepareLayout()
	{
		let layout = this._createLayout();
		return this._cacheRoot(layout);
	}

	/**
	 * This will build the layout.
	 * @protected
	 */
	buildLayout()
	{
		let layout = this.prepareLayout();
		this.build(layout, this.container);

		base.dataTracker.add(this.panel, 'components',
		{
			component: this
		});

		this.rendered = true;
	}

	/**
	 * This will build a layout.
	 *
	 * @param {object} layout
	 * @param {object} container
	 * @return {object}
	 */
	build(layout, container)
	{
		return builder.build(layout, container, this);
	}

	/**
	 * This will prepend layout to a container.
	 *
	 * @param {object} layout
	 * @param {object} container
	 * @param {object} [optionalNode]
	 */
	prepend(layout, container, optionalNode)
	{
		var frag = this.build(layout, null);
		builder.prepend(container, frag, optionalNode);
	}

	/**
	 * This will rebuild a layout.
	 *
	 * @param {object} layout
	 * @param {object} container
	 * @return {object}
	 */
	rebuild(layout, container)
	{
		return builder.rebuild(container, layout, this);
	}

	/**
	 * This will render the content on condition of a property.
	 *
	 * @param {mixed} prop
	 * @param {mixed} content
	 * @returns {object}
	 */
	if(prop, content)
	{
		return (!prop)? null : (content || prop);
	}

	/**
	 * This will map an array to children elements.
	 *
	 * @param {array} items
	 * @param {function} callBack
	 * @returns {array}
	 */
	map(items, callBack)
	{
		let children = [];
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
	}

	/**
	 * This will remove children from an element.
	 *
	 * @param {object} layout
	 * @param {object} container
	 * @return {object}
	 */
	removeAll(ele)
	{
		return builder.removeAll(ele);
	}

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
	cache(propName, layout, callBack)
	{
		if(!layout || typeof layout !== 'object')
		{
			return false;
		}

		if(layout.isComponent === true)
		{
			layout =
			{
				component: layout
			};
		}

		layout.onCreated = (element) =>
		{
			this[propName] = element;

			if(typeof callBack === 'function')
			{
				callBack(element);
			}
		};
		return layout;
	}

	/**
	 * This will get an id of the component or the full
	 * id that has the component id prepended to the
	 * requested id.
	 *
	 * @param {string} [id]
	 * @return {string}
	 */
	getId(id)
	{
		let mainId = this.id;
		if(typeof id === 'string')
		{
			mainId += '-' + id;
		}
		return mainId;
	}

	/**
	 * This will initialize the component.
	 * @protected
	 */
	initialize()
	{
		this.beforeSetup();
		this.addStates();
		this.buildLayout();
		this.addEvents();
		this.afterSetup();
	}

	/**
	 * override this to do something before setup.
	 */
	beforeSetup()
	{

	}

	/**
	 * override this to do something after setup.
	 */
	afterSetup()
	{

	}

	/**
	 * This will setup and render the component.
	 * @param {object} container
	 */
	setup(container)
	{
		this.container = container;
		this.initialize();
	}

	/**
	 * This will setup the state target.
	 *
	 * @protected
	 * @param {string} [id]
	 */
	setupStateTarget(id)
	{
		let targetId = id || this.stateTargetId || this.id;
		this.state = state.getTarget(targetId);
	}

	/**
	 * Override this to setup the component states.
	 * @return {object}
	 */
	setupStates()
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
				callBack(state, prevState)
				{

				}
			}
		};*/

		return {

		};
	}

	/**
	 * This will add the states.
	 * @protected
	 */
	addStates()
	{
		/* this will check to restore previous a previous state if the
		component has been preserved. */
		let state = this.state;
		if(state)
		{
			this.stateHelper.restore(state);
			return;
		}

		/* this will only setupa state manager if
		we have states */
		let states = this.setupStates();
		if(base.isEmpty(states))
		{
			return;
		}

		this.setupStateTarget();
		this.stateHelper = new StateHelper(this.state, states);
	}

	/**
	 * This will remove the states.
	 * @protected
	 */
	removeStates()
	{
		let state = this.state;
		if(!state)
		{
			return false;
		}

		this.stateHelper.removeRemoteStates();
		state.remove();
	}

	/**
	 * This will setup the event helper.
	 *
	 * @protected
	 */
	setupEventHelper()
	{
		if(!this.events)
		{
			this.events = new EventHelper();
		}
	}

	/**
	 * This will setup the events.
	 *
	 * @protected
	 * @return {array}
	 */
	setupEvents()
	{
		return [
			//['action', element, function(e){}, false]
		];
	}

	/**
	 * This will add the events.
	 *
	 * @protected
	 */
	addEvents()
	{
		let events = this.setupEvents();
		if(events.length < 1)
		{
			return false;
		}

		this.setupEventHelper();
		this.events.addEvents(events);
	}

	/**
	 * This will remove the events.
	 * @protected
	 */
	removeEvents()
	{
		let events = this.events;
		if(events)
		{
			events.reset();
		}
	}

	/**
	 * This will remove the component.
	 * @protected
	 */
	remove()
	{
		this.prepareDestroy();

		let panel = this.panel || this.id;
		builder.removeElement(panel);
	}

	/**
	 * This will prepare the component to be destroyed.
	 */
	prepareDestroy()
	{
		this.rendered = false;
		this.beforeDestroy();
		this.removeEvents();
		this.removeStates();

		if(this.data && this.persist === false)
		{
			this.data.unlink();
		}
	}

	/**
	 * Override this to do something before destroy.
	 */
	beforeDestroy()
	{

	}

	/**
	 * This will destroy the component.
	 */
	destroy()
	{
		this.remove();
	}

	/**
	 * This will bind and element to data.
	 *
	 * @param {object} element
	 * @param {object} data
	 * @param {string} prop
	 * @param {function} filter
	 */
	bindElement(element, data, prop, filter)
	{
		if(element)
		{
			dataBinder.bind(element, data, prop, filter);
		}
	}
}