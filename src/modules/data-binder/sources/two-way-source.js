import { Source } from './source.js';

/**
 * TwoWaySource
 *
 * This will create a two way source to use with
 * a connection.
 *
 * @class
 * @augments Source
 */
export class TwoWaySource extends Source
{
	/**
	 * This will create a new source.
	 *
	 * @constructor
	 * @param {object} pubSub
	 */
	constructor(pubSub)
	{
		super();

		/**
		 * @type {object} pubSub
		 */
		this.pubSub = pubSub;
	}

	/**
	 * This will subscribe to a message.
	 *
	 * @param {string} msg
	 * @returns {void}
	 */
	subscribe(msg)
	{
		this.msg = msg;

		const callBack = this.callBack.bind(this);
		this.token = this.pubSub.on(msg, callBack);
	}

	/**
	 * This will unsubscribe from a message.
	 *
	 * @returns {void}
	 */
	unsubscribe()
	{
		if (this.pubSub && this.msg && this.token)
		{
			this.pubSub.off(this.msg, this.token);
		}
		this.pubSub = null;
		this.msg = null;
		this.token = null;
	}

	/**
	 * Override this to setup cource callBack.
	 *
	 * @returns {void}
	 */
	callBack()
	{

	}
}