import { StateTracker } from '../state/state-tracker.js';

/**
 * StateHelper
 *
 * This is a helper to manage component states.
 *
 * @class
 */
export class StateHelper
{
	/**
	 * This will create a state helper.
	 *
	 * @constructor
	 * @param {object} state
	 * @param {object} states
	 */
	constructor(state, states)
	{
		/**
		 * @type {Array<any>} remoteStates
		 */
		this.remoteStates = [];

		/**
		 * Actions that registered a callBack on the local target.
		 * The subscription token has to be kept or the callBack can
		 * never be released.
		 *
		 * @type {Array<any>} callBackStates
		 */
		this.callBackStates = [];

		const actions = this.convertStates(states);
		this.addStatesToTarget(state, actions);
	}

	/**
	 * This will add states to a state.
	 *
	 * @param {object} state
	 * @param {object} states
	 * @returns {void}
	 */
	addStates(state, states)
	{
		const actions = this.convertStates(states);
		this.addStatesToTarget(state, actions);
	}

	/**
	 * This will create a state object.
	 *
	 * @param {string} action
	 * @param {*} state
	 * @param {function} callBack
	 * @param {string} [targetId]
	 * @returns {object}
	 */
	createState(action, state, callBack, targetId)
	{
		return {
			action,
			state,
			callBack,
			targetId,
			token: null,
			callBackToken: null
		};
	}

	/**
	 * This will convert an action object to a state array.
	 *
	 * @protected
	 * @param {object} action
	 * @returns {Array<any>}
	 */
	convertStates(action)
	{
		const actions = [];
		for (let prop in action)
		{
			if (!Object.prototype.hasOwnProperty.call(action, prop))
			{
				continue;
			}

			if (prop === 'remotes')
			{
				this.setupRemoteStates(action[prop], actions);
				continue;
			}

			let targetId = null,
			callBack = null,
			state = action[prop];
			if (state && typeof state === 'object')
			{
				callBack = state.callBack;
				targetId = state.id || state.targetId;
				state = state.state;
			}

			actions.push(this.createState(
				prop,
				state,
				callBack,
				targetId
			));
		}
		return actions;
	}

	/**
	 * This will setup remote states.
	 *
	 * @protected
	 * @param {Array<any>} remotes
	 * @param {Array<any>} actions
	 * @returns {void}
	 */
	setupRemoteStates(remotes, actions)
	{
		for (let i = 0, length = remotes.length; i < length; i++)
		{
			const remote = remotes[i];
			if (!remote)
			{
				continue;
			}

			for (let prop in remote)
			{
				if (!Object.prototype.hasOwnProperty.call(remote, prop) || prop === 'id')
				{
					continue;
				}

				let callBack = null,
				value = remote[prop],
				state = (value !== null)? value : undefined;
				if (state && typeof state === 'object')
				{
					callBack = state.callBack;
					state = state.state;
				}

				actions.push(this.createState(
					prop,
					state,
					callBack,
					remote.id
				));
			}
		}
	}

	/**
	 * This will remove remote states.
	 *
	 * @param {object} state
	 * @returns {void}
	 */
	removeRemoteStates(state)
	{
		const remoteStates = this.remoteStates;
		if (remoteStates)
		{
			this.removeActions(state, remoteStates);
		}
	}

	/**
	 * This will release the action callBacks registered on the
	 * local target.
	 *
	 * @param {object} state
	 * @returns {void}
	 */
	removeLocalStates(state)
	{
		const states = this.callBackStates;
		if (!states)
		{
			return;
		}

		for (let i = 0, length = states.length; i < length; i++)
		{
			const action = states[i];
			if (!action.callBackToken)
			{
				continue;
			}

			state.off(action.action, action.callBackToken);
			action.callBackToken = null;
		}
	}

	/**
	 * This will remove the actions.
	 *
	 * @param {object} state
	 * @param {Array<any>} actions
	 * @returns {void}
	 */
	removeActions(state, actions)
	{
		if (actions.length < 1)
		{
			return;
		}

		for (let i = 0, length = actions.length; i < length; i++)
		{
			const action = actions[i];
			if (action.token)
			{
				this.unbindRemoteState(state, action.token);
			}

			if (action.targetId)
			{
				StateTracker.remove(action.targetId, action.action, action.token);
			}
		}
	}

	/**
	 * This will restore a state.
	 *
	 * @param {object} state
	 * @returns {void}
	 */
	restore(state)
	{
		StateTracker.restore(state.id, state);

		/**
		 * The target was reset when the component was destroyed, so
		 * the local callBacks have to be re-subscribed here or a
		 * resumed component silently stops reacting to its states.
		 */
		const callBacks = this.callBackStates;
		if (callBacks)
		{
			for (let i = 0, length = callBacks.length; i < length; i++)
			{
				const action = callBacks[i];
				action.callBackToken = state.on(action.action, action.callBack);
			}
		}

		const remotes = this.remoteStates;
		if (!remotes)
		{
			return;
		}

		for (let i = 0, length = remotes.length; i < length; i++)
		{
			const action = remotes[i];
			action.token = this.bindRemoteState(state, action.action, action.targetId);
		}
	}

	/**
	 * This will setup a two way bind to a remote state.
	 *
	 * @param {object} target
	 * @param {string} actionEvent
	 * @param {string} remoteTargetId
	 * @returns {number} The link token.
	 */
	bindRemoteState(target, actionEvent, remoteTargetId)
	{
		const remoteTarget = StateTracker.getTarget(remoteTargetId);
		return target.link(remoteTarget, actionEvent);
	}

	/**
	 * This will unbind a remote state.
	 *
	 * @param {object} target
	 * @param {number} token
	 * @return {void}
	 */
	unbindRemoteState(target, token)
	{
		target.unlink(token);
	}

	/**
	 * This will add the states to the target.
	 *
	 * @protected
	 * @param {object} state
	 * @param {Array<any>} actions
	 * @returns {void}
	 */
	addStatesToTarget(state, actions)
	{
		const remotes = this.remoteStates;

		for (let i = 0, length = actions.length; i < length; i++)
		{
			const action = actions[i],
			token = this.addAction(state, action);

			if (action.targetId)
			{
				action.token = token;
				remotes.push(action);
			}
		}
	}

	/**
	 * This will add an action.
	 *
	 * @param {object} target
	 * @param {object} action
	 * @returns {number|null}
	 */
	addAction(target, action)
	{
		let token,
		actionEvent = action.action;

		/* this will check to select the remote target if set */
		const targetId = action.targetId;
		if (targetId)
		{
			token = this.bindRemoteState(target, actionEvent, targetId);
		}

		if (typeof action.state !== 'undefined')
		{
			target.addAction(actionEvent, action.state);
		}

		const callBack = action.callBack;
		if (typeof callBack === 'function')
		{
			action.callBackToken = target.on(actionEvent, callBack);
			this.callBackStates.push(action);
		}

		return token || null;
	}
}