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
		if (!this.data || typeof this.data.on !== 'function')
		{
			console.warn('OneWaySource: Cannot subscribe - data source is null or does not have an "on" method. Make sure your component has data, state, or context.data initialized.', msg, this.data);
			return;
		}
		this.msg = msg;
		this.token = this.data.on(msg, callBack);
	}

	/**
	 * Subscribes to multiple messages on the same data source with a
	 * shared callback. Used by `DataBinder.watchMany` to collapse
	 * multi-property watchers (e.g. `'[[a]] - [[b]]'`) into a single
	 * connection/source pair instead of N.
	 *
	 * @param {Array<string>} msgs
	 * @param {function} callBack The shared callback. It receives
	 *     `(value, committer, msg)` when invoked via the per-prop wrapper.
	 * @returns {void}
	 */
	subscribeMany(msgs, callBack)
	{
		if (!this.data || typeof this.data.on !== 'function')
		{
			console.warn('OneWaySource: Cannot subscribeMany - data source is null or does not have an "on" method.', msgs, this.data);
			return;
		}

		const len = msgs.length;
		const subs = new Array(len);
		for (let i = 0; i < len; i++)
		{
			const msg = msgs[i];
			subs[i] = { msg, token: this.data.on(msg, callBack) };
		}
		this.subscriptions = subs;
	}

	/**
	 * This will unsubscribe from the message.
	 *
	 * @returns {void}
	 */
	unsubscribe()
	{
		if (this.data)
		{
			const subs = this.subscriptions;
			if (subs)
			{
				for (let i = 0, len = subs.length; i < len; i++)
				{
					this.data.off(subs[i].msg, subs[i].token);
				}
				this.subscriptions = null;
			}
			else if (this.msg && this.token)
			{
				this.data.off(this.msg, this.token);
			}
		}
		this.data = null;
		this.msg = null;
		this.token = null;
	}
}