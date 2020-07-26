/* base framework module */
/*
	this will create a layout builder object
	and shortcut functions.
*/
(function()
{
	"use strict";

	/**
	 * StateTarget
	 *
	 * This will create a state target to track the state
	 * of an object.
	 * @class
	 * @augments base.SimpleData
	 */
	var StateTarget = base.SimpleData.extend(
	{
		/**
		 * @constructor
		 * @param {string} id
		 */
		constructor: function(id)
		{
			this._init();

			/* this will setup the event sub for
			one way binding */
			this.eventSub = new base.DataPubSub();

			this.stage = {};
			this.id = id;
		},

		/**
		 * This will restore a state to the controller.
		 */
		restore: function()
		{
			base.state.restore(this.id, this);
		},

		/**
		 * This will remove the target from the controller.
		 */
		remove: function()
		{
			base.state.remove(this.id);
		},

		/**
		 * This will add an action to the target.
		 *
		 * @param {string} action
		 * @param {*} state
		 */
		addAction: function(action, state)
		{
			if(typeof state !== 'undefined')
			{
				this.set(action, state);
			}
		},

		/**
		 * This will get the state of an action.
		 *
		 * @param {string} action
		 * @return {*}
		 */
		getState: function(action)
		{
			return this.get(action);
		},

		/**
		 * This will remove an action or a callBack
		 * from an action. if no token is passed the
		 * whole action is removed.
		 *
		 * @param {string} action
		 * @param {string} [token]
		 */
		removeAction: function(action, token)
		{
			/* if we have a token then the token will be
			the only item removed */
			if(token)
			{
				this.off(action, token);
			}
			else
			{
				var actions = this.stage;
				if(typeof actions[action] !== 'undefined')
				{
					delete actions[action];
				}
			}
		}
	});

	/**
	 * StateController
	 *
	 * This will create a state controller that can
	 * add and remove targets, actions, and action
	 * subscriber callBack functions.
	 *
	 * @class
	 */
	var StateController = base.Class.extend(
	{
		/**
		 * @constructor
		 */
		constructor: function()
		{
			this.targets = {};
		},

		/**
		 * This will restore a state target.
		 *
		 * @param {string} id
		 * @param {object} target
		 */
		restore: function(id, target)
		{
			this.targets[id] = target;
		},

		/**
		 * This will get the state target.
		 *
		 * @param {string} id
		 * @return {object}
		 */
		getTarget: function(id)
		{
			var targets = this.targets;
			return (targets[id] || (targets[id] = new StateTarget(id)));
		},

		/**
		 * This will get the state of an action.
		 *
		 * @param {string} targetId
		 * @param {string} action
		 */
		getActionState: function(targetId, action)
		{
			var target = this.getTarget(targetId);
			return target.get(action);
		},

		/**
		 * This will add a new target.
		 *
		 * @param {string} targetId
		 * @param {string} [action]
		 * @param {*} [state] the primary action state
		 * @return {object}
		 */
		add: function(targetId, action, state)
		{
			var target = this.getTarget(targetId);
			if(action)
			{
				target.addAction(action, state);
			}
			return target;
		},

		/**
		 * This will add a new action to a target.
		 *
		 * @param {string} targetId
		 * @param {string} action
		 * @param {string} [state]
		 * @return {object}
		 */
		addAction: function(targetId, action, state)
		{
			return this.add(targetId, action, state);
		},

		/**
		 * This will remove the action from a target.
		 *
		 * @param {string} targetId
		 * @param {string} action
		 * @param {string} [token]
		 */
		removeAction: function(targetId, action, token)
		{
			this.off(targetId, action, token);
		},

		/**
		 * This will add a new subscriber to the action.
		 *
		 * @param {string} targetId
		 * @param {string} action
		 * @param {function} callBack
		 * @return {string}
		 */
		on: function(targetId, action, callBack)
		{
			var target = this.getTarget(targetId);
			if(action)
			{
				return target.on(action, callBack);
			}
			return false;
		},

		/**
		 * This will remove a subscriber from an action.
		 *
		 * @param {string} targetId
		 * @param {string} action
		 * @param {string} token
		 */
		off: function(targetId, action, token)
		{
			this.remove(targetId, action, token);
		},

		/**
		 * This will remove a target or action or callBack.
		 *
		 * @param {string} targetId
		 * @param {string} [action]
		 * @param {string} [token]
		 */
		remove: function(targetId, action, token)
		{
			var targets = this.targets;
			var target = targets[targetId];
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
		},

		/**
		 * This will set the action state.
		 *
		 * @param {string} targetId
		 * @param {string} action
		 * @param {*} state
		 */
		set: function(targetId, action, state)
		{
			var target = this.getTarget(targetId);
			target.set(action, state);
		}
	});

	base.extend.StateController = StateController;
	base.extend.state = new StateController();
})();