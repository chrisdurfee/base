import { describe, expect, it } from 'vitest';
import { Model } from '../../src/modules/data/types/model/model.js';
import { ModelService } from '../../src/modules/data/types/model/model-service.js';
import { WatcherHelper } from '../../src/modules/layout/watcher-helper.js';

/**
 * `ModelService.replaceUrl` (src/modules/data/types/model/model-service.js:634)
 * is the only reason the data layer depends on `WatcherHelper`, and it uses
 * exactly two of its methods: `isWatching(url)` to decide whether to bother,
 * and `replaceParams(url, model)` to substitute `[[prop]]` tokens from the
 * model.
 *
 * The plan is to replace that with a small local interpolator, so these pin
 * the current semantics precisely enough that a divergence fails rather than
 * ships. They are deliberately written against the observable result of
 * `replaceUrl` / `getUrl` rather than against `WatcherHelper` itself, so they
 * stay meaningful once the dependency is gone — with one describe block
 * asserting the underlying `isWatching` predicate directly, because the false
 * path is a behaviour (`replaceParams` is never called) and not a value.
 */

/**
 * This will create a service bound to a model.
 *
 * @param {string} url The model's base url.
 * @param {object} [attributes]
 * @returns {object}
 */
const createService = (url, attributes = {}) =>
{
	const Extended = Model.extend({ url });
	const model = new Extended(attributes);
	return new ModelService(model);
};

describe('ModelService [[param]] interpolation', () =>
{
	it('substitutes a single token from the model', () =>
	{
		const service = createService('/api/users/[[id]]', { id: 42 });

		expect(service.replaceUrl('/api/users/[[id]]')).toBe('/api/users/42');
	});

	it('substitutes several tokens in one url', () =>
	{
		const service = createService('/api', { org: 'acme', id: 7 });

		expect(service.replaceUrl('/api/[[org]]/users/[[id]]/detail')).toBe('/api/acme/users/7/detail');
	});

	it('substitutes the same token more than once', () =>
	{
		const service = createService('/api', { id: 3 });

		expect(service.replaceUrl('/api/[[id]]/children/[[id]]')).toBe('/api/3/children/3');
	});

	it('substitutes adjacent tokens without swallowing the text between them', () =>
	{
		const service = createService('/api', { a: 'x', b: 'y' });

		expect(service.replaceUrl('/api/[[a]]-[[b]]')).toBe('/api/x-y');
		expect(service.replaceUrl('/api/[[a]][[b]]')).toBe('/api/xy');
	});

	it('reads a deep path through the dotted key', () =>
	{
		const service = createService('/api', { owner: { team: { id: 'core' } } });

		expect(service.replaceUrl('/api/[[owner.team.id]]')).toBe('/api/core');
	});

	it('reads an array element through the bracket key', () =>
	{
		const service = createService('/api', { items: [{ id: 'first' }, { id: 'second' }] });

		expect(service.replaceUrl('/api/[[items[1].id]]')).toBe('/api/second');
	});

	/**
	 * `replaceParams` (src/modules/layout/watcher-helper.js:149) collapses a
	 * null or undefined value to an empty string rather than to the literal
	 * 'undefined'. It is the difference between requesting '/api/users' and
	 * requesting '/api/users/undefined'.
	 */
	it('collapses a missing property to an empty string', () =>
	{
		const service = createService('/api', { id: 5 });

		expect(service.replaceUrl('/api/users/[[missing]]/detail')).toBe('/api/users//detail');
	});

	it('collapses an explicitly undefined property to an empty string', () =>
	{
		const service = createService('/api', { id: undefined });

		expect(service.replaceUrl('/api/users/[[id]]/detail')).toBe('/api/users//detail');
	});

	it('collapses a null property to an empty string', () =>
	{
		const service = createService('/api', { id: null });

		expect(service.replaceUrl('/api/users/[[id]]/detail')).toBe('/api/users//detail');
	});

	/**
	 * The guard is `!= null`, not truthiness, so a falsy but present value has
	 * to survive. An id of 0 becoming '' would silently retarget the request
	 * at the collection.
	 */
	it('keeps falsy but present values', () =>
	{
		expect(createService('/api', { id: 0 }).replaceUrl('/api/[[id]]/x')).toBe('/api/0/x');
		expect(createService('/api', { flag: false }).replaceUrl('/api/[[flag]]/x')).toBe('/api/false/x');
		expect(createService('/api', { name: '' }).replaceUrl('/api/[[name]]/x')).toBe('/api//x');
	});

	it('returns a url with no tokens unchanged', () =>
	{
		const service = createService('/api', { id: 5 });

		expect(service.replaceUrl('/api/users/detail')).toBe('/api/users/detail');
	});

	/**
	 * `isWatching` only looks for the opening '[[', so an unterminated token
	 * takes the replace path and then matches nothing. The url has to come
	 * back untouched rather than being truncated.
	 */
	it('leaves an unterminated token alone', () =>
	{
		const service = createService('/api', { id: 5 });

		expect(service.replaceUrl('/api/[[id')).toBe('/api/[[id');
		expect(service.replaceUrl('/api/id]]')).toBe('/api/id]]');
	});

	it('leaves an empty token alone by substituting nothing for it', () =>
	{
		const service = createService('/api', { id: 5 });

		expect(service.replaceUrl('/api/[[]]/x')).toBe('/api//x');
	});

	/**
	 * No escaping and no encoding happens anywhere in this path. A value with
	 * a slash or a space in it goes into the url verbatim, which the local
	 * interpolator has to keep doing or every existing service url changes
	 * shape.
	 */
	it('inserts values verbatim without url encoding them', () =>
	{
		expect(createService('/api', { q: 'a b' }).replaceUrl('/api/[[q]]')).toBe('/api/a b');
		expect(createService('/api', { q: 'a/b' }).replaceUrl('/api/[[q]]')).toBe('/api/a/b');
		expect(createService('/api', { q: 'a&b=c' }).replaceUrl('/api/[[q]]')).toBe('/api/a&b=c');
		expect(createService('/api', { q: '%20' }).replaceUrl('/api/[[q]]')).toBe('/api/%20');
	});

	it('stringifies non-string values', () =>
	{
		expect(createService('/api', { id: 12.5 }).replaceUrl('/api/[[id]]')).toBe('/api/12.5');
		expect(createService('/api', { ids: [1, 2] }).replaceUrl('/api/[[ids]]')).toBe('/api/1,2');
	});

	/**
	 * The trailing slash strip lives in `replaceUrl` beside the substitution,
	 * so it is part of the same contract. It is what turns
	 * '/api/users/[[id]]' with no id into '/api/users'.
	 */
	it('strips exactly one trailing slash after substituting', () =>
	{
		const service = createService('/api', { id: 5 });

		expect(service.replaceUrl('/api/users/[[missing]]')).toBe('/api/users');
		expect(service.replaceUrl('/api/users/')).toBe('/api/users');
		expect(service.replaceUrl('/api/users//')).toBe('/api/users/');
	});
});

