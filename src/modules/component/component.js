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
	 *
	 * @overload
	 * @param {object} props
	 * @param {Array<object>} [children=[]] - An array of children
	 *
	 * @overload
	 * @param {Array<object>} [children=[]] - An array of children
	 *
	 * @overload
	 * @param {string} [children] - A child string
	 *
	 * @overload
	 * @param {object} props
	 * @param {string} [children] - A child string
	 */
	constructor(...args)
	{
		super(...args);

		/**
		 * @param {boolean} isComponent
		 */
		this.isComponent = true;

		/**
		 * @param {boolean} stateResumed
		 */
		this.stateResumed = false;

		/* this will allow the component to override the
		state target id to add a custom id */
		/**
		 * @member {string} [stateTargetId] // optional override of state id
		 */
		this.stateTargetId = null;
		this._setupData();
	}

	/**
	 * This will set the data.
	 *
	 * @returns {object|null}
	 */
	setData()
	{
        return null;
    }

	/**
	 * This will setup the component data.
	 *
	 * @returns {void}
	 */
    _setupData()
	{
        if (this.data)
        {
            return;
        }

        const data = this.setData();
        if (data)
        {
            this.data = data;
        }
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
	 *
	 * @example
	 * return {
	 *
	 * 	// simple state
	 * 	action: 'state', // any primitive value
	 *
	 * 	// a more complex state
	 * 	complexAction: {
	 * 		state: 'state', // any primitive value
	 * 		callBack(state, prevState)
	 * 		{
	 * 			// do something
	 * 		}
	 * 	}
	 * };
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
			this.stateResumed = true;
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

		this.setStateHelper(states);
	}

	/**
	 * This will set the state helper.
	 *
	 * @param {object} [states]
	 * @returns {void}
	 */
	setStateHelper(states = {})
	{
		/**
		 * This will prevent the state helper from being
		 * reset.
		 */
		if (this.state)
		{
			return;
		}

		this.setupStateTarget();
		this.stateHelper = new StateHelper(this.state, states);
	}

	/**
	 * This will add a state.
	 *
	 * @param {object} state
	 * @returns {void}
	 */
	addState(state)
	{
		/**
		 * This will prevet new states from being added if the
		 * component has been resumed or the state helper is
		 * missing.
		 */
		if (!this.stateHelper || this.stateResumed == true)
		{
			return;
		}

		this.stateHelper.addStates(this.state, state);
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
		this.stateResumed = false;
	}

	/**
	 * This will set the event helper.
	 *
	 * @returns {void}
	 */
	setEventHelper()
	{
		/**
		 * This will prevent the event helper from being
		 * reset.
		 */
		if (this.events)
		{
			return;
		}

		this.events = new EventHelper();
	}

	/**
	 * This will setup the events.
	 *
	 * @protected
	 * @returns {array}
	 *
	 * @example
	 * return [
	 * 	// event, element, function, capture
	 * 	['click', this.element, function(e){}, false]
	 * ];
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

		this.setEventHelper();
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