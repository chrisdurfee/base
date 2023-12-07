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
		 * @member {object} pubSub
		 */
		this.pubSub = pubSub;
	}

	/**
	 * This will subscribe to a message.
	 *
	 * @param {string} msg
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
	 * @return {void}
	 */
	unsubscribe()
	{
		this.pubSub.off(this.msg, this.token);
	}

	/**
	 * Override this to setup cource callBack.
	 *
	 * @return {void}
	 */
	callBack()
	{

	}
}