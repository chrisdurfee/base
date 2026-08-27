import { afterEach, describe, expect, it } from 'vitest';
import { Builder } from '../../src/modules/layout/builder.js';
import { createContainer, resetBody } from '../helpers.js';

/* Every published entry point registers the default directives as a side
 * effect (see src/base.js and src/entries/*.js). Tests import framework
 * modules directly, so the registration has to be requested here. */
import '../../src/modules/layout/directives/core/default-directives.js';

describe('Builder.build', () =>
{
	afterEach(() =>
	{
		resetBody();
	});

	it('builds a nested layout object into the DOM', () =>
	{
		const container = createContainer();

		Builder.build({
			tag: 'section',
			class: 'card',
			children: [
				{ tag: 'h1', text: 'Title' },
				{
					tag: 'ul',
					children: [
						{ tag: 'li', text: 'one' },
						{ tag: 'li', text: 'two' }
					]
				}
			]
		}, container);

		const section = container.firstElementChild;
		expect(section.tagName).toBe('SECTION');
		expect(section.className).toBe('card');
		expect(section.children.length).toBe(2);
		expect(section.children[0].tagName).toBe('H1');
		expect(section.children[0].textContent).toBe('Title');
		expect(section.querySelectorAll('li').length).toBe(2);
		expect(section.querySelectorAll('li')[1].textContent).toBe('two');
	});

	it('defaults an untagged layout object to a div', () =>
	{
		const container = createContainer();

		Builder.build({ text: 'bare' }, container);

		expect(container.firstElementChild.tagName).toBe('DIV');
		expect(container.firstElementChild.textContent).toBe('bare');
	});

	it('builds an array of sibling layouts', () =>
	{
		const container = createContainer();

		Builder.build([
			{ tag: 'p', text: 'first' },
			{ tag: 'p', text: 'second' }
		], container);

		expect(container.children.length).toBe(2);
		expect(container.children[1].textContent).toBe('second');
	});

	it('gives buttons a default type of button', () =>
	{
		const container = createContainer();

		Builder.build({ tag: 'button', text: 'Save' }, container);

		expect(container.firstElementChild.getAttribute('type')).toBe('button');
	});

	it('removeAll strips every child', () =>
	{
		const container = createContainer();
		Builder.build({ tag: 'div', children: [{ tag: 'span' }, { tag: 'span' }] }, container);

		const host = container.firstElementChild;
		expect(host.children.length).toBe(2);

		Builder.removeAll(host);

		expect(host.children.length).toBe(0);
	});
});
