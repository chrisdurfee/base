import { Objects } from '../../shared/objects.js';

/** @typedef {import('../data/data.js').Data} Data */

/**
 * DataResumeHelper
 *
 * Owns the data-merge logic used when a persisted component is
 * resumed (e.g. when the router re-activates a cached route).
 *
 * The component delegates here so its own surface stays focused
 * on lifecycle, leaving all of the
 *   - fresh-vs-persisted reconciliation,
 *   - retain/refresh-state policy,
 *   - silent stage writes, and
 *   - batched-publish queue draining
 * in one auditable place.
 *
 * @class
 */
export class DataResumeHelper
{
	/**
	 * This will resume the data for a component during persistence.
	 *
	 * @param {object} component - host component (mutated: component.data is set)
	 * @param {Data|null} persistedData
	 * @returns {void}
	 */
	static resume(component, persistedData)
	{
		if (component._externalData)
		{
			this._resumeExternal(component, persistedData);
			return;
		}

		this._resumeOwned(component, persistedData);
	}

	/**
	 * Refresh the host component's data with fresh prop-derived
	 * values from setData(), then refresh context data from parent.
	 *
	 * @param {object} component
	 * @returns {void}
	 */
	static refresh(component)
	{
		const freshData = component.setData();
		if (freshData && component.data)
		{
			component.data.set(freshData.stage);
		}

		this.refreshContext(component);
	}

