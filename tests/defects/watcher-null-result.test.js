import { afterEach, describe, expect, it } from 'vitest';
import { Component } from '../../src/modules/component/component.js';
import { Data } from '../../src/modules/data/data.js';
import { Builder } from '../../src/modules/layout/builder.js';
import { createContainer, flush, resetBody } from '../helpers.js';

/* Every published entry point registers the default directives as a side
 * effect (see src/base.js and src/entries/*.js). Tests import framework
 * modules directly, so the registration has to be requested here. */
import '../../src/modules/layout/directives/core/default-directives.js';

/**
 * A host element with static children and a watcher callback that always
 * returns null (i.e. "nothing to render, leave the element alone").
 */
class NullOnMount extends Component
{
	/**
	 * @returns {Data}
	 */
	setData()
	{
		return new Data({ flag: false });
	}

	/**
	 * @returns {object}
	 */
	render()
	{
		return {
			tag: 'div',
			children: [
				{
					tag: 'div',
					cache: 'host',
					onSet: ['flag', () => null],
					children: [
						{ tag: 'span', class: 'keep', text: 'keep me' }
					]
				}
			]
		};
	}
}

/**
 * A host element whose watcher renders a layout while the flag is true and
 * returns null once it is false.
 */
class NullOnUpdate extends Component
{
	/**
	 * @returns {Data}
	 */
	setData()
	{
		return new Data({ flag: true });
	}

	/**
	 * @returns {object}
	 */
	render()
	{
		return {
			tag: 'div',
			children: [
				{
					tag: 'div',
					cache: 'host',
					onSet: ['flag', (value) => (value === true) ? { tag: 'span', class: 'built' } : null]
				}
			]
		};
	}
}

describe('watcher callback returning null', () =>
{
	afterEach(() =>
	{
		resetBody();
	});

	it('rebuilds the element when the callback returns a layout object', () =>
	{
		const container = createContainer();
		const host = new NullOnUpdate();
		Builder.render(host, container);

		expect(host.host.querySelectorAll('.built').length).toBe(1);

		host.destroy();
	});

	/**
	 * DEFECT: `updateElement` (src/modules/layout/directives/core/dom-methods.js:151)
	 * switches on `typeof result`, and `typeof null === 'object'`, so a
	 * callback returning null falls into `case 'object'` and reaches
	 * `Builder.rebuild(null, ele, parent)`. `rebuild` calls `removeAll`
	 * first, which wipes every child of the element.
	 */
	it.fails('leaves static children intact when the callback returns null on mount', () =>
	{
		const container = createContainer();
		const host = new NullOnMount();
		Builder.render(host, container);

		const children = host.host.children.length;
		host.destroy();

		expect(children).toBe(1);
	});

	/**
	 * DEFECT: same root cause — src/modules/layout/directives/core/dom-methods.js:151.
	 */
	it.fails('leaves previously built content intact when the callback returns null on update', async () =>
	{
		const container = createContainer();
		const host = new NullOnUpdate();
		Builder.render(host, container);

		host.data.set('flag', false);
		await flush();

		const built = host.host.querySelectorAll('.built').length;
		host.destroy();

		expect(built).toBe(1);
	});
});
