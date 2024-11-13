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
	}

	/**
	 * This will get a subscriber array.
	 *
	 * @param {string} msg
	 * @returns {Map}
	 */
	get(msg)
	{
		if (!this.callBacks.has(msg))
		{
            this.callBacks.set(msg, new Map());
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
		const token = (++lastToken).toString();
		this.get(msg).set(token, callBack);

		return token;
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
		const subscribers = this.callBacks.get(msg);
        if (subscribers)
		{
			token = String(token);
            subscribers.delete(token);
            if (subscribers.size === 0)
			{
                this.callBacks.delete(msg);
            }
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
	 * @overload
	 * @param {string} msg
	 * @param {string} value
	 * @param {object} [committer]
	 * @returns {void}
	 */
	publish(msg, ...args)
	{
		const subscribers = this.callBacks.get(msg);
        if (!subscribers)
		{
			return;
		}

        for (const callBack of subscribers.values())
		{
            if (callBack)
			{
                callBack.apply(this, args);
            }
        }

	}
}