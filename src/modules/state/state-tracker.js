
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
	 * @member {object} targets
	 * @private
	 */
	static targets = {};

	/**
	 * This will restore a state target.
	 *
	 * @param {string} id
	 * @param {object} target
	 * @return {void}
	 */
	static restore(id, target)
	{
		this.targets[id] = target;
	}

	/**
	 * This will get the state target.
	 *
	 * @param {string} id
	 * @return {object}
	 */
	static getTarget(id)
	{
		const targets = this.targets;
		return (targets[id] || (targets[id] = new StateTarget(id)));
	}

	/**
	 * This will get the state of an action.
	 *
	 * @protected
	 * @param {string} targetId
	 * @param {string} action
	 * @return {mixed}
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
	 * @param {mixed} [state] the primary action state
	 * @return {object}
	 */
	add(targetId, action, state)
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
	addAction(targetId, action, state)
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
	removeAction(targetId, action, token)
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
	on(targetId, action, callBack)
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
	off(targetId, action, token)
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
	remove(targetId, action, token)
	{
		const targets = this.targets,
		target = targets[targetId];
		if (!target)
		{
			return;
		}

		if (action)
		{
			target.off(action, token);
			return;
		}

		delete targets[targetId];
	}

	/**
	 * This will set the action state.
	 *
	 * @param {string} targetId
	 * @param {string} action
	 * @param {mixed} state
	 * @return {void}
	 */
	set(targetId, action, state)
	{
		const target = this.getTarget(targetId);
		target.set(action, state);
	}
}