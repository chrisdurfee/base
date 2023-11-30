
import { SimpleData } from '../data/data.js';
import { StateTracker } from './state-tracker.js';

 /**
 * StateTarget
 *
 * This will create a state target to track the state
 * of an object.
 *
 * @class
 * @augments SimpleData
 */
export class StateTarget extends SimpleData
{
	/**
	 * This will create a state target.
	 *
	 * @constructor
	 * @param {string} id
	 */
	constructor(id)
	{
		super();
		this.id = id;
	}

	/**
	 * This will restore a state to the controller.
	 *
	 * @return {void}
	 */
	restore()
	{
		StateTracker.restore(this.id, this);
	}

	/**
	 * This will remove the target from the controller.
	 *
	 * @return {void}
	 */
	remove()
	{
		StateTracker.remove(this.id);
	}

	/**
	 * This will add an action to the target.
	 *
	 * @param {string} action
	 * @param {mixed} state
	 * @return {void}
	 */
	addAction(action, state)
	{
		if (typeof state !== 'undefined')
		{
			this.set(action, state);
		}
	}

	/**
	 * This will get the state of an action.
	 *
	 * @param {string} action
	 * @return {mixed}
	 */
	getState(action)
	{
		return this.get(action);
	}

	/**
	 * This will remove an action or a callBack
	 * from an action. if no token is passed the
	 * whole action is removed.
	 *
	 * @param {string} action
	 * @param {string} [token]
	 * @return {void}
	 */
	removeAction(action, token)
	{
		/* if we have a token then the token will be
		the only item removed */
		if (token)
		{
			this.off(action, token);
			return;
		}

		const actions = this.stage;
		if (typeof actions[action] !== 'undefined')
		{
			delete actions[action];
		}
	}
}