	/**
	 * Push parent-context changes into the persisted context data.
	 * Only reference-changed keys are written, via the silent API,
	 * to avoid republishing the entire context tree on resume.
	 *
	 * @param {object} component
	 * @returns {void}
	 */
	static refreshContext(component)
	{
		/** @type {{data?: Data} | null | undefined} */
		const context = component.context;
		if (!context || !context.data)
		{
			return;
		}

		/** @type {{data?: Data} | null} */
		const parentContext = component.getParentContext();
		if (!parentContext || !parentContext.data)
		{
			return;
		}

		const parentStage = parentContext.data.stage;
		const currentStage = context.data.stage;
		/** @type {Object<string, *> | null} */
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
				updates = {};
			}
			updates[key] = val;
		}

		if (updates === null)
		{
			return;
		}

		if (typeof context.data._silentSet === 'function')
		{
			context.data._silentSet(updates);
		}
		else
		{
			context.data.set(updates);
		}
	}

	/**
	 * Resume path for temp components created by
	 * `{ data: localVar }` in layouts.
	 *
	 * The fresh data instance must win as the *reference*
	 * so closures in the parent atom still point at the
	 * same Data object, but the persisted *values* are the
	 * source of truth (the user's prior interactions —
	 * activeFilter, scroll position, etc.). Merging the
	 * persisted stage onto the fresh instance preserves
	 * both.
	 *
	 * Policy matches `_resumeOwned`:
	 *  - retainState: persisted wins for ALL keys (incl. null).
	 *  - refreshState: fresh wins; only persisted keys missing
	 *    from fresh are copied.
	 *  - default: persisted non-null values win on changed keys;
	 *    null/undefined persisted values are ignored so fresh
	 *    defaults stay and async refetches can repopulate.
	 *
	 * @protected
	 * @param {object} component
	 * @param {Data|null} persistedData
	 * @returns {void}
	 */
	static _resumeExternal(component, persistedData)
	{
		const freshData = component.setData();
		if (!freshData)
		{
			component.data = persistedData;
			return;
		}

		if (persistedData && persistedData.stage)
		{
			const retain = persistedData._retainState
				|| freshData._retainState;
			const refresh = !retain && (
				persistedData._refreshState
				|| freshData._refreshState
			);

			const updates = this._buildExternalUpdates(
				persistedData.stage,
				freshData.stage,
				retain,
				refresh
			);

			if (!Objects.isEmpty(updates))
			{
				freshData._silentSet(updates);
			}
		}

		/**
		 * Drain any batched publishes queued by the fresh data's
		 * constructor `set()` calls. The merged values above were
		 * written silently, so if we leave the constructor's stale
		 * defaults (e.g. activeFilter:'all') in the queue, they
		 * will flush AFTER watchers attach and clobber the merged
		 * state — leaving the UI stuck on defaults. See the
		 * matching note in `_resumeOwned`.
		 */
		if (typeof freshData.flushPending === 'function')
		{
			freshData.flushPending();
		}

		component.data = freshData;
	}

	/**
	 * Diff persisted stage against fresh stage for external data.
	 *
	 * - retain=true: persisted values win for every key.
	 * - refresh=true: only persisted keys missing from fresh are
	 *   copied (so async-added properties survive).
	 * - default: persisted non-null values win on changed keys;
	 *   null/undefined persisted values are ignored.
	 *
	 * Reference-equal values are skipped to avoid the deep
	 * Publisher.publish cascade on unchanged subtrees.
	 *
	 * @protected
	 * @param {object} old
	 * @param {object} freshStage
	 * @param {boolean} retain
	 * @param {boolean} refresh
	 * @returns {Object<string, *>}
	 */
	static _buildExternalUpdates(old, freshStage, retain, refresh)
	{
		const updates = {};
		for (const key in old)
		{
			if (!Object.prototype.hasOwnProperty.call(old, key))
			{
				continue;
			}

			if (refresh)
			{
				if (!Object.prototype.hasOwnProperty.call(freshStage, key))
				{
					updates[key] = old[key];
				}
				continue;
			}

			const val = old[key];

			if (!retain && val == null)
			{
				continue;
			}

			if (val === freshStage[key])
			{
				continue;
			}

			updates[key] = val;
		}
		return updates;
	}

	/**
	 * Resume path for regular components: fresh data from
	 * setData() (already in component.data via _setupData)
	 * is the base; persisted values are merged in silently
	 * unless retainState is flagged (then persisted wins
	 * outright) or refreshState is flagged (then only keys
	 * missing from fresh are copied).
	 *
	 * @protected
	 * @param {object} component
	 * @param {Data|null} persistedData
	 * @returns {void}
	 */
	static _resumeOwned(component, persistedData)
	{
		if (!component.data)
		{
			component.data = persistedData;
			return;
		}

		if (persistedData && persistedData._retainState)
		{
			component.data = persistedData;
			return;
		}

		if (persistedData && persistedData.stage)
		{
			const refresh = persistedData._refreshState
				|| component.data._refreshState;

			const updates = this._buildOwnedUpdates(
				persistedData.stage,
				component.data.stage,
				refresh
			);

			if (!Objects.isEmpty(updates))
			{
				component.data._silentSet(updates);
			}
		}

		/**
		 * Drain any batched publishes left over from the fresh
		 * data's constructor `set()` calls. These were queued in
		 * a microtask with the constructor's default values (e.g.
		 * { loading: true }); _silentSet above has overwritten
		 * the stage without publishing. If the stale events flush
		 * AFTER watchers attach, subscribers see the default and
		 * `lastValue` falls out of sync with `stage`, sticking
		 * the UI on the default (e.g. skeleton) until the next
		 * value-changing set(). No watchers are attached to this
		 * fresh data yet, so flushing here drops the stale events
		 * harmlessly.
		 */
		if (component.data && typeof component.data.flushPending === 'function')
		{
			component.data.flushPending();
		}
	}

	/**
	 * Diff persisted stage against the fresh owned-data stage.
	 *
	 * - refresh=true: fresh values are authoritative; only
	 *   persisted keys missing from fresh are copied.
	 * - refresh=false: persisted non-null values win on changed
	 *   keys; null/undefined are ignored so fresh defaults stay,
	 *   allowing the component to re-fetch on resume.
	 *
	 * @protected
	 * @param {object} old
	 * @param {object} currentStage
	 * @param {boolean} refresh
	 * @returns {Object<string, *>}
	 */
	static _buildOwnedUpdates(old, currentStage, refresh)
	{
		const updates = {};
		for (const key in old)
		{
			if (!Object.prototype.hasOwnProperty.call(old, key))
			{
				continue;
			}

			if (refresh)
			{
				if (!Object.prototype.hasOwnProperty.call(currentStage, key))
				{
					updates[key] = old[key];
				}
				continue;
			}

			const val = old[key];
			if (val == null)
			{
				continue;
			}

			if (val === currentStage[key])
			{
				continue;
			}

			updates[key] = val;
		}
		return updates;
	}
}
