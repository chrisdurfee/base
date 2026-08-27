import { afterEach, describe, expect, it } from 'vitest';
import { Component } from '../../src/modules/component/component.js';
import { Html } from '../../src/modules/html/html.js';
import { Builder } from '../../src/modules/layout/builder.js';
import { createContainer, resetBody } from '../helpers.js';

/* Every published entry point registers the default directives as a side
 * effect (see src/base.js and src/entries/*.js). Tests import framework
 * modules directly, so the registration has to be requested here. */
import '../../src/modules/layout/directives/core/default-directives.js';

/**
 * A host component that owns a context, plus a child element that adds a
 * branch to that context through the `addContext` directive.
 */
class ContextHost extends Component
{
	/**
	 * @returns {object}
	 */
	setContext()
	{
		return {
			theme: 'dark'
		};
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
					tag: 'span',
					cache: 'branchEle',
					addContext: () => ['extra', { value: 1 }]
				}
			]
		};
	}
}

describe('addContext directive', () =>
{
	afterEach(() =>
	{
		resetBody();
	});

	it('adds the branch to the parent context', () =>
	{
		const container = createContainer();
		const host = new ContextHost();
		Builder.render(host, container);

		expect(host.getContext().extra).toEqual({ value: 1 });

		host.destroy();
	});

	/**
	 * DEFECT: `trackContext`
	 * (src/modules/layout/directives/core/context/context-directives.js:101)
	 * registers the DataTracker entry that removes the branch when the
	 * element is destroyed, but it is never called. `addContext`
	 * (src/modules/layout/directives/core/context/context-directives.js:77)
	 * adds the branch and returns, so the branch outlives the element that
	 * created it and keeps its value (and anything it closes over) alive.
	 */
	it('removes the branch when the element that added it is destroyed', () =>
	{
		const container = createContainer();
		const host = new ContextHost();
		Builder.render(host, container);

		Html.removeElement(host.branchEle);

		expect(host.getContext().extra).toBe(undefined);

		host.destroy();
	});
});
