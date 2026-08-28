import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Builder } from '../../src/modules/layout/builder.js';
import { NavLink } from '../../src/modules/router/nav-link.js';
import { router } from '../../src/modules/router/router.js';
import { createContainer, flush, resetBody } from '../helpers.js';

/* Every published entry point registers its directives on import (see
 * src/base.js and src/entries/*.js). Tests import framework modules
 * directly, so the registration has to be requested here. */
import { registerDefaultDirectives } from '../../src/modules/layout/directives/core/default-directives.js';
registerDefaultDirectives();

/**
 * `NavLink` (src/modules/router/nav-link.js) had no coverage at all, and it is
 * a candidate to stop being a `Component` subclass — the class only exists to
 * render one anchor and toggle one class on it.
 *
 * These pin what it is observably for: the anchor it renders, the attributes
 * that end up on it, and the active class tracking `router.data.path`. They go
 * through `Builder.render` and assert on the DOM rather than on the instance,
 * because the instance shape is the part that may legitimately change.
 */
describe('NavLink rendering', () =>
{
	/**
	 * This will render a link and return its anchor element.
	 *
	 * @param {object} props
	 * @returns {{link: object, anchor: HTMLAnchorElement, container: HTMLElement}}
	 */
	const renderLink = (props) =>
	{
		const container = createContainer();
		const link = new NavLink(props);
		Builder.render(link, container);

		return {
			link,
			anchor: /** @type {HTMLAnchorElement} */ (container.querySelector('a')),
			container
		};
	};

	beforeEach(() =>
	{
		/* The router singleton is module state shared by every link, and the
		 * active class is derived from it. */
		router.data.path = '/';
	});

	afterEach(() =>
	{
		resetBody();
	});

	it('renders an anchor carrying the href', () =>
	{
		const { link, anchor } = renderLink({ href: '/users', text: 'Users' });

		expect(anchor).not.toBeNull();
		expect(anchor.tagName).toBe('A');
		expect(anchor.getAttribute('href')).toBe('/users');
		expect(anchor.textContent).toBe('Users');

		link.destroy();
	});

	it('applies the class prop to the anchor', () =>
	{
		const { link, anchor } = renderLink({ href: '/users', text: 'Users', class: 'nav-item bold' });

		expect(anchor.getAttribute('class')).toContain('nav-item');
		expect(anchor.getAttribute('class')).toContain('bold');

		link.destroy();
	});

	it('accepts className as an alias for class', () =>
	{
		const { link, anchor } = renderLink({ href: '/users', className: 'aliased' });

		expect(anchor.getAttribute('class')).toContain('aliased');

		link.destroy();
	});

	it('renders nested children inside the anchor', () =>
	{
		const { link, anchor } = renderLink({
			href: '/users',
			nest: [
				{ tag: 'span', text: 'icon' },
				{ tag: 'strong', text: 'Users' }
			]
		});

		expect(anchor.querySelector('span').textContent).toBe('icon');
		expect(anchor.querySelector('strong').textContent).toBe('Users');

		link.destroy();
	});

	it('sets data-replace only when replace is requested', () =>
	{
		const plain = renderLink({ href: '/users' });
		expect(plain.anchor.getAttribute('data-replace')).toBeNull();
		plain.link.destroy();

		const replacing = renderLink({ href: '/users', replace: true });
		expect(replacing.anchor.getAttribute('data-replace')).toBe('true');
		replacing.link.destroy();
	});

	/**
	 * `getString` (src/modules/router/nav-link.js:115) drops an object valued
	 * href so the attribute is not stringified to '[object Object]';
	 * `setupWatchers` then adds a watcher that fills it in from the data.
	 */
	it('fills a watched href from its data source instead of stringifying it', async () =>
	{
		router.data.path = '/from-data';
		const { link, anchor } = renderLink({ href: ['[[path]]', router.data] });
		await flush();

		expect(anchor.getAttribute('href')).toBe('/from-data');
		expect(anchor.getAttribute('href')).not.toContain('object');

		router.data.path = '/moved';
		await flush();

		expect(anchor.getAttribute('href')).toBe('/moved');

		link.destroy();
	});

	it('fills watched text from its data source', async () =>
	{
		router.data.path = '/labelled';
		const { link, anchor } = renderLink({ href: '/users', text: ['[[path]]', router.data] });
		await flush();

		expect(anchor.textContent).toBe('/labelled');

		link.destroy();
	});
});

