/**
 * LRUCache
 *
 * A bounded cache with least-recently-used eviction, used to keep
 * the module level parse/lookup caches from growing for the life of
 * the page.
 *
 * Recency is the Map's own insertion order: re-inserting a key moves
 * it to the end, so the first key returned by the iterator is always
 * the least recently used one.
 *
 * @class
 */
export class LRUCache
{
	/**
	 * This will create an LRU cache.
	 *
	 * @constructor
	 * @param {number} [maxSize=1000]
	 */
	constructor(maxSize = 1000)
	{
		/**
		 * @type {Map<*, *>} cache
		 * @protected
		 */
		this.cache = new Map();

		/**
		 * @type {number} maxSize
		 */
		this.maxSize = maxSize;

		/**
		 * The most recently used key. Reads of the hottest key are by
		 * far the common case, and comparing against this avoids the
		 * delete/set pair that promotion would otherwise cost.
		 *
		 * @type {*} lastKey
		 * @protected
		 */
		this.lastKey = undefined;
	}

	/**
	 * This will get a value and promote the key to most recently
	 * used.
	 *
	 * @param {*} key
	 * @returns {*} The value or undefined when not cached.
	 */
	get(key)
	{
		const cache = this.cache;
		const value = cache.get(key);

		/* Cached values may legitimately be undefined or null, so a
		 * miss has to be confirmed with has(). */
		if (value === undefined && !cache.has(key))
		{
			return undefined;
		}

		if (key !== this.lastKey)
		{
			cache.delete(key);
			cache.set(key, value);
			this.lastKey = key;
		}

		return value;
	}

	/**
	 * This will check if a key is cached without promoting it.
	 *
	 * @param {*} key
	 * @returns {boolean}
	 */
	has(key)
	{
		return this.cache.has(key);
	}

	/**
	 * This will add a value and promote the key to most recently
	 * used, evicting the least recently used key when over capacity.
	 *
	 * @param {*} key
	 * @param {*} value
	 * @returns {void}
	 */
	set(key, value)
	{
		const cache = this.cache;

		/* delete() returns false if key doesn't exist, so no has() guard needed. */
		cache.delete(key);
		cache.set(key, value);
		this.lastKey = key;

		// Evict oldest if over limit
		if (cache.size > this.maxSize)
		{
			const firstKey = cache.keys().next().value;
			cache.delete(firstKey);
		}
	}

	/**
	 * This will remove a key.
	 *
	 * @param {*} key
	 * @returns {void}
	 */
	delete(key)
	{
		this.cache.delete(key);

		if (key === this.lastKey)
		{
			this.lastKey = undefined;
		}
	}

	/**
	 * This will empty the cache.
	 *
	 * @returns {void}
	 */
	clear()
	{
		this.cache.clear();
		this.lastKey = undefined;
	}
}
