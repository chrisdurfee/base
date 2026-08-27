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
 * A list rendered through the `for` directive. Scoped row data is left
 * enabled (the default) so `Data.scope()` runs for every row.
 */
class ScopedList extends Component
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
					for: ['items', (row) => ({ tag: 'li', text: row.label })]
				}
			]
		};
	}
}

describe('for directive scoped row data', () =>
{
	afterEach(() =>
	{
		resetBody();
	});

	it('renders one child per row and re-renders on array replacement', async () =>
	{
		const container = createContainer();
		const list = new ScopedList();
		Builder.render(list, container);

		expect(list.list.children.length).toBe(3);

		list.data.set('items', createRows(5, 1));
		await flush();

		expect(list.list.children.length).toBe(5);
		expect(list.list.children[0].textContent).toBe('row-1-0');

		list.destroy();
	});

	/**
	 * DEFECT: the `for` directive calls `data.scope(...)` per row
	 * (src/modules/layout/directives/core/reactive/for-each.js:57).
	 * `scope()` (src/modules/data/types/deep-data/deep-data.js:131)
	 * allocates a Data instance and calls `linkAttr` -> `remoteLink`,
	 * which subscribes to the parent data. Those scoped instances are
	 * never unlinked when the list re-renders (and `unlink()` is broken
	 * anyway — see tests/defects/data-link.test.js), so every re-render
	 * adds another full set of subscribers to the parent source.
	 */
	it.fails('re-rendering the list does not grow the parent data subscriber count', async () =>
	{
		const container = createContainer();
		const list = new ScopedList();
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
	 * DEFECT: same root cause — each scoped row instance calls
	 * `parent.addLink(remoteToken, scoped)`
	 * (src/modules/data/types/basic-data.js:702), so the parent's links
	 * map also grows once per row per render.
	 */
	it.fails('re-rendering the list does not grow the parent data links map', async () =>
	{
		const container = createContainer();
		const list = new ScopedList();
		Builder.render(list, container);

		const data = list.data;

		data.set('items', createRows(3, 1));
		await flush();
		const baseline = data.links.size;

		for (let generation = 2; generation <= 11; generation++)
		{
			data.set('items', createRows(3, generation));
			await flush();
		}

		list.destroy();

		expect(data.links.size).toBe(baseline);
	});
});
