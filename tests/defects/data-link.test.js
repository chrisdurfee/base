import { describe, expect, it } from 'vitest';
import { Data } from '../../src/modules/data/data.js';
import { countSubscribers, flush } from '../helpers.js';

/**
 * This will create two linked data sources.
 *
 * `local.remoteLink(remote, 'name')` subscribes `local` to the remote's
 * `name` changes and stores the token in `local.links`.
 *
 * @returns {{local: object, remote: object, token: number}}
 */
const createLinkedPair = () =>
{
	const remote = new Data({ name: 'remote-start' });
	const local = new Data({ name: 'local-start' });
	const token = local.remoteLink(remote, 'name');

	return { local, remote, token };
};

describe('BasicData link teardown', () =>
{
	it('links a remote property so remote changes flow into the local source', async () =>
	{
		const { local, remote } = createLinkedPair();

		remote.set('name', 'changed');
		await flush();

		expect(local.get('name')).toBe('changed');
	});

	/**
	 * DEFECT: `unlink()` (src/modules/data/types/basic-data.js:733) guards
	 * with `Objects.isEmpty(this.links)`, but `links` is a `Map`.
	 * `Objects.isEmpty` (src/shared/objects.js:155) walks own enumerable
	 * keys with `for..in`, which finds nothing on a Map, so it always
	 * returns true and `unlink()` returns before removing anything.
	 */
	it('unlink() removes every remote subscription', async () =>
	{
		const { local, remote } = createLinkedPair();

		local.unlink();

		remote.set('name', 'changed-after-unlink');
		await flush();

		expect(local.get('name')).toBe('remote-start');
	});

	/**
	 * DEFECT: same root cause as above — `unlink()` returns early, so the
	 * links map is never drained (src/modules/data/types/basic-data.js:733).
	 */
	it('unlink() empties the links map', () =>
	{
		const { local, remote } = createLinkedPair();

		local.unlink();

		expect(local.links.size).toBe(0);

		/**
		 * The map emptying is not proof on its own: tokens are numeric
		 * pub/sub keys, so an unsubscribe that stringified the token
		 * would leave both callBacks registered while the link record
		 * still disappeared. Both sides are checked directly.
		 */
		expect(countSubscribers(remote)).toBe(0);
		expect(countSubscribers(local)).toBe(0);
	});

	/**
	 * DEFECT: `removeLink(token)` (src/modules/data/types/basic-data.js:757)
	 * calls `data.off(token)`, but the signature is `off(attrName, token)`
	 * (src/modules/data/types/basic-data.js:271). The token is used as the
	 * attribute name, so a bogus `'<token>:change'` message is unsubscribed
	 * and the real subscription survives.
	 */
	it('unlink(token) removes the single subscription for that token', async () =>
	{
		const { local, remote, token } = createLinkedPair();

		local.unlink(token);

		remote.set('name', 'changed-after-unlink');
		await flush();

		expect(local.get('name')).toBe('remote-start');
	});

	/**
	 * DEFECT: `removeLink()` unsubscribes the wrong message, so the remote
	 * keeps the callback registered (src/modules/data/types/basic-data.js:757).
	 */
	it('unlink(token) releases the subscriber on the remote source', () =>
	{
		const { local, remote, token } = createLinkedPair();
		const before = countSubscribers(remote);

		local.unlink(token);

		expect(countSubscribers(remote)).toBe(before - 1);
	});

	it('removeLink() still drops the token from the local links map', () =>
	{
		const { local, token } = createLinkedPair();

		local.removeLink(token);

		expect(local.links.has(token)).toBe(false);
	});
});
