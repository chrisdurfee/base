import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataPubSub } from '../../src/modules/data-binder/data-pub-sub.js';
import { flush } from '../helpers.js';

describe('DataPubSub microtask batching', () =>
{
	/**
	 * @type {DataPubSub}
	 */
	let pubSub;

	beforeEach(() =>
	{
		pubSub = new DataPubSub();
	});

	it('collapses repeated publishes of one message into a single delivery of the last value', async () =>
	{
		const received = [];
		pubSub.on('count', (value) => received.push(value));

		for (let i = 1; i <= 25; i++)
		{
			pubSub.publish('count', i);
		}

		expect(received).toEqual([]);

		await flush();

		expect(received).toEqual([25]);
	});

	it('delivers different messages in publish order', async () =>
	{
		const order = [];
		pubSub.on('a', () => order.push('a'));
		pubSub.on('b', () => order.push('b'));
		pubSub.on('c', () => order.push('c'));

		pubSub.publish('b', 1);
		pubSub.publish('a', 1);
		pubSub.publish('c', 1);

		await flush();

		expect(order).toEqual(['b', 'a', 'c']);
	});

	it('drops publishes for messages that have no subscribers', async () =>
	{
		pubSub.publish('nobody-listening', 1);

		expect(pubSub.updateQueue.size).toBe(0);

		await flush();

		expect(pubSub.updateQueue.size).toBe(0);
	});

	it('delivers a publish made by a subscriber during the flush', async () =>
	{
		const received = [];
		pubSub.on('source', () =>
		{
			pubSub.publish('derived', 'from-source');
		});
		pubSub.on('derived', (value) => received.push(value));

		pubSub.publish('source', 1);
		await flush();

		expect(received).toEqual(['from-source']);
	});

	it('re-entrant publishes settle without losing the final value', async () =>
	{
		const received = [];
		pubSub.on('step', (value) =>
		{
			if (value < 5)
			{
				pubSub.publish('step', value + 1);
			}
			received.push(value);
		});

		pubSub.publish('step', 0);
		await flush();

		expect(received).toEqual([0, 1, 2, 3, 4, 5]);
		expect(pubSub.isFlushing).toBe(false);
		expect(pubSub.updateQueue.size).toBe(0);
	});

	it('publishes immediately when batching is disabled', () =>
	{
		const received = [];
		pubSub.batchingEnabled = false;
		pubSub.on('now', (value) => received.push(value));

		pubSub.publish('now', 1);
		pubSub.publish('now', 2);

		expect(received).toEqual([1, 2]);
	});

	it('off() removes a subscriber and prunes the empty message', async () =>
	{
		const received = [];
		const token = pubSub.on('gone', (value) => received.push(value));

		pubSub.off('gone', token);
		pubSub.publish('gone', 1);
		await flush();

		expect(received).toEqual([]);
		expect(pubSub.callBacks.has('gone')).toBe(false);
	});

	/**
	 * DEFECT: the infinite-loop circuit breaker
	 * (src/modules/data-binder/data-pub-sub.js:407) calls
	 * `this.updateQueue.clear()` when `maxFlushIterations` is exceeded.
	 * Every update queued at that moment is silently discarded, including
	 * updates for messages that have nothing to do with the runaway
	 * cascade, so unrelated subscribers never receive their last value.
	 */
	it.fails('the circuit breaker does not silently drop unrelated queued updates', async () =>
	{
		vi.spyOn(console, 'error').mockImplementation(() => {});

		pubSub.maxFlushIterations = 5;

		const unrelated = [];
		let loops = 0;

		pubSub.on('unrelated', (value) => unrelated.push(value));
		pubSub.on('loop', () =>
		{
			loops++;
			pubSub.publish('loop', loops);
			pubSub.publish('unrelated', loops);
		});

		pubSub.publish('loop', 0);
		await flush();

		expect(unrelated.length).toBe(loops);
	});

	it('the circuit breaker stops the runaway cascade and resets the flush state', async () =>
	{
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		pubSub.maxFlushIterations = 5;
		pubSub.on('loop', (value) => pubSub.publish('loop', value + 1));

		pubSub.publish('loop', 0);
		await flush();

		expect(errorSpy).toHaveBeenCalled();
		expect(pubSub.isFlushing).toBe(false);
		expect(pubSub.flushIterations).toBe(0);
		expect(pubSub.updateQueue.size).toBe(0);
	});
});
