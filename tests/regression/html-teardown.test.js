import { afterEach, describe, expect, it } from 'vitest';
import { DataTracker } from '../../src/main/data-tracker/data-tracker.js';
import { Events } from '../../src/main/events/events.js';
import { Component } from '../../src/modules/component/component.js';
import { Data } from '../../src/modules/data/data.js';
import { Html } from '../../src/modules/html/html.js';
import { Builder } from '../../src/modules/layout/builder.js';
import { countSubscribers, createContainer, flush, resetBody } from '../helpers.js';

/* Every published entry point registers its directives on import (see
 * src/base.js and src/entries/*.js). Tests import framework modules
 * directly, so the registration has to be requested here. */
import { registerDefaultDirectives } from '../../src/modules/layout/directives/core/default-directives.js';
registerDefaultDirectives();

/**
 * @type {number}
 */
let clicks = 0;

/**
 * A component with a watched child that also carries a click handler, so a
 * single teardown covers both the data binding and the event registration.
 */
class Panel extends Component
{
	/**
	 * @returns {Data}
	 */
	setData()
	{
		return new Data({ label: 'start' });
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
					tag: 'section',
					cache: 'root',
					children: [
						{
							tag: 'button',
							cache: 'btn',
							text: '[[label]]',
							click: () =>
							{
								clicks++;
							}
						}
					]
				}
			]
		};
	}
}

describe('Html.removeElement teardown', () =>
{
	afterEach(() =>
	{
		resetBody();
		clicks = 0;
	});

	it('tracks the watcher and the event before removal', () =>
	{
		const container = createContainer();
		const panel = new Panel();
		Builder.render(panel, container);

		expect(countSubscribers(panel.data)).toBe(1);
		expect(DataTracker.has(panel.btn, 'events')).toBe(true);
		expect(Events.getEvents(panel.btn).length).toBe(1);

		panel.btn.click();
		expect(clicks).toBe(1);

		panel.destroy();
	});

	it('unsubscribes the data binding when the element is removed', async () =>
	{
		const container = createContainer();
		const panel = new Panel();
		Builder.render(panel, container);
		const data = panel.data;
		const button = panel.btn;

		Html.removeElement(button);

		expect(countSubscribers(data)).toBe(0);

		data.set('label', 'after-removal');
		await flush();

		expect(button.textContent).toBe('start');

		panel.destroy();
	});

	it('removes the tracked event listener when the element is removed', () =>
	{
		const container = createContainer();
		const panel = new Panel();
		Builder.render(panel, container);
		const button = panel.btn;

		Html.removeElement(button);

		button.click();

		expect(clicks).toBe(0);
		expect(DataTracker.has(button, 'events')).toBe(false);

		panel.destroy();
	});

	it('detaches the element from its container', () =>
	{
		const container = createContainer();
		const panel = new Panel();
		Builder.render(panel, container);
		const root = panel.root;
		const button = panel.btn;

		Html.removeElement(button);

		expect(root.contains(button)).toBe(false);

		panel.destroy();
	});

	it('removeAll tears down every descendant binding', () =>
	{
		const container = createContainer();
		const panel = new Panel();
		Builder.render(panel, container);
		const data = panel.data;

		Html.removeAll(panel.root);

		expect(panel.root.children.length).toBe(0);
		expect(countSubscribers(data)).toBe(0);

		panel.destroy();
	});
});
