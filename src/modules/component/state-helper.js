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
		 * @member {array} remoteStates
		 */
		this.remoteStates = [];

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
			token: null
		};
	}

	/**
	 * This will convert an action object to a state array.
	 *
	 * @protected
	 * @param {object} action
	 * @returns {array}
	 */
	convertStates(action)
	{
		const actions = [];
		for (var prop in action)
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

			var targetId = null,
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
	 * @param {array} remotes
	 * @param {array} actions
	 * @returns {void}
	 */
	setupRemoteStates(remotes, actions)
	{
		let remote;
		for (var i = 0, length = remotes.length; i < length; i++)
		{
			remote = remotes[i];
			if (!remote)
			{
				continue;
			}

			for (var prop in remote)
			{
				if (!Object.prototype.hasOwnProperty.call(remote, prop) || prop === 'id')
				{
					continue;
				}

				var callBack = null,
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
	 * @returns {void}
	 */
	removeRemoteStates()
	{
		const remoteStates = this.remoteStates;
		if (remoteStates)
		{
			this.removeActions(remoteStates);
		}
	}

	/**
	 * This will remove the actions.
	 *
	 * @param {array} actions
	 * @returns {void}
	 */
	removeActions(actions)
	{
		if (actions.length < 1)
		{
			return;
		}

		for (var i = 0, length = actions.length; i < length; i++)
		{
			var action = actions[i];
			StateTracker.remove(action.targetId, action.action, action.token);
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
		StateTracker.restore();

		const remotes = this.remoteStates;
		if (!remotes)
		{
			return;
		}

		for (var i = 0, length = remotes.length; i < length; i++)
		{
			var action = remotes[i];
			action.token = this.bindRemoteState(state, action.action, action.targetId);
		}
	}

	/**
	 * This will setup a two way bind to a remote state.
	 *
	 * @param {object} target
	 * @param {string} actionEvent
	 * @param {string} remoteTargetId
	 * @returns {string}
	 */
	bindRemoteState(target, actionEvent, remoteTargetId)
	{
		const remoteTarget = StateTracker.getTarget(remoteTargetId);
		return target.link(remoteTarget, actionEvent);
	}

	/**
	 * This will add the states to the target.
	 *
	 * @protected
	 * @param {object} state
	 * @param {array} actions
	 * @returns {void}
	 */
	addStatesToTarget(state, actions)
	{
		const remotes = this.remoteStates;

		for (var i = 0, length = actions.length; i < length; i++)
		{
			var action = actions[i],
			token = this.addAction(state, action);

			if (action.targetId)
			{
				action.token = token;
				remotes.push(action);
			}
		}

		if (remotes.length < 1)
		{
			this.remoteStates = null;
		}
	}

	/**
	 * This will add an action.
	 *
	 * @param {object} target
	 * @param {object} action
	 * @returns {string}
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
			target.on(actionEvent, callBack);
		}

		return token;
	}
}