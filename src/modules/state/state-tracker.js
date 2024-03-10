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
	 * @member {Map} targets
	 * @private
	 */
	static targets = new Map();

	/**
	 * This will restore a state target.
	 *
	 * @param {string} id
	 * @param {object} target
	 * @return {void}
	 */
	static restore(id, target)
	{
		this.targets.set(id, target);
	}

	/**
	 * This will get the state target.
	 *
	 * @param {string} id
	 * @return {object}
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
	 * This will get the state of an action.
	 *
	 * @protected
	 * @param {string} targetId
	 * @param {string} action
	 * @return {*}
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
	 * @return {object}
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
	 * @return {object}
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
	 * @return {void}
	 */
	static removeAction(targetId, action, token)
	{
		this.off(targetId, action, token);
	}

	/**
	 * This will add a new subscriber to the action.
	 *
	 * @param {string} targetId
	 * @param {string} action
	 * @param {function} callBack
	 * @return {string}
	 */
	static on(targetId, action, callBack)
	{
		const target = this.getTarget(targetId);
		if (action)
		{
			return target.on(action, callBack);
		}
		return false;
	}

	/**
	 * This will remove a subscriber from an action.
	 *
	 * @param {string} targetId
	 * @param {string} action
	 * @param {string} token
	 * @return {void}
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
	 * @return {void}
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
	}

	/**
	 * This will set the action state.
	 *
	 * @param {string} targetId
	 * @param {string} action
	 * @param {*} state
	 * @return {void}
	 */
	static set(targetId, action, state)
	{
		const target = this.getTarget(targetId);
		target.set(action, state);
	}
}