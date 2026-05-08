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
			// @ts-ignore
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

			/**
			 * Mark context as restored from persistence so the
			 * subsequent setupContext() call doesn't invoke the
			 * user's setContext() hook again — doing so would
			 * create a new context.data instance, leaving every
			 * still-attached watcher subscribed to the now-orphan
			 * persisted Data while writes (e.g. xhr callbacks
			 * using parent.context.data) target the new instance.
			 */
			this._contextResumed = true;
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
			/**
			 * Prefer data passed in via props (already on this.data
			 * from setupProps); fall back to setData() for temp
			 * components that supply data through their setData fn.
			 */
			const freshData = this.data || this.setData();
			if (freshData)
			{
				// @ts-ignore
				if (persistedData && persistedData.stage)
				{
					// @ts-ignore
					const old = persistedData.stage;

					/**
					 * If retainState is set on either data source,
					 * persisted values win for ALL keys. Otherwise
					 * (including refreshState) only copy keys that
					 * don't exist in fresh.
					 */
					// @ts-ignore
					const retain = persistedData._retainState
					// @ts-ignore
						|| freshData._retainState;

					const updates = {};
					// @ts-ignore
					const freshStage = freshData.stage;
					for (const key in old)
					{
						if (!Object.prototype.hasOwnProperty.call(old, key))
						{
							continue;
						}

						if (!retain && Object.prototype.hasOwnProperty.call(freshStage, key))
						{
							continue;
						}

						const val = old[key];

						/**
						 * Reference-equality short-circuit: if the persisted
						 * value is identical to what is already in the fresh
						 * stage, skip it. Without this guard the deep publisher
						 * walks the entire subtree on every resume, which can
						 * dominate frame time for large nested data trees.
						 */
						if (val === freshStage[key])
						{
							continue;
						}

						updates[key] = val;
					}

					/**
					 * Use the silent stage-write API: at resume time no
					 * watchers are bound to this fresh data instance yet,
					 * so triggering the deep publish cascade through set()
					 * is wasted work. The new layout will read these values
					 * via data.get() when its bindings attach.
					 */
					if (!Objects.isEmpty(updates))
					{
						// @ts-ignore
						freshData._silentSet(updates);
					}
				}

				// @ts-ignore
				this.data = freshData;
			}
			else
			{
				// @ts-ignore
				this.data = persistedData;
			}
			return;
		}

		/**
		 * Regular components: fresh data from setData() (already in
		 * this.data via _setupData) provides a clean base reference.
		 *
		 * Non-null persisted values are merged via the reactive
		 * set() API so the batched publish queue receives the
		 * correct values. Direct stage mutation would leave stale
		 * constructor values in the queue; the microtask flush
		 * after render would then overwrite merged data with the
		 * original (e.g. skeleton) values, causing a flash.
		 *
		 * Null/undefined persisted values (e.g. cleared by
		 * beforeDestroy cleanup) are ignored, keeping the fresh
		 * defaults so the component can re-fetch on resume.
		 */
		if (!this.data)
		{
			// @ts-ignore
			this.data = persistedData;
			return;
		}

		/**
		 * If retainState is flagged, the persisted data is the
		 * authoritative source — use it directly and discard
		 * the fresh instance from setData().
		 */
		// @ts-ignore
		if (persistedData && persistedData._retainState)
		{
			// @ts-ignore
			this.data = persistedData;
			return;
		}

		// @ts-ignore
		if (persistedData && persistedData.stage)
		{
			// @ts-ignore
			const old = persistedData.stage;

			/**
			 * Default behavior: fresh data from setData() (which
			 * was called on the new instance with current props)
			 * is authoritative. Persisted keys that are NOT in
			 * the fresh stage are copied over so dynamically-added
			 * properties (e.g. async-fetched fields, accumulated
			 * lists added via push) survive resumes.
			 *
			 * Components that want the old persist-wins behavior
			 * (e.g. infinite-scroll lists where setData seeds an
			 * empty array each time) can opt in via retainState().
			 */
			const updates = {};
			const currentStage = this.data.stage;
			for (const key in old)
			{
				if (!Object.prototype.hasOwnProperty.call(old, key))
				{
					continue;
				}

				if (Object.prototype.hasOwnProperty.call(currentStage, key))
				{
					continue;
				}

				updates[key] = old[key];
			}

			if (!Objects.isEmpty(updates))
			{
				/**
				 * Silent direct write — see note in the _externalData
				 * branch above. Avoids the Publisher.publish cascade
				 * across nested subtrees during resume, which is the
				 * single largest cost of route re-activation for
				 * components with deep data trees.
				 */
				this.data._silentSet(updates);
			}
		}
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
			// @ts-ignore
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
		// @ts-ignore
		if (!context || !context.data)
		{
			return;
		}

		const parentContext = this.getParentContext();
		// @ts-ignore
		if (!parentContext || !parentContext.data)
		{
			return;
		}

		/**
		 * Diff against the current context stage and only push
		 * keys whose value reference actually changed. Without
		 * this guard every resume republishes the full parent
		 * context tree, which cascades through Publisher.publish
		 * across all nested keys.
		 */
		// @ts-ignore
		const parentStage = parentContext.data.stage;
		// @ts-ignore
		const currentStage = context.data.stage;
		let updates = null;
		for (const key in parentStage)
		{
			if (!Object.prototype.hasOwnProperty.call(parentStage, key))
			{
				continue;
			}

			const val = parentStage[key];
			if (val === currentStage[key])
			{
				continue;
			}

			if (updates === null)
			{
				// @ts-ignore
				updates = {};
			}
			// @ts-ignore
			updates[key] = val;
		}

		if (updates !== null)
		{
			/**
			 * Silent write: context refresh during resume happens
			 * before the new layout subscribes, so the deep publish
			 * cascade has no listeners and is pure overhead.
			 */
			// @ts-ignore
			if (typeof context.data._silentSet === 'function')
			{
				// @ts-ignore
				context.data._silentSet(updates);
			}
			else
			{
				// @ts-ignore
				context.data.set(updates);
			}
		}
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
		// @ts-ignore
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