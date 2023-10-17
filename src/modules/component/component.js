import { base } from '../../main/core.js';
import { Unit } from './unit.js';
import { state } from '../state/state.js';
import { EventHelper } from './event-helper.js';
import { StateHelper } from './state-helper.js';
import { Objects } from '../../shared/objects.js';

export { Unit } from './unit.js';
export { Jot } from './jot.js';
export { Watch } from '../layout/layout-builder.js';

/**
 * Component
 *
 * @class
 * @augments Unit
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
export class Component extends Unit
{
	/**
	 * @constructor
	 * @param {object} [props]
	 */
	constructor(props)
	{
		super(props);

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
	}

	/**
	 * This will initialize the component.
	 * @protected
	 */
	initialize()
	{
		this.setupContext();
		this.addStates();
		this.beforeSetup();
		this.buildLayout();
		this.addEvents();
		this.afterSetup();
	}

	/**
	 * This will setup the state target.
	 *
	 * @protected
	 * @param {string} [id]
	 */
	setupStateTarget(id)
	{
		const targetId = id || this.stateTargetId || this.id;
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
		const state = this.state;
		if (state)
		{
			this.stateHelper.restore(state);
			return;
		}

		/* this will only setupa state manager if
		we have states */
		const states = this.setupStates();
		if (Objects.isEmpty(states))
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
		const state = this.state;
		if (!state)
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
		if (!this.events)
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
		const events = this.setupEvents();
		if (events.length < 1)
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
		const events = this.events;
		if (events)
		{
			events.reset();
		}
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
		this.removeContext();

		if (this.data && this.persist === false)
		{
			this.data.unlink();
		}
	}
}