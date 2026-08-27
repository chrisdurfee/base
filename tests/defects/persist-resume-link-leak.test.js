import { afterEach, describe, expect, it } from 'vitest';
import { Component } from '../../src/modules/component/component.js';
import { Data } from '../../src/modules/data/data.js';
import { Builder } from '../../src/modules/layout/builder.js';
import { StateTracker } from '../../src/modules/state/state-tracker.js';
import { countSubscribers, createContainer, flush, resetBody } from '../helpers.js';

/* Every published entry point registers its directives on import (see
 * src/base.js and src/entries/*.js). Tests import framework modules
 * directly, so the registration has to be requested here. */
import '../../src/modules/layout/directives/core/default-directives.js';

/**
 * Every child data instance created by a mount cycle, in mount order.
 *
 * @type {Array<object>}
 */
let created = [];

/**
 * This will record a data instance so a test can check what happened
 * to the instances a resume superseded.
 *
 * @param {object} data
 * @returns {object}
 */
const track = (data) =>
{
	created.push(data);
	return data;
};

/**
 * A child that links a parent property from `beforeSetup`, the way the
 * organisms `List` mints its parent link through `setupHasItems()` ->
 * `linkParentData()`.
 *
 * `beforeSetup` is re-run by `initialize()` on every mount, including
 * resumed mounts, so each cycle asks for a new link.
 */
class LinkedChild extends Component
{
	/**
	 * @returns {Data}
	 */
	setData()
	{
		// @ts-ignore
		return track(new Data({ items: null }));
	}

	/**
	 * @returns {void}
	 */
	beforeSetup()
	{
		const parentData = this.parent && this.parent.data;
		if (parentData && this.data)
		{
			this.data.link(parentData, 'items');
		}
	}

	/**
	 * @returns {object}
	 */
	render()
	{
		return {
			tag: 'div',
			class: 'linked-child'
		};
	}
}

/**
 * A child that keeps its persisted data instead of the fresh one.
 */
class RetainedChild extends LinkedChild
{
	/**
	 * @returns {Data}
	 */
	setData()
	{
		// @ts-ignore
		return track(new Data({ items: null }).retainState());
	}
}

/**
 * A child handed its data as a prop, the way a temp component created
 * by `{ data: localVar }` in a layout is. `setData` hands the prop
 * instance back so the fresh instance wins as the reference.
 */
class ExternalChild extends LinkedChild
{
	/**
	 * @returns {Data}
	 */
	setData()
	{
		// @ts-ignore
		return this.data;
	}
}

/**
 * A child with a local state action, used to check that the resume
 * path does not leave superseded state subscriptions behind.
 */
class StatefulChild extends LinkedChild
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
}

/**
 * A child with a DOM event, used to check that a resumed mount does
 * not register its listeners twice.
 */
class EventChild extends LinkedChild
{
	/**
	 * @returns {Array<Array<any>>}
	 */
	setupEvents()
	{
		return [
			['click', this.panel, () => {}]
		];
	}
}

/**
 * A persisted parent whose layout mints a fresh child on every build.
 *
 * The router does the same thing: the cached route unit is destroyed
 * on navigation away (keeping `persist`, its data and its persisted
 * children) and re-rendered on the way back.
 *
 * @param {function} createChild
 * @returns {typeof Component}
 */
const createShell = (createChild) =>
{
	return class Shell extends Component
	{
		/**
		 * @returns {Data}
		 */
		setData()
		{
			// @ts-ignore
			return new Data({ items: [{ label: 'one' }] });
		}

		/**
		 * @returns {object}
		 */
		render()
		{
			const child = createChild();
			child.cache = 'child';

			return {
				tag: 'div',
				children: [
					child
				]
			};
		}
	};
};

/**
 * This will mount a persisted shell.
 *
 * @param {function} createChild
 * @returns {object}
 */
const mountShell = (createChild) =>
{
	const container = createContainer();
	const Shell = createShell(createChild);
	const shell = new Shell({ persist: true });
	Builder.render(shell, container);

	return { shell, container };
};

