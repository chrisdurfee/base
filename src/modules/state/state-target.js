import { State } from './state.js';

 /**
 * StateTarget
 *
 * This will create a state target to track the state
 * of an object.
 *
 * @class
 * @augments State
 */
export class StateTarget extends State
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
		this.id = '';
	}
}