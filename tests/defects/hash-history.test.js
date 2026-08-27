import { describe, expect, it } from 'vitest';
import { BrowserHistory } from '../../src/modules/router/history/browser-history.js';
import { HashHistory } from '../../src/modules/router/history/hash-history.js';

/**
 * This will create a router stub that records the uri it is asked to match.
 *
 * @returns {{router: object, received: Array<string>}}
 */
const createRouterStub = () =>
{
	const received = [];
	const router =
	{
		locationId: null,
		checkActiveRoutes(uri)
		{
			received.push(uri);
		}
	};

	return { router, received };
};

describe('history uri normalization', () =>
{
	it('browser history passes a pathname style uri to the router', () =>
	{
		const { router, received } = createRouterStub();
		const history = new BrowserHistory(router);
		router.locationId = history.locationId;

		history.check(/** @type {any} */ ({
			state: {
				location: history.locationId,
				uri: '/users/5'
			},
			preventDefault() {},
			stopPropagation() {}
		}));

		expect(received).toEqual(['/users/5']);
	});

	/**
	 * DEFECT: `HashHistory.check()`
	 * (src/modules/router/history/hash-history.js:43) forwards
	 * `evt.newURL`, which the hashchange event defines as the full absolute
	 * URL (e.g. 'http://localhost/#/users/5'). Route patterns are anchored
	 * with '^' against a pathname style uri, which is what
	 * `BrowserHistory.check()`
	 * (src/modules/router/history/browser-history.js:136) passes, so hash
	 * routing can never match anything but a wildcard route.
	 */
	it('hash history passes a pathname style uri to the router', () =>
	{
		const { router, received } = createRouterStub();
		const history = new HashHistory(router);

		history.check(/** @type {any} */ ({
			oldURL: 'http://localhost/',
			newURL: 'http://localhost/#/users/5'
		}));

		expect(received).toEqual(['/users/5']);
	});
});
