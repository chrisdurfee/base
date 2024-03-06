import { Objects } from '../../shared/objects.js';
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
	 * @return {StateHelper}
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
	 * @return {void}
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
	 * @param {mixed} state
	 * @param {function} callBack
	 * @param {string} [targetId]
	 * @return {object}
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
	 * @param {object} actions
	 * @return {array}
	 */
	convertStates(actions)
	{
		const convertedActions = [];
        for (const prop in actions)
		{
            if (!Objects.hasOwnProp(actions, prop))
			{
                continue;
            }

			const action = actions[prop] ?? {};
			if (prop === 'remotes')
			{
				this.setupRemoteStates(action, convertedActions);
				continue;
			}

			const { callBack = null, id: targetId = null, state } = action;
			convertedActions.push(this.createState(prop, state, callBack, targetId));
        }
        return convertedActions;
	}

	/**
	 * This will setup remote states.
	 *
	 * @protected
	 * @param {array} remotes
	 * @param {array} actions
	 * @return {void}
	 */
	setupRemoteStates(remotes, actions)
	{
		remotes.forEach(remote =>
		{
            if (!remote)
			{
                return;
            }

			for (const prop in remote)
			{
				if (!Objects.hasOwnProp(remote, prop) || prop === 'id')
				{
					continue;
				}

				const action = remote[prop] ?? {};
				const { callBack = null, state } = action;
				actions.push(this.createState(prop, state, callBack, remote.id));
			}
        });
	}

	/**
	 * This will remove remote states.
	 *
	 * @return {void}
	 */
	removeRemoteStates()
	{
		this.removeActions(this.remoteStates);
	}

	/**
	 * This will remove the actions.
	 *
	 * @param {array} actions
	 * @return {void}
	 */
	removeActions(actions)
	{
		actions.forEach(action =>
		{
            StateTracker.remove(action.targetId, action.action, action.token);
        });
	}

	/**
	 * This will restore a state.
	 *
	 * @param {object} state
	 * @return {void}
	 */
	restore(state)
	{
		StateTracker.restore();
        this.remoteStates.forEach(action =>
		{
            action.token = this.bindRemoteState(state, action.action, action.targetId);
        });
	}

	/**
	 * This will setup a two way bind to a remote state.
	 *
	 * @param {object} target
	 * @param {string} actionEvent
	 * @param {string} remoteTargetId
	 * @return {string}
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
	 * @return {void}
	 */
	addStatesToTarget(state, actions)
	{
		actions.forEach(action =>
		{
            const token = this.addAction(state, action);
            if (action.targetId)
			{
                action.token = token;
                this.remoteStates.push(action);
            }
        });
	}

	/**
	 * This will add an action.
	 *
	 * @param {object} target
	 * @param {object} action
	 * @return {string|undefined}
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