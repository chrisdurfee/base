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
		 * @type {Map} callBacks
		 * @protected
		 */
		this.callBacks = new Map();

		/**
		 * Queue for batching publish calls
		 * @type {Map<string, Array>}
		 * @protected
		 */
		this.updateQueue = new Map();

		/**
		 * Flag to track if flush is scheduled
		 * @type {boolean}
		 * @protected
		 */
		this.flushScheduled = false;

		/**
		 * Flag to track if currently flushing
		 * @type {boolean}
		 * @protected
		 */
		this.isFlushing = false;

		/**
		 * Counter for flush iterations (infinite loop detection)
		 * @type {number}
		 * @protected
		 */
		this.flushIterations = 0;

		/**
		 * Maximum flush iterations before warning
		 * @type {number}
		 */
		this.maxFlushIterations = 100;

		/**
		 * Enable/disable batching (useful for testing)
		 * @type {boolean}
		 */
		this.batchingEnabled = true;

		/**
		 * Debug mode for observability
		 * @type {boolean}
		 */
		this.debugMode = false;
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
		this.updateQueue.clear();
		this.flushScheduled = false;
		this.isFlushing = false;
		this.flushIterations = 0;
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
	 * In batching mode, updates are queued and flushed in a microtask.
	 * Data operations remain synchronous; only DOM updates are batched.
	 *
	 * @overload
	 * @param {string} msg
	 * @param {string} value
	 * @param {object} [committer]
	 * @returns {void}
	 */
	publish(msg, ...args)
	{
		// If batching disabled, publish immediately
		if (!this.batchingEnabled)
		{
			this.publishImmediate(msg, ...args);
			return;
		}

		// Queue the update
		this.updateQueue.set(msg, args);

		if (this.debugMode)
		{
			console.log('[DataPubSub] Queued update:', msg, args);
		}

		// Schedule flush if not already scheduled
		this.scheduleFlush();
	}

	/**
	 * Schedule a flush in a microtask.
	 * Ensures only one flush is scheduled at a time.
	 * If currently flushing, updates are queued and will be processed after current flush.
	 *
	 * @returns {void}
	 */
	scheduleFlush()
	{
		// If already flushing, don't schedule new microtask
		// The current flush will handle queued updates
		if (this.isFlushing)
		{
			return;
		}

		if (this.flushScheduled)
		{
			return;
		}

		this.flushScheduled = true;

		queueMicrotask(() => {
			this.flush();
		});
	}

	/**
	 * Flush all queued updates.
	 * Deduplicates updates (only last update per msg is applied).
	 * Handles recursive publishes by re-flushing until queue is empty.
	 * Detects infinite loops and breaks after maxFlushIterations.
	 *
	 * @returns {void}
	 */
	flush()
	{
		if (this.updateQueue.size === 0)
		{
			this.flushScheduled = false;
			this.isFlushing = false;
			this.flushIterations = 0;
			return;
		}

		// Set flushing flag to prevent recursive scheduling
		this.isFlushing = true;
		this.flushScheduled = false;

		// Infinite loop detection
		this.flushIterations++;
		if (this.flushIterations > this.maxFlushIterations)
		{
			console.error(
				'[DataPubSub] Infinite loop detected! Flush iterations exceeded',
				this.maxFlushIterations,
				'- Breaking to prevent memory exhaustion.'
			);
			console.error('[DataPubSub] Queue size:', this.updateQueue.size);
			console.error('[DataPubSub] Queued messages:', Array.from(this.updateQueue.keys()));

			// Clear queue and reset to prevent further damage
			this.updateQueue.clear();
			this.flushScheduled = false;
			this.isFlushing = false;
			this.flushIterations = 0;
			return;
		}

		if (this.debugMode)
		{
			console.log('[DataPubSub] Flushing', this.updateQueue.size, 'updates (iteration', this.flushIterations + ')');
		}

		// Copy queue and clear it
		const updates = new Map(this.updateQueue);
		this.updateQueue.clear();

		// Process all updates
		for (const [msg, args] of updates)
		{
			this.publishImmediate(msg, ...args);
		}

		if (this.debugMode)
		{
			console.log('[DataPubSub] Flush complete (iteration', this.flushIterations + ')');
		}

		// If new updates were queued during processing, flush again
		if (this.updateQueue.size > 0)
		{
			if (this.debugMode)
			{
				console.log('[DataPubSub] New updates queued during flush, re-flushing...');
			}
			this.flush(); // Recursive flush
		}
		else
		{
			// All done, reset flags
			this.isFlushing = false;
			this.flushIterations = 0;
		}
	}

	/**
	 * Flush queued updates synchronously.
	 * Use as escape hatch when immediate updates are critical.
	 *
	 * @returns {void}
	 */
	flushSync()
	{
		this.flush();
	}

	/**
	 * Publish a message immediately without batching.
	 * This is the original synchronous publish logic.
	 *
	 * @param {string} msg
	 * @param  {...any} args
	 * @returns {void}
	 */
	publishImmediate(msg, ...args)
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