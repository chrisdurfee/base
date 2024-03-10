import { SimpleData } from '../data/data.js';

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
	 * This will setup the state target object.
	 *
	 * @protected
	 * @returns {void}
	 * @override
	 */
	setup()
	{
		this.stage = {};
		this.id = null;
	}

	/**
	 * This will add an action to the target.
	 *
	 * @param {string} action
	 * @param {*} state
	 * @returns {void}
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
	 * @returns {*}
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
	 * @returns {void}
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