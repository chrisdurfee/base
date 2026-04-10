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
 * @param {...any} args
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
	 * @param {any} [first]
	 * @param {*} [second]
	 * @param {*} [third]
	 */
	constructor(first, second, third)
	{
		super(first, second, third);

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
		 * @type {string|null} stateTargetId // optional override of state id
		 */
		this.stateTargetId = null;

		/**
		 * @type {boolean} _externalData - true when data is provided
		 * externally (e.g. temp components from { data: localVar }).
		 * Preserve the value if already set by setupProps() in super().
		 */
		this._externalData = this._externalData ?? false;

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
	 * @protected
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
	 *  This will resume the component scope when persisting.
	 *
	 * @param {{data: any, state: any, stateHelper: any, persistedChildren: any, id: string}} persistedLayout
	 * @returns {void}
	 */
	resumeScope(persistedLayout)
	{
		this._resumeData(persistedLayout.data);

		this.state = persistedLayout.state;
		this.stateHelper = persistedLayout.stateHelper;
		this.persistedChildren = persistedLayout.persistedChildren;

		// @ts-ignore
		if (persistedLayout.context)
		{
			// @ts-ignore
			this.context = persistedLayout.context;
		}

		this.id = persistedLayout.id;
		this._refreshContextData();
	}

	/**
	 * This will resume the data during persistence.
	 *
	 * For components with externally-provided data (temp components
	 * created by { data: localVar } in layouts), we use the fresh
	 * data instance from setData() so closure references stay valid.
	 *
	 * For regular components, the persisted data is the source of
	 * truth — it holds accumulated state (list items, filters, etc.)
	 * that should be preserved until the component fetches updates.
	 *
	 * @protected
	 * @param {object|null} persistedData
	 * @returns {void}
	 */
	_resumeData(persistedData)
	{
		/**
		 * Temp components created by { data: localVar } in layouts
		 * must use the fresh data instance so that closures in the
		 * parent atom still reference the correct Data object.
		 *
		 * Persisted keys that don't exist in the fresh data are
		 * copied over so that dynamically-added properties (e.g.
		 * hasForum set by an async fetch) survive across resumes.
		 */
		if (this._externalData)
		{
			const freshData = this.setData();
			if (freshData)
			{
				if (persistedData && persistedData.stage)
				{
					const fresh = freshData.stage;
					const old = persistedData.stage;
					for (const key in old)
					{
						if (Object.prototype.hasOwnProperty.call(old, key)
							&& !Object.prototype.hasOwnProperty.call(fresh, key))
						{
							fresh[key] = old[key];
						}
					}
				}

				this.data = freshData;
			}
			else
			{
				this.data = persistedData;
			}
			return;
		}

		/**
		 * Regular components: persisted data is the source of truth.
		 * Accumulated state (list items, loaded content, etc.) is
		 * preserved and displayed immediately on resume.
		 */
		this.data = persistedData;
	}

	/**
	 * This will refresh the persisted data with fresh
	 * prop-derived values from setData().
	 *
	 * @protected
	 * @returns {void}
	 */
	_refreshData()
	{
		const freshData = this.setData();
		if (freshData && this.data)
		{
			this.data.set(freshData.stage);
		}

		this._refreshContextData();
	}

	/**
	 * This will refresh the persisted context data with
	 * fresh values from the parent context.
	 *
	 * @protected
	 * @returns {void}
	 */
	_refreshContextData()
	{
		const context = this.context;
		if (!context || !context.data)
		{
			return;
		}

		const parentContext = this.getParentContext();
		if (!parentContext || !parentContext.data)
		{
			return;
		}

		context.data.set(parentContext.data.stage);
	}

	/**
	 * This will initialize the component.
	 *
	 * @protected
	 * @returns {void}
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
		this.state = StateTracker.getTarget(String(targetId));
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
		if (!states || Object.keys(states).length === 0)
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

		this.stateHelper.removeRemoteStates(state);
		state.remove();
		this.stateResumed = false;
	}

	/**
	 * Sets a callback to be called when the component's data is flushed.
	 *
	 * @param {function} callBack
	 * @return {void}
	 */
	onFlush(callBack)
	{
		// @ts-ignore
		const data = this.data ?? this?.context?.data ?? null;
		if (data)
		{
			data.onFlush(callBack);
		}
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
	 * @returns {Array<Array<any>>}
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
		if (this.events)
		{
			this.events.addEvents(events);
		}
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
		this.persistedCount = 0;
		this.rendered = false;
		this.beforeDestroy();
		this.removeEvents();
		this.removeStates();
		this.removeContext();

		/**
		 * Unlink data when not persisting to prevent memory leaks.
		 * Data watchers keep references to the component and DOM.
		 */
		if (this.data && this.persist !== true)
		{
			this.data.unlink();
		}
	}
}