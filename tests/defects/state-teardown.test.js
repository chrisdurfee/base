import { afterEach, describe, expect, it } from 'vitest';
import { Component } from '../../src/modules/component/component.js';
import { Builder } from '../../src/modules/layout/builder.js';
import { StateTarget } from '../../src/modules/state/state-target.js';
import { StateTracker } from '../../src/modules/state/state-tracker.js';
import { createContainer, resetBody } from '../helpers.js';

/* Every published entry point registers the default directives as a side
 * effect (see src/base.js and src/entries/*.js). Tests import framework
 * modules directly, so the registration has to be requested here. */
import '../../src/modules/layout/directives/core/default-directives.js';

/**
 * A component that registers a local state action with a callback.
 * `StateHelper.addAction` (src/modules/component/state-helper.js:292)
 * subscribes the callback via `target.on(actionEvent, callBack)` and
 * throws the returned token away.
 */
class StatefulWidget extends Component
{
	/**
	 * @returns {object}
	 */
	setupStates()
	{
		return {
			open: {
				state: false,
				callBack()
				{

				}
			}
		};
	}

	/**
	 * @returns {object}
	 */
	render()
	{
		return {
			tag: 'div',
			class: 'stateful-widget'
		};
	}
}

describe('state teardown', () =>
{
	afterEach(() =>
	{
		resetBody();
	});

	/**
	 * DEFECT: `BasicData.remove()` (src/modules/data/types/basic-data.js:245)
	 * is an empty placeholder, so `Component.removeStates()`
	 * (src/modules/component/component.js:362) calls `state.remove()` and
	 * releases nothing.
	 */
	it.fails('State.remove() releases the action subscribers', () =>
	{
		const target = new StateTarget('spec-target');
		target.addAction('open', false);
		target.on('open', () => {});

		target.remove();

		expect(target.eventSub.callBacks.size).toBe(0);
	});

	/**
	 * DEFECT: `StateTracker.getTarget()` (src/modules/state/state-tracker.js:38)
	 * inserts into a module-level `targets` Map that is never pruned. Each
	 * component uses its own unique instance id as the target id, and
	 * `Component.removeStates()` (src/modules/component/component.js:362)
	 * never calls `StateTracker.remove()`, so every mounted component
	 * leaves a permanent entry behind.
	 */
	it.fails('StateTracker.targets does not grow with every mount/destroy cycle', () =>
	{
		const container = createContainer();
		const cycles = 200;

		/* Warm up so the first-mount allocations are not counted. */
		for (let i = 0; i < 5; i++)
		{
			const warmUp = new StatefulWidget();
			Builder.render(warmUp, container);
			warmUp.destroy();
		}

		const before = StateTracker.targets.size;

		for (let i = 0; i < cycles; i++)
		{
			const widget = new StatefulWidget();
			Builder.render(widget, container);
			widget.destroy();
		}

		const growth = StateTracker.targets.size - before;
		expect(growth).toBeLessThan(cycles / 10);
	});

	/**
	 * DEFECT: the local action callback registered at
	 * src/modules/component/state-helper.js:292 stores no token, so it can
	 * never be unsubscribed. Combined with the `remove()` placeholder above,
	 * the callback stays registered on the state target forever.
	 */
	it.fails('destroying a component releases its local state action callbacks', () =>
	{
		const container = createContainer();
		const widget = new StatefulWidget();
		Builder.render(widget, container);

		const state = widget.state;
		expect(state.eventSub.callBacks.size).toBeGreaterThan(0);

		widget.destroy();

		expect(state.eventSub.callBacks.size).toBe(0);
	});
});
