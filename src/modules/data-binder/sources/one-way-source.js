import { Source } from './source.js';

/**
 * OneWaySource
 *
 * This will create a one way source to use with
 * a connection.
 *
 * @class
 * @augments Source
 */
export class OneWaySource extends Source
{
	/**
	 * This will setup the data source.
	 *
	 * @param {object} data
	 */
	constructor(data)
	{
		super();
		this.data = data;
	}

	/**
	 * This will subscribe to a message.
	 *
	 * @param {string} msg
	 * @param {function} callBack
	 * @return {void}
	 */
	subscribe(msg, callBack)
	{
		this.msg = msg;
		this.token = this.data.on(msg, callBack);
	}

	/**
	 * This will unsubscribe from the message.
	 *
	 * @return {void}
	 */
	unsubscribe()
	{
		this.data.off(this.msg, this.token);
	}
}