/**
 * This will destroy and re-mount a persisted shell.
 *
 * @param {object} shell
 * @param {object} container
 * @param {number} cycles
 * @returns {void}
 */
const cycle = (shell, container, cycles) =>
{
	for (let i = 0; i < cycles; i++)
	{
		shell.destroy();
		Builder.render(shell, container);
	}
};

describe('persisted resume link teardown', () =>
{
	afterEach(() =>
	{
		created = [];
		resetBody();
	});

	it('resumes the persisted child scope on re-mount', () =>
	{
		const { shell, container } = mountShell(() => new LinkedChild());

		const firstId = shell.child.id;
		expect(shell.child.persist).toBe(true);

		cycle(shell, container, 1);

		expect(shell.child.id).toBe(firstId);
		expect(created.length).toBe(2);
	});

	/**
	 * DEFECT: `DataResumeHelper._resumeOwned`
	 * (src/modules/component/data-resume-helper.js:310) keeps the fresh
	 * Data instance and merges the persisted stage into it, dropping the
	 * persisted instance. `Unit.prepareDestroy`
	 * (src/modules/component/unit.js:860) skips `unlink()` while
	 * `persist === true`, so the superseded instance's parent
	 * subscription is never released and the parent collects one more
	 * subscriber per mount/destroy cycle.
	 */
	it('does not grow the parent subscriber count per mount/destroy cycle', () =>
	{
		const { shell, container } = mountShell(() => new LinkedChild());
		const parentData = shell.data;

		/* Warm up so first-mount allocations are not counted. */
		cycle(shell, container, 2);
		const baseline = countSubscribers(parentData);

		cycle(shell, container, 20);

		expect(countSubscribers(parentData) - baseline).toBe(0);
	});

	/**
	 * DEFECT: same root cause. `remoteLink`
	 * (src/modules/data/types/basic-data.js:682) records the reverse
	 * direction with `data.addLink(remoteToken, this, ...)`, so the
	 * parent also keeps a strong reference to every superseded child
	 * data instance.
	 */
	it('does not grow the parent links map per mount/destroy cycle', () =>
	{
		const { shell, container } = mountShell(() => new LinkedChild());
		const parentData = shell.data;

		cycle(shell, container, 2);
		const baseline = parentData.links.size;
		expect(baseline).toBeGreaterThan(0);

		cycle(shell, container, 20);

		expect(parentData.links.size).toBe(baseline);
	});

	/**
	 * Map size alone is not proof: link tokens are the numbers handed
	 * out by the pub/sub, so a release that used the wrong key type
	 * would silently no-op. This drives the parent after teardown and
	 * asserts the superseded instances no longer hear it.
	 */
	it('stops propagating parent changes to superseded child data', async () =>
	{
		const { shell, container } = mountShell(() => new LinkedChild());
		const parentData = shell.data;

		cycle(shell, container, 5);

		const live = shell.child.data;
		const superseded = created.filter((data) => data !== live);
		expect(superseded.length).toBe(5);

		const marker = [{ label: 'after-teardown' }];
		parentData.set('items', marker);
		await flush();

		expect(live.get('items')).toBe(marker);
		for (const data of superseded)
		{
			expect(data.get('items')).not.toBe(marker);
		}
	});

	/**
	 * The retainState path keeps the persisted instance instead, so the
	 * link the previous mount created is still live when `beforeSetup`
	 * mints another one on the same instance.
	 */
	it('does not grow the parent subscriber count for retained child data', () =>
	{
		const { shell, container } = mountShell(() => new RetainedChild());
		const parentData = shell.data;

		cycle(shell, container, 2);
		const baseline = countSubscribers(parentData);

		cycle(shell, container, 20);

		expect(countSubscribers(parentData) - baseline).toBe(0);
	});

	/**
	 * The external path (temp components created by `{ data: localVar }`)
	 * supersedes the previous mount's instance the same way.
	 */
	it('does not grow the parent subscriber count for external child data', () =>
	{
		const { shell, container } = mountShell(
			() => new ExternalChild({ data: track(new Data({ items: null })) })
		);
		const parentData = shell.data;

		cycle(shell, container, 2);
		const baseline = countSubscribers(parentData);

		cycle(shell, container, 20);

		expect(countSubscribers(parentData) - baseline).toBe(0);
	});
});

