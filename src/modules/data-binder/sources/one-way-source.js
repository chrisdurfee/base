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
	 * @returns {void}
	 */
	subscribe(msg, callBack)
	{
		this.msg = msg;
		this.token = this.data.on(msg, callBack);
	}

	/**
	 * This will unsubscribe from the message.
	 *
	 * @returns {void}
	 */
	unsubscribe()
	{
		if (this.data && this.msg && this.token)
		{
			this.data.off(this.msg, this.token);
		}
		this.data = null;
		this.msg = null;
		this.token = null;
	}
}