/**
 * LRUCache
 *
 * A bounded cache with recency aware eviction, used to keep the module
 * level parse/lookup caches from growing for the life of the page.
 *
 * Recency is tracked with a second chance (CLOCK) flag rather than by
 * re-inserting keys into the Map. A read marks the entry it returns, and
 * eviction walks the oldest entries, clearing the flag of anything read
 * since the last eviction and taking the first entry that was not. That
 * keeps a key that is still in use from being dropped while leaving
 * reads free of Map mutation, which matters because these caches sit on
 * paths that run per publish and per render.
 *
 * Eviction removes a batch rather than a single entry so the Map key
 * iterator is allocated once per batch instead of once per write. Writes
 * that miss are the common case on a page rendering new rows, and the
 * per-write iterator was the dominant cost of the bound.
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
		 * @type {Map<*, {value: *, used: boolean}>} cache
		 * @protected
		 */
		this.cache = new Map();

		/**
		 * @type {number} maxSize
		 */
		this.maxSize = maxSize;

		/**
		 * The number of entries dropped by one eviction. Caches too
		 * small to batch fall back to one, which is also what keeps a
		 * cache of two or three entries behaving exactly.
		 *
		 * @type {number} evictCount
		 * @protected
		 */
		this.evictCount = (maxSize >= 8)? (maxSize >> 3) : 1;
	}

	/**
	 * This will get a value and mark the key as recently used.
	 *
	 * @param {*} key
	 * @returns {*} The value or undefined when not cached.
	 */
	get(key)
	{
		const entry = this.cache.get(key);
		if (entry === undefined)
		{
			return undefined;
		}

		entry.used = true;
		return entry.value;
	}

	/**
	 * This will check if a key is cached without marking it used.
	 *
	 * @param {*} key
	 * @returns {boolean}
	 */
	has(key)
	{
		return this.cache.has(key);
	}

	/**
	 * This will add a value, evicting a batch of the least recently
	 * used keys when the write goes over capacity.
	 *
	 * @param {*} key
	 * @param {*} value
	 * @returns {void}
	 */
	set(key, value)
	{
		const cache = this.cache;
		const entry = cache.get(key);
		if (entry !== undefined)
		{
			entry.value = value;
			entry.used = true;
			return;
		}

		cache.set(key, { value, used: false });

		if (cache.size > this.maxSize)
		{
			this.evict();
		}
	}

	/**
	 * This will drop entries from the oldest end until the cache has
	 * room for the next batch of writes.
	 *
	 * @protected
	 * @returns {void}
	 */
	evict()
	{
		const cache = this.cache;
		const target = this.maxSize - this.evictCount + 1;

		/* The first pass gives every entry read since the last
		 * eviction its second chance and clears the flag, so a second
		 * pass always reaches the target. */
		for (let pass = 0; pass < 2 && cache.size > target; pass++)
		{
			const keys = cache.keys();
			let examined = cache.size;

			while (examined-- > 0 && cache.size > target)
			{
				const key = keys.next().value;
				const entry = cache.get(key);
				if (entry !== undefined && entry.used)
				{
					entry.used = false;
					continue;
				}

				cache.delete(key);
			}
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
	}

	/**
	 * This will empty the cache.
	 *
	 * @returns {void}
	 */
	clear()
	{
		this.cache.clear();
	}
}
