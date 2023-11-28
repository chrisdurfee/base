
 import { StateTarget } from './state-target.js';

 /**
 * State
 *
 * This will create a state controller that can
 * add and remove targets, actions, and action
 * subscriber callBack functions.
 *
 * @class
 */
export class State
{
	/**
	 * @private
	 * @static
	 * @member {object} targets
	 */
	static targets = {};

	/**
	 * This will restore a state target.
	 *
	 * @param {string} id
	 * @param {object} target
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
	 * @param {string} targetId
	 * @param {string} action
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
		if(action)
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
		let target = this.getTarget(targetId);
		if(action)
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
	 */
	static remove(targetId, action, token)
	{
		let targets = this.targets,
		target = targets[targetId];
		if(!target)
		{
			return false;
		}

		if(action)
		{
			target.off(action, token);
		}
		else
		{
			delete targets[targetId];
		}
	}

	/**
	 * This will set the action state.
	 *
	 * @param {string} targetId
	 * @param {string} action
	 * @param {*} state
	 */
	static set(targetId, action, state)
	{
		var target = this.getTarget(targetId);
		target.set(action, state);
	}
}