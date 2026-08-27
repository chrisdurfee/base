import { afterEach, describe, expect, it } from 'vitest';
import { Component } from '../../src/modules/component/component.js';
import { Data } from '../../src/modules/data/data.js';
import { Builder } from '../../src/modules/layout/builder.js';
import { countSubscribers, createContainer, flush, resetBody } from '../helpers.js';

/* Every published entry point registers the default directives as a side
 * effect (see src/base.js and src/entries/*.js). Tests import framework
 * modules directly, so the registration has to be requested here. */
import '../../src/modules/layout/directives/core/default-directives.js';

/**
 * A component exercising the `[[prop]]` watcher shorthand, an explicit
 * `watch` directive and a two way `bind` on an input.
 */
class Profile extends Component
{
	/**
	 * @returns {Data}
	 */
	setData()
	{
		return new Data({
			name: 'Ada',
			role: 'engineer'
		});
	}

	/**
	 * @returns {object}
	 */
	render()
	{
		return {
			tag: 'div',
			children: [
				{ tag: 'h2', cache: 'heading', text: '[[name]]' },
				{ tag: 'p', cache: 'summary', watch: '[[name]] the [[role]]' },
				{ tag: 'input', cache: 'field', bind: 'name' }
			]
		};
	}
}

describe('data binding', () =>
{
	afterEach(() =>
	{
		resetBody();
	});

	it('renders the initial watcher values', () =>
	{
		const container = createContainer();
		const profile = new Profile();
		Builder.render(profile, container);

		expect(profile.heading.textContent).toBe('Ada');
		expect(profile.summary.textContent).toBe('Ada the engineer');

		profile.destroy();
	});

	it('updates a [[prop]] watcher when the data changes', async () =>
	{
		const container = createContainer();
		const profile = new Profile();
		Builder.render(profile, container);

		profile.data.set('name', 'Grace');
		await flush();

		expect(profile.heading.textContent).toBe('Grace');

		profile.destroy();
	});

	it('updates a multi property watcher when either property changes', async () =>
	{
		const container = createContainer();
		const profile = new Profile();
		Builder.render(profile, container);

		profile.data.set('role', 'admiral');
		await flush();

		expect(profile.summary.textContent).toBe('Ada the admiral');

		profile.destroy();
	});

	it('batches repeated sets into a single rendered value', async () =>
	{
		const container = createContainer();
		const profile = new Profile();
		Builder.render(profile, container);

		profile.data.set('name', 'one');
		profile.data.set('name', 'two');
		profile.data.set('name', 'three');
		await flush();

		expect(profile.heading.textContent).toBe('three');

		profile.destroy();
	});

	it('seeds a bound input with the current data value', () =>
	{
		const container = createContainer();
		const profile = new Profile();
		Builder.render(profile, container);

		expect(profile.field.value).toBe('Ada');

		profile.destroy();
	});

	it('pushes data changes into a bound input', async () =>
	{
		const container = createContainer();
		const profile = new Profile();
		Builder.render(profile, container);

		profile.data.set('name', 'Linus');
		await flush();

		expect(profile.field.value).toBe('Linus');

		profile.destroy();
	});

	it('pushes input changes back into the data', async () =>
	{
		const container = createContainer();
		const profile = new Profile();
		Builder.render(profile, container);

		profile.field.value = 'Margaret';
		profile.field.dispatchEvent(new window.Event('input', { bubbles: true }));
		await flush();

		expect(profile.data.get('name')).toBe('Margaret');
		expect(profile.heading.textContent).toBe('Margaret');

		profile.destroy();
	});

	it('registers a stable number of subscribers per mount', () =>
	{
		const container = createContainer();
		const first = new Profile();
		Builder.render(first, container);
		const expected = countSubscribers(first.data);
		first.destroy();

		const second = new Profile();
		Builder.render(second, container);

		expect(countSubscribers(second.data)).toBe(expected);

		second.destroy();
	});
});
