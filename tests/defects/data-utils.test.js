import { describe, expect, it } from 'vitest';
import { DataUtils } from '../../src/modules/data/types/deep-data/data-utils.js';

/**
 * The LRU cache class is private to the module. The shared segment cache
 * instance is the only handle on it, so the constructor is read off that
 * instance to build small, isolated caches for the eviction tests.
 *
 * @type {any}
 */
const LRUCache = DataUtils.segmentCache.constructor;

describe('DataUtils.getSegments', () =>
{
	/**
	 * These pin the currently-correct segment output for every path shape
	 * the deep data helpers rely on. `deepDataPattern`
	 * (src/modules/data/types/deep-data/data-utils.js:56) is scheduled for
	 * a rewrite, so a regression here would silently corrupt every deep
	 * get/set/delete.
	 */
	it('parses a dot path', () =>
	{
		expect(DataUtils.getSegments('a.b')).toEqual(['a', 'b']);
	});

	it('parses a single digit array index', () =>
	{
		expect(DataUtils.getSegments('phones[0]')).toEqual(['phones', '0']);
	});

	it('parses a multi digit array index', () =>
	{
		expect(DataUtils.getSegments('phones[10]')).toEqual(['phones', '10']);
	});

	it('parses a mixed dot and index path', () =>
	{
		expect(DataUtils.getSegments('a.b[2].c')).toEqual(['a', 'b', '2', 'c']);
	});

	it('parses a bare property', () =>
	{
		expect(DataUtils.getSegments('name')).toEqual(['name']);
	});

	it('blocks prototype polluting segments', () =>
	{
		expect(DataUtils.getSegments('user.__proto__.isAdmin')).toBe(null);
	});

	/**
	 * This documents that the bracket alternative of `deepDataPattern`
	 * (src/modules/data/types/deep-data/data-utils.js:56) is dead code.
	 * The pattern is `/(\w+)|(?:\[(\d)\))/g` — the alternative closes with
	 * `\)` where `\]` was intended, so it can never match a real path.
	 * Paths only parse because the `\w+` alternative happens to catch the
	 * digits inside the brackets, which is also why only capture group 1
	 * is ever populated.
	 */
	it('never matches the bracket alternative of deepDataPattern', () =>
	{
		const pattern = new RegExp(DataUtils.deepDataPattern.source, 'g');
		const groups = [...'phones[10].name'.matchAll(pattern)];

		expect(groups.length).toBe(3);
		for (const match of groups)
		{
			expect(match[1]).not.toBe(undefined);
			expect(match[2]).toBe(undefined);
		}
	});
});

describe('DataUtils segment LRU cache', () =>
{
	it('returns cached values and evicts once over capacity', () =>
	{
		const cache = new LRUCache(2);
		cache.set('a', 1);
		cache.set('b', 2);
		cache.set('c', 3);

		expect(cache.get('a')).toBe(undefined);
		expect(cache.get('b')).toBe(2);
		expect(cache.get('c')).toBe(3);
	});

	it('re-setting a key refreshes its position', () =>
	{
		const cache = new LRUCache(2);
		cache.set('a', 1);
		cache.set('b', 2);
		cache.set('a', 11);
		cache.set('c', 3);

		expect(cache.get('b')).toBe(undefined);
		expect(cache.get('a')).toBe(11);
	});

	/**
	 * DEFECT: `LRUCache.get()`
	 * (src/modules/data/types/deep-data/data-utils.js:15) returns
	 * `this.cache.get(key)` without re-inserting the key, so it never
	 * promotes the entry to most-recently-used. Eviction therefore follows
	 * insertion order (FIFO) rather than recency (LRU), and a hot path read
	 * on every set can still be evicted.
	 */
	it('get() promotes a key so eviction is LRU and not FIFO', () =>
	{
		const cache = new LRUCache(3);
		cache.set('a', 1);
		cache.set('b', 2);
		cache.set('c', 3);

		/* 'a' is now the most recently used entry. */
		cache.get('a');

		/* Adding a fourth entry must evict 'b', the least recently used. */
		cache.set('d', 4);

		expect(cache.get('b')).toBe(undefined);
		expect(cache.get('a')).toBe(1);
	});
});
