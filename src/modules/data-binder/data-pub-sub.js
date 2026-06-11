/* Tokens start at 1 so they are always truthy — sources use
 * `if (this.token)` guards before unsubscribing. */
let lastToken = 0;

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
	 * @param {boolean} [indexPrefixes=false] Maintain an index of
	 * subscribed messages grouped by their `prefix:` segment. Used by
	 * the data binder so deep data can publish only to subscribed
	 * paths instead of walking every node of a value.
	 */
	constructor(indexPrefixes = false)
	{
		/**
		 * @type {Map} callBacks
		 * @protected
		 */
		this.callBacks = new Map();

		/**
		 * Index of subscribed messages keyed by message prefix
		 * (substring through the first ':'). Null when disabled.
		 *
		 * @type {Map<string, Set<string>>|null}
		 * @protected
		 */
		this.prefixIndex = indexPrefixes ? new Map() : null;

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
		 * Maximum flush iterations before warning.
		 * Set high enough to handle deep reactive cascades in large apps
		 * (e.g. route change → multiple dependent data objects updating in sequence).
		 * @type {number}
		 */
		this.maxFlushIterations = 2000;

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

		/**
		 * Promises waiting for flush completion
		 * @type {Array<Function>}
		 * @protected
		 */
		this.flushCompleteResolvers = [];

		/**
		 * Callbacks to execute after next flush
		 * @type {Array<Function>}
		 * @protected
		 */
		this.flushCallbacks = [];
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
		this.prefixIndex?.clear();
		this.updateQueue.clear();
		this.flushScheduled = false;
		this.isFlushing = false;
		this.flushIterations = 0;
		lastToken = 0;
	}

	/**
	 * This will add a subscriber.
	 *
	 * Tokens are numbers — string conversion was allocating a new
	 * string per watcher during page builds. Tokens are opaque to
	 * callers and only round-trip back into off().
	 *
	 * @param {string} msg
	 * @param {function} callBack
	 * @returns {number} The subscriber token.
	 */
	on(msg, callBack)
	{
		const token = ++lastToken;

		/* Inlined get-or-create avoids the has/set/get triple lookup
		 * of get() on the hot build path. */
		let subscribers = this.callBacks.get(msg);
		if (!subscribers)
		{
			subscribers = new Map();
			this.callBacks.set(msg, subscribers);

			if (this.prefixIndex)
			{
				this._indexMessage(msg);
			}
		}
		subscribers.set(token, callBack);

		return token;
	}

	/**
	 * This will add a message to the prefix index.
	 *
	 * @protected
	 * @param {string} msg
	 * @returns {void}
	 */
	_indexMessage(msg)
	{
		const idx = msg.indexOf(':');
		if (idx === -1)
		{
			return;
		}

		const prefix = msg.substring(0, idx + 1);
		let msgs = this.prefixIndex.get(prefix);
		if (!msgs)
		{
			msgs = new Set();
			this.prefixIndex.set(prefix, msgs);
		}
		msgs.add(msg);
	}

	/**
	 * This will remove a message from the prefix index.
	 *
	 * @protected
	 * @param {string} msg
	 * @returns {void}
	 */
	_unindexMessage(msg)
	{
		const idx = msg.indexOf(':');
		if (idx === -1)
		{
			return;
		}

		const prefix = msg.substring(0, idx + 1);
		const msgs = this.prefixIndex.get(prefix);
		if (msgs)
		{
			msgs.delete(msg);
			if (msgs.size === 0)
			{
				this.prefixIndex.delete(prefix);
			}
		}
	}

	/**
	 * This will get the subscribed messages for a prefix
	 * (e.g. 'dt-3:'). Returns null when prefix indexing is
	 * disabled or no messages are subscribed.
	 *
	 * @param {string} prefix
	 * @returns {Set<string>|null}
	 */
	getPrefixMessages(prefix)
	{
		return (this.prefixIndex && this.prefixIndex.get(prefix)) || null;
	}

	/**
	 * This will get the subscribed message keys. Used by deep data
	 * to publish only to subscribed paths.
	 *
	 * @returns {IterableIterator<string>}
	 */
	getMessages()
	{
		return this.callBacks.keys();
	}

	/**
	 * This will remove a subscriber.
	 *
	 * @param {string} msg
	 * @param {number} token
	 * @returns {void}
	 */
	off(msg, token)
	{
		const subscribers = this.callBacks.get(msg);
		if (subscribers)
		{
			subscribers.delete(token);
			if (subscribers.size === 0)
			{
				this.callBacks.delete(msg);

				if (this.prefixIndex)
				{
					this._unindexMessage(msg);
				}
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

		if (this.prefixIndex)
		{
			this._unindexMessage(msg);
		}
	}

	/**
	 * This will publish a message.
	 * In batching mode, updates are queued and flushed in a microtask.
	 * Data operations remain synchronous; only DOM updates are batched.
	 *
	 * @param {string} msg
	 * @param {*} value
	 * @param {object} [committer]
	 * @returns {void}
	 */
	publish(msg, value, committer)
	{
		// If batching disabled, publish immediately
		if (!this.batchingEnabled)
		{
			this.publishImmediate(msg, value, committer);
			return;
		}

		/**
		 * Fast path: skip queueing when nothing is listening.
		 *
		 * Deep data publishes every leaf path of large objects and
		 * arrays; most of those paths have no subscribers. The legacy
		 * synchronous path (publishImmediate) returned early for them,
		 * but queueing them first allocates an array per call and
		 * churns the flush loop, which dominated route-change profiles
		 * on big pages.
		 *
		 * Subscribers that attach after publish read the current value
		 * at attach time (see dataBinder.watch), so dropping unwatched
		 * messages loses no information.
		 */
		if (!this.callBacks.has(msg))
		{
			return;
		}

		// Queue the update (2-element array for dedup storage)
		this.updateQueue.set(msg, [value, committer]);

		if (this.debugMode)
		{
			console.log('[DataPubSub] Queued update:', msg, value);
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
			this._resolveFlushComplete();
			return;
		}


		// Reset counter at the start of each NEW top-level flush cycle.
		// Only recursive flushes (isFlushing already true) should accumulate.
		if (!this.isFlushing)
		{
			this.flushIterations = 0;
		}

		// Set flushing flag to prevent recursive scheduling
		this.isFlushing = true;
		this.flushScheduled = false;

		// Infinite loop detection (only within a single flush cycle)
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
			this._resolveFlushComplete();
			this.flushIterations = 0;
			return;
		}

		if (this.debugMode)
		{
			console.log('[DataPubSub] Flushing', this.updateQueue.size, 'updates (iteration', this.flushIterations + ')');
		}

		/* Swap active queue — O(1) reference swap instead of O(n) Map copy.
		 * The old map becomes `updates` for processing while a fresh empty
		 * Map begins collecting any publishes that fire during processing.
		 * Isolation guarantee is identical to the copy approach. */
		const updates = this.updateQueue;
		this.updateQueue = new Map();

		try
		{
			// Process all updates
			for (const [msg, args] of updates)
			{
				this.publishImmediate(msg, args[0], args[1]);
			}
		}
		finally
		{
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
				this._resolveFlushComplete();
			}
		}
	}

	/**
	 * Resolve all pending flush completion promises and execute callbacks.
	 *
	 * @private
	 * @returns {void}
	 */
	_resolveFlushComplete()
	{
		// Resolve promises
		if (this.flushCompleteResolvers.length > 0)
		{
			const resolvers = this.flushCompleteResolvers;
			this.flushCompleteResolvers = [];
			const length = resolvers.length;
			for (let i = 0; i < length; i++)
			{
				resolvers[i]();
			}
		}

		// Execute and clear callbacks
		if (this.flushCallbacks.length > 0)
		{
			const callbacks = this.flushCallbacks;
			this.flushCallbacks = [];
			const length = callbacks.length;
			for (let i = 0; i < length; i++)
			{
				callbacks[i]();
			}
		}
	}

	/**
	 * Returns a promise that resolves when the next flush cycle completes.
	 * Useful for waiting until batched DOM updates are applied.
	 *
	 * @returns {Promise<void>}
	 */
	nextFlush()
	{
		return new Promise((resolve) =>
		{
			this.flushCompleteResolvers.push(resolve);

			// If no flush is scheduled, resolve immediately
			if (!this.flushScheduled && !this.isFlushing)
			{
				queueMicrotask(() => resolve());
			}
		});
	}

	/**
	 * Register a callback to execute after the next flush cycle completes.
	 * Callback is automatically removed after execution (one-time use).
	 * Useful for waiting until batched DOM updates are applied.
	 *
	 * @param {Function} callback - Function to execute after next flush
	 * @returns {void}
	 */
	onFlush(callback)
	{
		if (typeof callback !== 'function')
		{
			console.warn('[DataPubSub] onFlush requires a function callback');
			return;
		}

		this.flushCallbacks.push(callback);

		// If no flush is scheduled, execute immediately
		if (!this.flushScheduled && !this.isFlushing)
		{
			queueMicrotask(() =>
			{
				if (this.flushCallbacks.length > 0)
				{
					const callbacks = this.flushCallbacks;
					this.flushCallbacks = [];
					const length = callbacks.length;
					for (let i = 0; i < length; i++)
					{
						callbacks[i]();
					}
				}
			});
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
		// @ts-ignore
		this.flush();
	}

	/**
	 * Publish a message immediately without batching.
	 * This is the original synchronous publish logic.
	 *
	 * Individual subscriber errors are caught so one failing
	 * callback cannot prevent other subscribers from receiving
	 * updates or break the flush cycle.
	 *
	 * @param {string} msg
	 * @param {*} value
	 * @param {object} [committer]
	 * @returns {void}
	 */
	publishImmediate(msg, value, committer)
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
				try
				{
					callBack(value, committer);
				}
				catch (error)
				{
					console.error('[DataPubSub] Subscriber error for "' + msg + '":', error);
				}
			}
		}
	}
}