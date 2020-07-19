 
 import {StateTarget} from './state-target.js';
 
 /**
 * StateController
 * 
 * This will create a state controller that can 
 * add and remove targets, actions, and action
 * subscriber callBack functions. 
 * 
 * @class
 */
class StateController
{ 
	/**
	 * @constructor
	 */
	constructor()
	{ 
		this.targets = {}; 
	} 

	/**
	 * This will restore a state target. 
	 * 
	 * @param {string} id 
	 * @param {object} target 
	 */
	restore(id, target)
	{
		this.targets[id] = target; 
	}

	/**
	 * This will get the state target. 
	 * 
	 * @param {string} id 
	 * @return {object}
	 */
	getTarget(id) 
	{ 
		let targets = this.targets;
		return (targets[id] || (targets[id] = new StateTarget(id)));
	} 

	/**
	 * This will get the state of an action. 
	 * 
	 * @param {string} targetId 
	 * @param {string} action 
	 */
	getActionState(targetId, action)
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
	add(targetId, action, state)
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
	 */
	remove(targetId, action, token)
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
	set(targetId, action, state)
	{
		var target = this.getTarget(targetId); 
		target.set(action, state); 
	}
} 

export const state = new StateController();