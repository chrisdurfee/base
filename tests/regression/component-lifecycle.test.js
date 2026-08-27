import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Component } from '../../src/modules/component/component.js';
import { Data } from '../../src/modules/data/data.js';
import { Builder } from '../../src/modules/layout/builder.js';
import { createContainer, resetBody } from '../helpers.js';

/* Every published entry point registers its directives on import (see
 * src/base.js and src/entries/*.js). Tests import framework modules
 * directly, so the registration has to be requested here. */
import { registerDefaultDirectives } from '../../src/modules/layout/directives/core/default-directives.js';
registerDefaultDirectives();

/**
 * @type {Array<string>}
 */
let order = [];

/**
 * A component that records every lifecycle hook it receives.
 */
class Lifecycle extends Component
{
	/**
	 * @returns {Data}
	 */
	setData()
	{
		order.push('setData');
		return new Data({ ready: false });
	}

	/**
	 * @returns {void}
	 */
	onCreated()
	{
		order.push('onCreated');
	}

	/**
	 * @returns {object}
	 */
	setupStates()
	{
		order.push('setupStates');
		return { open: false };
	}

	/**
	 * @returns {void}
	 */
	beforeSetup()
	{
		order.push('beforeSetup');
	}

	/**
	 * @returns {object}
	 */
	render()
	{
		order.push('render');
		return {
			tag: 'div',
			children: [
				{ tag: 'span', cache: 'host', text: 'lifecycle' }
			]
		};
	}

	/**
	 * @returns {Array<Array<any>>}
	 */
	setupEvents()
	{
		order.push('setupEvents');
		return [];
	}

	/**
	 * @returns {void}
	 */
	afterSetup()
	{
		order.push('afterSetup');
	}

	/**
	 * @returns {void}
	 */
	beforeDestroy()
	{
		order.push('beforeDestroy');
	}
}

describe('Component lifecycle', () =>
{
	beforeEach(() =>
	{
		order = [];
	});

	afterEach(() =>
	{
		resetBody();
	});

	it('runs the hooks in a fixed order on mount', () =>
	{
		const container = createContainer();
		const component = new Lifecycle();

		expect(order).toEqual(['onCreated', 'setData']);

		Builder.render(component, container);

		expect(order).toEqual([
			'onCreated',
			'setData',
			'setupStates',
			'beforeSetup',
			'render',
			'setupEvents',
			'afterSetup'
		]);

		component.destroy();
	});

	it('marks the component rendered and caches its panel', () =>
	{
		const container = createContainer();
		const component = new Lifecycle();
		Builder.render(component, container);

		expect(component.rendered).toBe(true);
		expect(component.panel).toBe(container.firstElementChild);
		expect(component.host.tagName).toBe('SPAN');
		expect(container.firstElementChild.textContent).toBe('lifecycle');

		component.destroy();
	});

	it('runs beforeDestroy and clears the cached references on destroy', () =>
	{
		const container = createContainer();
		const component = new Lifecycle();
		Builder.render(component, container);

		order = [];
		component.destroy();

		expect(order).toEqual(['beforeDestroy']);
		expect(component.rendered).toBe(false);
		expect(component.panel).toBe(null);
		expect(component.container).toBe(null);
		expect(component.host).toBe(null);
		expect(container.children.length).toBe(0);
	});

	it('destroys nested child components through the parent panel', () =>
	{
		const container = createContainer();
		const childOrder = [];

		class Child extends Component
		{
			/**
			 * @returns {object}
			 */
			render()
			{
				return { tag: 'span', class: 'child' };
			}

			/**
			 * @returns {void}
			 */
			beforeDestroy()
			{
				childOrder.push('child-destroyed');
			}
		}

		class Parent extends Component
		{
			/**
			 * @returns {object}
			 */
			render()
			{
				return {
					tag: 'div',
					children: [new Child()]
				};
			}
		}

		const parent = new Parent();
		Builder.render(parent, container);

		expect(container.querySelectorAll('.child').length).toBe(1);

		parent.destroy();

		expect(childOrder).toEqual(['child-destroyed']);
		expect(container.children.length).toBe(0);
	});
});