describe('ModelService getUrl composition', () =>
{
	it('interpolates the model base url when no sub path is given', () =>
	{
		const service = createService('/api/users/[[id]]', { id: 9 });

		expect(service.getUrl('')).toBe('/api/users/9');
	});

	it('interpolates tokens coming from the sub path', () =>
	{
		const service = createService('/api/users', { childId: 4 });

		expect(service.getUrl('/children/[[childId]]')).toBe('/api/users/children/4');
	});

	it('interpolates tokens in both the base url and the sub path', () =>
	{
		const service = createService('/api/orgs/[[org]]', { org: 'acme', id: 11 });

		expect(service.getUrl('/users/[[id]]')).toBe('/api/orgs/acme/users/11');
	});

	it('appends a query sub path without inserting a separator', () =>
	{
		const service = createService('/api/users/[[id]]', { id: 6 });

		expect(service.getUrl('?full=1')).toBe('/api/users/6?full=1');
	});
});

/**
 * `isWatching` decides whether `replaceParams` runs at all. The no-token case
 * is the one path where the current code does no work, and a replacement that
 * always runs the substitution would still return the right string — so the
 * predicate is pinned on its own rather than only through its result.
 */
describe('WatcherHelper.isWatching as used by ModelService', () =>
{
	it('is true only for a string containing an opening token', () =>
	{
		expect(WatcherHelper.isWatching('/api/[[id]]')).toBe(true);
		expect(WatcherHelper.isWatching('/api/[[id')).toBe(true);
		expect(WatcherHelper.isWatching('/api/users')).toBe(false);
		expect(WatcherHelper.isWatching('/api/[id]')).toBe(false);
		expect(WatcherHelper.isWatching('/api/{{id}}')).toBe(false);
	});

	it('is false for a url that is not a string', () =>
	{
		expect(WatcherHelper.isWatching(undefined)).toBe(false);
		expect(WatcherHelper.isWatching(null)).toBe(false);
	});
});
