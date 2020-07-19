import {state} from '../state/state.js';

/**
 * StateHelper
 * 
 * This is a helper to manage component states.  
 */
export class StateHelper
{
	/**
	 * @constructor
	 * @param {object} state
	 * @param {object} states 
	 */ 
	constructor(state, states)
	{
		this.remoteStates = []; 
		
		let actions = this.convertStates(states); 
		this.addStatesToTarget(state, actions); 
	} 
	
	/**
	 * This will create a state object. 
	 * 
	 * @param {string} action 
	 * @param {*} state 
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
	 * @param {object} action 
	 * @return {array}
	 */
	convertStates(action)
	{
		let actions = []; 
		for(var prop in action)
		{
			if(action.hasOwnProperty(prop) === false)
			{
				continue; 
			}
			else if(prop === 'remotes')
			{
				this.setupRemoteStates(action[prop], actions);
				continue;
			}

			var targetId = null, 
			callBack = null, 
			state = action[prop]; 
			if(state && typeof state === 'object')
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

	setupRemoteStates(remotes, actions)
	{
		let remote;
		for(var i = 0, length = remotes.length; i < length; i++)
		{
			remote = remotes[i];
			if(!remote)
			{
				continue; 
			}

			for(var prop in remote)
			{
				if(remote.hasOwnProperty(prop) === false || prop === 'id')
				{
					continue; 
				}

				var callBack = null, 
				value = remote[prop],
				state = (value !== null)? value : undefined; 
				if(state && typeof state === 'object')
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
	 */ 
	removeRemoteStates()
	{
		let remoteStates = this.remoteStates; 
		if(remoteStates)
		{
			this.removeActions(remoteStates);  
		}
	} 

	/**
	 * This will remove the actions. 
	 * 
	 * @param {array} actions 
	 */
	removeActions(actions)
	{
		if(actions.length < 1)
		{
			return; 
		}

		for(var i = 0, length = actions.length; i < length; i++)
		{ 
			var action = actions[i]; 
			state.remove(action.targetId, action.action, action.token);
		}
	} 

	/**
	 * This will restore a state. 
	 * 
	 * @param {object} state 
	 */
	restore(state)
	{
		state.restore(); 

		let remotes = this.remoteStates;
		if(!remotes)
		{
			return; 
		}
		
		for(var i = 0, length = remotes.length; i < length; i++)
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
	 * @return {string}
	 */
	bindRemoteState(target, actionEvent, remoteTargetId)
	{
		let token, 
		remoteTarget = state.getTarget(remoteTargetId),
		value = remoteTarget.get(actionEvent); 
		if(typeof value !== 'undefined')
		{
			target.set(actionEvent, value); 
		}

		token = remoteTarget.on(actionEvent, (state, prevState, committer) =>
		{
			if(committer === target)
			{
				return false; 
			}

			target.set(actionEvent, state, remoteTarget); 
		});

		target.on(actionEvent, (state, prevState, committer) =>
		{
			if(committer === remoteTarget)
			{
				return false; 
			}

			remoteTarget.set(actionEvent, state, target); 
		});

		return token; 
	} 
	
	/**
	 * This will add the states to the target. 
	 * 
	 * @protected
	 * @param {object} state
	 * @param {array} actions 
	 */
	addStatesToTarget(state, actions)
	{
		let remotes = this.remoteStates; 
		
		for(var i = 0, length = actions.length; i < length; i++)
		{ 
			var action = actions[i], 
			token = this.addAction(state, action);

			if(action.targetId)
			{
				action.token = token; 
				remotes.push(action);
			}   
		}
		
		if(remotes.length < 1)
		{
			this.remoteStates = null; 
		}
	} 

	/**
	 * This will add an action. 
	 * 
	 * @param {object} target 
	 * @param {object} action 
	 */
	addAction(target, action)
	{
		let token,  
		actionEvent = action.action;

		/* this will check to select the remote target if set */ 
		let targetId = action.targetId; 
		if(targetId)
		{
			token = this.bindRemoteState(target, actionEvent, targetId); 
		}

		if(typeof action.state !== 'undefined')
		{
			target.addAction(actionEvent, action.state);
		} 

		let callBack = action.callBack; 
		if(typeof callBack === 'function')
		{ 
			target.on(actionEvent, callBack);
		}

		return token; 
	}
}