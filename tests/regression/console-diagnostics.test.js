import { afterEach, describe, expect, it, vi } from 'vitest';
import { Component } from '../../src/modules/component/component.js';
import { Builder } from '../../src/modules/layout/builder.js';
import { getRouter, setRouter } from '../../src/modules/router/router-registry.js';
import { createContainer, resetBody } from '../helpers.js';

/* Every published entry point registers its directives on import (see
 * src/base.js and src/entries/*.js). Tests import framework modules
 * directly, so the registration has to be requested here. */
import { registerDefaultDirectives } from '../../src/modules/layout/directives/core/default-directives.js';
registerDefaultDirectives();

/**
 * Two pieces of console output are contractual rather than incidental, and
 * both would be silently removed by an esbuild `drop: ['console']`.
 *
 *   - `getRouter` (src/modules/router/router-registry.js:34) uses
 *     `console.error` as the documented diagnostic for a routing directive
 *     used without a router. documents/4.0-migration.md:112 promises "the
 *     directives log an error and no-op". Dropping the log leaves only the
 *     no-op, which is the "silently rendering nothing" the guide says this
 *     replaced.
 *   - `debug` (src/modules/layout/directives/core/debug.js:9) is a directive
 *     whose entire output is four `console.log` calls. Dropping them turns it
 *     into a no-op that still looks registered.
 *
 * Nothing else notices: the suite passes, the build succeeds and the bundle
 * gets smaller, which is exactly the shape of a change that looks like a win.
 *
 * This file must not import src/modules/router/router.js, or anything that
 * does — it calls `setRouter` for its own singleton at import time, which is
 * the state under test here.
 */

/**
 * A host component that hands a route to the `route` directive.
 */
class RoutingHost extends Component
{
	/**
	 * @returns {object}
	 */
	render()
	{
		return {
			tag: 'div',
			cache: 'hostEle',
			route: {
				uri: '/never-reached',
				component: null
			}
		};
	}
}

/**
 * A host component that hands a group to the `switch` directive.
 */
class SwitchHost extends Component
{
	/**
	 * @returns {object}
	 */
	render()
	{
		return {
			tag: 'div',
			cache: 'hostEle',
			switch: [
				{ uri: '/never-reached', component: null }
			]
		};
	}
}

/**
 * A host component with a child carrying the `debug` directive.
 */
class DebugHost extends Component
{
	/**
	 * @returns {object}
	 */
	render()
	{
		return {
			tag: 'div',
			children: [
				{ tag: 'span', debug: true }
			]
		};
	}
}

describe('router registry diagnostic', () =>
{
	afterEach(() =>
	{
		resetBody();

		/* The registry is module state; leave it as this file found it. */
		setRouter(null);
	});

	it('starts with no router registered in this module graph', () =>
	{
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

		expect(getRouter()).toBeNull();
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('logs an error naming both import paths when no router is registered', () =>
	{
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

		getRouter();

		expect(spy).toHaveBeenCalledTimes(1);
		const message = String(spy.mock.calls[0][0]);
		expect(message).toContain('No router has been registered');
		expect(message).toContain('@base-framework/base');
		expect(message).toContain('@base-framework/base/router');
	});

	it('logs the error when the route directive is used with no router', () =>
	{
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const container = createContainer();
		const host = new RoutingHost();

		Builder.render(host, container);

		expect(spy).toHaveBeenCalled();
		expect(String(spy.mock.calls[0][0])).toContain('No router has been registered');

		host.destroy();
	});

	it('still renders the element the route directive was on', () =>
	{
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const container = createContainer();
		const host = new RoutingHost();

		Builder.render(host, container);

		expect(container.querySelector('div')).not.toBeNull();

		host.destroy();
	});

	it('logs the error when the switch directive is used with no router', () =>
	{
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const container = createContainer();
		const host = new SwitchHost();

		Builder.render(host, container);

		expect(spy).toHaveBeenCalled();
		expect(String(spy.mock.calls[0][0])).toContain('No router has been registered');

		host.destroy();
	});

	it('does not log once a router is registered', () =>
	{
		const stub = { add: () => ({}), addSwitch: () => 1, removeRoute: () => {}, removeSwitch: () => {} };
		setRouter(stub);

		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

		expect(getRouter()).toBe(stub);
		expect(spy).not.toHaveBeenCalled();
	});
});

describe('debug directive output', () =>
{
	afterEach(() =>
	{
		resetBody();
	});

	it('logs when the debug directive is used', () =>
	{
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const container = createContainer();
		const host = new DebugHost();

		Builder.render(host, container);

		expect(spy).toHaveBeenCalled();

		host.destroy();
	});

	/**
	 * Four calls, not "some output": the directive's whole purpose is dumping
	 * the element, the data, the layout and the parent, and losing any one of
	 * them makes it useless without making it look broken.
	 */
	it('logs the element, the data, the layout and the parent', () =>
	{
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const container = createContainer();
		const host = new DebugHost();

		Builder.render(host, container);

		expect(spy).toHaveBeenCalledTimes(4);

		const labels = spy.mock.calls.map((call) => String(call[0]));
		expect(labels).toEqual(['Debug: ', 'Data: ', 'Layout: ', 'parent: ']);

		host.destroy();
	});

	it('logs the element the directive was on and its parent component', () =>
	{
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const container = createContainer();
		const host = new DebugHost();

		Builder.render(host, container);

		const span = container.querySelector('span');
		const elementCall = spy.mock.calls.find((call) => call[0] === 'Debug: ');
		const parentCall = spy.mock.calls.find((call) => call[0] === 'parent: ');

		expect(elementCall[2]).toBe(span);
		expect(parentCall[1]).toBe(host);

		host.destroy();
	});
});
