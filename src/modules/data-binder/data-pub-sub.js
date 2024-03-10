let lastToken = -1;

/**
 * DataPubSub
 *
 * This is a pub sub class to allow subscribers to
 * listen for updates when published by publishers.
 *
 * @class
 */
export class DataPubSub
{
	/**
	 * This will create a data pub sub.
	 *
	 * @constructor
	 */
	constructor()
	{
		/**
		 * @member {Map} callBacks
		 * @protected
		 */
		this.callBacks = new Map();

		/**
		 * @member {number} lastToken
		 * @protected
		 */
		this.lastToken = -1;
	}

	/**
	 * This will get a subscriber array.
	 *
	 * @param {string} msg
	 * @returns {array}
	 */
	get(msg)
	{
		if (!this.callBacks.has(msg))
		{
            this.callBacks.set(msg, []);
        }
        return this.callBacks.get(msg);
	}

	/**
	 * This will reset pub sub.
	 *
	 * @returns {void}
	 */
	reset()
	{
		this.callBacks.clear();
		this.lastToken = -1;
		lastToken = -1;
	}

	/**
	 * This will add a subscriber.
	 *
	 * @param {string} msg
	 * @param {function} callBack
	 * @returns {string} The subscriber token.
	 */
	on(msg, callBack)
	{
		const token = (++lastToken);

		this.get(msg)
			.push({
				token,
				callBack
			});

		return String(token);
	}

	/**
	 * This will remove a subscriber.
	 *
	 * @param {string} msg
	 * @param {string} token
	 * @returns {void}
	 */
	off(msg, token)
	{
		const list = this.callBacks.get(msg);
		if (!list)
		{
			return;
		}

		const index = list.findIndex(item => item.token === token);
		if (index !== -1)
		{
			list.splice(index, 1);
		}
	}

	/**
	 * This will delete a message.
	 *
	 * @param {string} msg
	 * @returns {void}
	 */
	remove(msg)
	{
		this.callBacks.delete(msg);
	}

	/**
	 * This will publish a message.
	 *
	 * @param {string} msg
	 * @overload
	 * @param {string} value
	 * @param {object} committer
	 * @returns {void}
	 */
	publish(msg, ...args)
	{
		const list = this.callBacks.get(msg);
		if (!list)
		{
			return;
		}

		for (const { callBack } of list)
		{
			if (!callBack)
			{
				continue;
			}
			callBack.apply(this, args);
		}
	}
}