describe('persisted resume semantics', () =>
{
	afterEach(() =>
	{
		created = [];
		resetBody();
	});

	it('resumes the values the child accumulated before teardown', () =>
	{
		const { shell, container } = mountShell(() => new LinkedChild());

		shell.child.data.set('activeFilter', 'archived');

		cycle(shell, container, 3);

		expect(shell.child.data.get('activeFilter')).toBe('archived');
	});

	it('keeps the resumed child linked to the parent in both directions', async () =>
	{
		const { shell, container } = mountShell(() => new LinkedChild());
		const parentData = shell.data;

		cycle(shell, container, 5);

		const fromParent = [{ label: 'from-parent' }];
		parentData.set('items', fromParent);
		await flush();
		expect(shell.child.data.get('items')).toBe(fromParent);

		const fromChild = [{ label: 'from-child' }];
		shell.child.data.set('items', fromChild);
		await flush();
		expect(parentData.get('items')).toBe(fromChild);
	});

	it('keeps the retained instance and its link across resumes', async () =>
	{
		const { shell, container } = mountShell(() => new RetainedChild());
		const parentData = shell.data;

		const first = shell.child.data;
		first.set('activeFilter', 'archived');

		cycle(shell, container, 5);

		expect(shell.child.data).toBe(first);
		expect(shell.child.data.get('activeFilter')).toBe('archived');

		const marker = [{ label: 'retained' }];
		parentData.set('items', marker);
		await flush();

		expect(first.get('items')).toBe(marker);
	});

	it('keeps the external child linked after resuming', async () =>
	{
		const { shell, container } = mountShell(
			() => new ExternalChild({ data: track(new Data({ items: null })) })
		);
		const parentData = shell.data;

		cycle(shell, container, 5);

		const marker = [{ label: 'external' }];
		parentData.set('items', marker);
		await flush();

		expect(shell.child.data.get('items')).toBe(marker);
	});
});

/**
 * The resume path replaces more than the data instance, so the same
 * superseded-instance question is asked of every other resource a
 * mount opens.
 */
describe('persisted resume resource teardown', () =>
{
	afterEach(() =>
	{
		created = [];
		resetBody();
	});

	it('does not grow the state target subscribers per resume', () =>
	{
		const { shell, container } = mountShell(() => new StatefulChild());

		cycle(shell, container, 2);
		const state = shell.child.state;
		const baseline = countSubscribers(state);
		expect(baseline).toBeGreaterThan(0);

		cycle(shell, container, 20);

		expect(shell.child.state).toBe(state);
		expect(countSubscribers(state)).toBe(baseline);
	});

	it('does not grow the tracked state targets per resume', () =>
	{
		const { shell, container } = mountShell(() => new StatefulChild());

		cycle(shell, container, 2);
		const baseline = StateTracker.targets.size;

		cycle(shell, container, 20);

		expect(StateTracker.targets.size).toBe(baseline);
	});

	it('resumes the state value across mounts', () =>
	{
		const { shell, container } = mountShell(() => new StatefulChild());

		shell.child.state.set('open', true);

		cycle(shell, container, 3);

		expect(shell.child.state.get('open')).toBe(true);
	});

	it('does not register the child events twice per resume', () =>
	{
		const { shell, container } = mountShell(() => new EventChild());

		cycle(shell, container, 2);
		const baseline = shell.child.events.events.length;
		expect(baseline).toBe(1);

		cycle(shell, container, 20);

		expect(shell.child.events.events.length).toBe(baseline);
	});
});
