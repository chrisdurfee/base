import { Objects } from '../../shared/objects.js';
import { StateTracker } from '../state/state-tracker.js';
import { EventHelper } from './event-helper.js';
import { StateHelper } from './state-helper.js';
import { Unit } from './unit.js';

/**
 * Component
 *
 * This will allow components to be extended
 * from a single factory.
 *
 * @class
 * @augments Unit
 *
 * @example
 * class QuickFlashPanel extends Component
 *	{
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
	 * This will create a component.
	 *
	 * @constructor
	 * @param {array} args
	 */
	constructor(...args)
	{
		super(...args);

		/**
		 * @param {boolean} isComponent
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
	 *
	 * @protected
	 * @returns {object}
	 */
	initialize()
	{
		this.setupContext();
		this.addStates();
		this.beforeSetup();
	}

	/**
	 * This will activate the post build actions.
	 *
	 * @protected
	 * @returns {void}
	 */
	afterLayout()
	{
		this.addEvents();
		this.afterSetup();
	}

	/**
	 * This will setup the state target.
	 *
	 * @protected
	 * @param {string} [id]
	 * @returns {void}
	 */
	setupStateTarget(id)
	{
		const targetId = id || this.stateTargetId || this.id;
		this.state = StateTracker.getTarget(targetId);
	}

	/**
	 * Override this to setup the component states.
	 *
	 * @protected
	 * @returns {object}
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
	 *
	 * @protected
	 * @returns {void}
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
	 *
	 * @protected
	 * @returns {void}
	 */
	removeStates()
	{
		const state = this.state;
		if (!state)
		{
			return;
		}

		this.stateHelper.removeRemoteStates();
		state.remove();
	}

	/**
	 * This will setup the event helper.
	 *
	 * @protected
	 * @returns {void}
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
	 * @returns {array}
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
	 * @returns {void}
	 */
	addEvents()
	{
		const events = this.setupEvents();
		if (events.length < 1)
		{
			return;
		}

		this.setupEventHelper();
		this.events.addEvents(events);
	}

	/**
	 * This will remove the events.
	 *
	 * @protected
	 * @returns {void}
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
	 *
	 * @protected
	 * @returns {void}
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