import { afterEach, describe, expect, it } from 'vitest';
import { Component } from '../../src/modules/component/component.js';
import { Data } from '../../src/modules/data/data.js';
import { Builder } from '../../src/modules/layout/builder.js';
import { countSubscribers, createContainer, flush, resetBody } from '../helpers.js';

/* Every published entry point registers its directives on import (see
 * src/base.js and src/entries/*.js). Tests import framework modules
 * directly, so the registration has to be requested here. */
import { registerDefaultDirectives } from '../../src/modules/layout/directives/core/default-directives.js';
registerDefaultDirectives();

/**
 * This will build a list of rows.
 *
 * @param {number} count
 * @param {number} generation
 * @returns {Array<object>}
 */
const createRows = (count, generation) =>
{
	const rows = [];
	for (let i = 0; i < count; i++)
	{
		rows.push({ label: `row-${generation}-${i}` });
	}
	return rows;
};

/**
 * This will create a list component rendered through the `for` directive.
 *
 * @param {Array<any>} settings The trailing settings of the `for` directive,
 * after the property name.
 * @returns {typeof Component}
 */
const createList = (settings) =>
{
	return class List extends Component
	{
		/**
		 * @returns {Data}
		 */
		setData()
		{
			return new Data({ items: createRows(3, 0) });
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
						tag: 'ul',
						cache: 'list',
						for: ['items', ...settings]
					}
				]
			};
		}
	};
};

describe('for directive row scoping', () =>
{
	afterEach(() =>
	{
		resetBody();
	});

	it('renders one child per row and re-renders on array replacement', async () =>
	{
		const container = createContainer();
		const List = createList([(row) => ({ tag: 'li', text: row.label })]);
		const list = new List();
		Builder.render(list, container);

		expect(list.list.children.length).toBe(3);

		list.data.set('items', createRows(5, 1));
		await flush();

		expect(list.list.children.length).toBe(5);
		expect(list.list.children[0].textContent).toBe('row-1-0');

		list.destroy();
	});

	/**
	 * 4.0 flipped the default: `data.scope(...)` allocates a Data instance
	 * and two link subscriptions per row per render, and most row callBacks
	 * never read it, so nothing is scoped unless the settings ask.
	 */
	it('passes no scoped data by default', async () =>
	{
		const container = createContainer();
		const received = [];
		const List = createList([(row, index, scoped) =>
		{
			received.push(scoped);
			return { tag: 'li', text: row.label };
		}]);

		const list = new List();
		Builder.render(list, container);

		expect(received.length).toBe(3);
		expect(received.every((scoped) => scoped === null)).toBe(true);

		list.destroy();
	});

	it('does not link the parent data when scoping is off', async () =>
	{
		const container = createContainer();
		const List = createList([(row) => ({ tag: 'li', text: row.label })]);
		const list = new List();
		Builder.render(list, container);

		const data = list.data;
		expect(data.links.size).toBe(0);

		for (let generation = 1; generation <= 5; generation++)
		{
			data.set('items', createRows(3, generation));
			await flush();
		}

		expect(data.links.size).toBe(0);

		list.destroy();
	});

	/**
	 * Opting in with `true` restores the pre-4.0 behaviour: the row callBack
	 * receives a Data scoped to `items[i]`.
	 */
	it('passes scoped row data when opted in', async () =>
	{
		const container = createContainer();
		const received = [];
		const List = createList([(row, index, scoped) =>
		{
			received.push(scoped);
			return { tag: 'li', text: row.label };
		}, true]);

		const list = new List();
		Builder.render(list, container);

		expect(received.length).toBe(3);
		expect(received.every((scoped) => scoped instanceof Data)).toBe(true);
		expect(received[1].get('label')).toBe('row-0-1');

		list.destroy();
	});

	/**
	 * DEFECT (fixed in phase 1, held here): every scoped row instance links
	 * back to the parent source, so a re-render that does not release the
	 * previous set grows the parent's subscriber list once per row per
	 * render.
	 */
	it('re-rendering an opted-in list does not grow the parent data subscriber count', async () =>
	{
		const container = createContainer();
		const List = createList([(row) => ({ tag: 'li', text: row.label }), true]);
		const list = new List();
		Builder.render(list, container);

		const data = list.data;

		/* Two renders to reach steady state before sampling. */
		for (let generation = 1; generation <= 2; generation++)
		{
			data.set('items', createRows(3, generation));
			await flush();
		}
		const baseline = countSubscribers(data);

		for (let generation = 3; generation <= 12; generation++)
		{
			data.set('items', createRows(3, generation));
			await flush();
		}
		const after = countSubscribers(data);

		list.destroy();

		expect(after).toBe(baseline);
	});

	/**
	 * DEFECT (fixed in phase 1, held here): same root cause — each scoped
	 * row instance calls `parent.addLink(remoteToken, scoped)`, so the
	 * parent's links map also grows once per row per render.
	 */
	it('re-rendering an opted-in list does not grow the parent data links map', async () =>
	{
		const container = createContainer();
		const List = createList([(row) => ({ tag: 'li', text: row.label }), true]);
		const list = new List();
		Builder.render(list, container);

		const data = list.data;

		data.set('items', createRows(3, 1));
		await flush();
		const baseline = data.links.size;
		expect(baseline).toBeGreaterThan(0);

		for (let generation = 2; generation <= 11; generation++)
		{
			data.set('items', createRows(3, generation));
			await flush();
		}
		const after = data.links.size;

		list.destroy();

		expect(after).toBe(baseline);
	});
});