describe('NavLink active state', () =>
{
	/**
	 * This will render a link and settle the initial watcher publish.
	 *
	 * @param {object} props
	 * @returns {Promise<{link: object, anchor: HTMLAnchorElement}>}
	 */
	const renderLink = async (props) =>
	{
		const container = createContainer();
		const link = new NavLink(props);
		Builder.render(link, container);
		await flush();

		return {
			link,
			anchor: /** @type {HTMLAnchorElement} */ (container.querySelector('a'))
		};
	};

	/**
	 * This will move the router and settle the publish batch.
	 *
	 * @param {string} path
	 * @returns {Promise<void>}
	 */
	const navigate = async (path) =>
	{
		router.data.path = path;
		await flush();
	};

	beforeEach(() =>
	{
		router.data.path = '/';
	});

	afterEach(() =>
	{
		resetBody();
	});

	it('adds the active class when the route already matches on render', async () =>
	{
		await navigate('/users');
		const { link, anchor } = await renderLink({ href: '/users', text: 'Users' });

		expect(anchor.classList.contains('active')).toBe(true);

		link.destroy();
	});

	it('does not add the active class when the route does not match', async () =>
	{
		await navigate('/settings');
		const { link, anchor } = await renderLink({ href: '/users', text: 'Users' });

		expect(anchor.classList.contains('active')).toBe(false);

		link.destroy();
	});

	it('adds and removes the active class as the route changes', async () =>
	{
		const { link, anchor } = await renderLink({ href: '/users', text: 'Users' });

		expect(anchor.classList.contains('active')).toBe(false);

		await navigate('/users');
		expect(anchor.classList.contains('active')).toBe(true);

		await navigate('/settings');
		expect(anchor.classList.contains('active')).toBe(false);

		await navigate('/users');
		expect(anchor.classList.contains('active')).toBe(true);

		link.destroy();
	});

	it('uses the activeClass prop instead of the default', async () =>
	{
		const { link, anchor } = await renderLink({ href: '/users', activeClass: 'selected-link' });

		await navigate('/users');

		expect(anchor.classList.contains('selected-link')).toBe(true);
		expect(anchor.classList.contains('active')).toBe(false);

		link.destroy();
	});

	/**
	 * `iSActive` (src/modules/router/nav-link.js:25) is a prefix match that
	 * only accepts a segment boundary after the link path, so '/user' must not
	 * light up on '/users'.
	 */
	it('matches nested routes under the link path but not sibling prefixes', async () =>
	{
		const { link, anchor } = await renderLink({ href: '/user' });

		await navigate('/user/12/profile');
		expect(anchor.classList.contains('active')).toBe(true);

		await navigate('/users');
		expect(anchor.classList.contains('active')).toBe(false);

		link.destroy();
	});

	it('treats a query string and a fragment as segment boundaries', async () =>
	{
		const { link, anchor } = await renderLink({ href: '/user' });

		await navigate('/user?page=2');
		expect(anchor.classList.contains('active')).toBe(true);

		await navigate('/user#top');
		expect(anchor.classList.contains('active')).toBe(true);

		link.destroy();
	});

	it('requires a whole-path match when exact is set', async () =>
	{
		const { link, anchor } = await renderLink({ href: '/user', exact: true });

		await navigate('/user');
		expect(anchor.classList.contains('active')).toBe(true);

		await navigate('/user/12');
		expect(anchor.classList.contains('active')).toBe(false);

		link.destroy();
	});

	/**
	 * A link whose href carries its own query string compares against the full
	 * path (see the cachedMatchPath branch at
	 * src/modules/router/nav-link.js:174), so two links to the same pathname
	 * with different queries do not both light up.
	 */
	it('distinguishes links that differ only by query string', async () =>
	{
		const first = await renderLink({ href: '/list?tab=open' });
		const second = await renderLink({ href: '/list?tab=closed' });

		await navigate('/list?tab=open');

		expect(first.anchor.classList.contains('active')).toBe(true);
		expect(second.anchor.classList.contains('active')).toBe(false);

		first.link.destroy();
		second.link.destroy();
	});

	it('stops tracking the route once destroyed', async () =>
	{
		const { link, anchor } = await renderLink({ href: '/users' });

		await navigate('/users');
		expect(anchor.classList.contains('active')).toBe(true);

		link.destroy();
		await navigate('/settings');

		/* The element is detached; the point is that publishing to a
		 * destroyed link neither throws nor keeps mutating it. */
		expect(anchor.classList.contains('active')).toBe(true);
	});
});
