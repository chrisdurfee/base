import { StateTarget } from './state-target.js';

 /**
 * StateTracker
 *
 * This will create a state tracker that can
 * add and remove targets, actions, and action
 * subscriber callBack functions.
 *
 * @class
 */
export class StateTracker
{
	/**
	 * @type {Map} targets
	 * @private
	 */
	static targets = new Map();

	/**
	 * The number of owners that have attached to each target.
	 *
	 * Targets are keyed by the owning component's unique instance id,
	 * so without a release path the map grows by one entry per mount
	 * and never shrinks. Counting owners keeps ids that are shared on
	 * purpose (a `stateTargetId` override) alive until the last one
	 * detaches.
	 *
	 * @type {Map<string, number>} ownerCounts
	 * @private
	 */
	static ownerCounts = new Map();

	/**
	 * This will restore a state target.
	 *
	 * @param {string} id
	 * @param {StateTarget} target
	 * @returns {void}
	 */
	static restore(id, target)
	{
		this.targets.set(id, target);
		this.addOwner(id);
	}

	/**
	 * This will get the state target.
	 *
	 * @param {string} id
	 * @returns {StateTarget}
	 */
	static getTarget(id)
	{
		if (!this.targets.has(id))
		{
            this.targets.set(id, new StateTarget(id));
        }
        return this.targets.get(id);
	}

	/**
	 * This will get the state target and claim ownership of it.
	 *
	 * Every attach must be paired with a detach or the target is
	 * retained for the life of the page.
	 *
	 * @param {string} id
	 * @returns {StateTarget}
	 */
	static attach(id)
	{
		const target = this.getTarget(id);
		this.addOwner(id);
		return target;
	}

	/**
	 * This will record an owner of a target.
	 *
	 * @protected
	 * @param {string} id
	 * @returns {void}
	 */
	static addOwner(id)
	{
		this.ownerCounts.set(id, (this.ownerCounts.get(id) || 0) + 1);
	}

	/**
	 * This will release an owner of a state target. The target is
	 * reset and dropped once the last owner detaches.
	 *
	 * Ids that were never attached (targets created on demand by
	 * getTarget, e.g. app level states) are left alone.
	 *
	 * @param {string} id
	 * @returns {void}
	 */
	static detach(id)
	{
		const count = this.ownerCounts.get(id);
		if (count === undefined)
		{
			return;
		}

		if (count > 1)
		{
			this.ownerCounts.set(id, count - 1);
			return;
		}

		this.ownerCounts.delete(id);

		const target = this.targets.get(id);
		if (!target)
		{
			return;
		}

		target.remove();
		this.targets.delete(id);
	}

	/**
	 * This will get the state of an action.
	 *
	 * @protected
	 * @param {string} targetId
	 * @param {string} action
	 * @returns {*}
	 */
	static getActionState(targetId, action)
	{
		const target = this.getTarget(targetId);
		return target.get(action);
	}

	/**
	 * This will add a new target.
	 *
	 * @param {string} targetId
	 * @param {string} [action]
	 * @param {*} [state] the primary action state
	 * @returns {StateTarget}
	 */
	static add(targetId, action, state)
	{
		const target = this.getTarget(targetId);
		if (action)
		{
			target.addAction(action, state);
		}
		return target;
	}

	/**
	 * This will add a new action to a target.
	 *
	 * @param {string} targetId
	 * @param {string} action
	 * @param {string} [state]
	 * @returns {StateTarget}
	 */
	static addAction(targetId, action, state)
	{
		return this.add(targetId, action, state);
	}

	/**
	 * This will remove the action from a target.
	 *
	 * @param {string} targetId
	 * @param {string} action
	 * @param {string} [token]
	 * @returns {void}
	 */
	static removeAction(targetId, action, token)
	{
		if (token)
		{
			this.off(targetId, action, token);
			return;
		}

		/* no token removes the whole action from the target */
		const target = this.getTarget(targetId);
		if (target && action)
		{
			target.removeAction(action);
		}
	}

	/**
	 * This will add a new subscriber to the action.
	 *
	 * @param {string} targetId
	 * @param {string} action
	 * @param {function} callBack
	 * @returns {?number}
	 */
	static on(targetId, action, callBack)
	{
		const target = this.getTarget(targetId);
		if (action)
		{
			return target.on(action, callBack);
		}
		return null;
	}

	/**
	 * This will remove a subscriber from an action.
	 *
	 * @param {string} targetId
	 * @param {string} action
	 * @param {string} token
	 * @returns {void}
	 */
	static off(targetId, action, token)
	{
		this.remove(targetId, action, token);
	}

	/**
	 * This will remove a target or action or callBack.
	 *
	 * @param {string} targetId
	 * @param {string} [action]
	 * @param {string} [token]
	 * @returns {void}
	 */
	static remove(targetId, action, token)
	{
		const targets = this.targets,
		target = targets.get(targetId);
		if (!target)
		{
			return;
		}

		if (action)
		{
			target.off(action, token);
			return;
		}

		this.targets.delete(targetId);
		this.ownerCounts.delete(targetId);
	}

	/**
	 * This will set the action state.
	 *
	 * @param {string} targetId
	 * @param {string} action
	 * @param {*} state
	 * @returns {void}
	 */
	static set(targetId, action, state)
	{
		const target = this.getTarget(targetId);
		target.set(action, state);
	}
}