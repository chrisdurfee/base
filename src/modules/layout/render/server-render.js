import { Parser } from '../element/parser.js';
import { Render } from './render.js';

/**
 * ServerRender
 *
 * This will render the layout on the server.
 *
 * @class
 */
export class ServerRender extends Render
{
	/**
	 * This will render the layout
	 *
	 * @param {object} obj The JSON layout.
	 * @param {object} [container] The parent receiving the layout.
	 * @param {object} [parent] The component adding the layout.
	 * @returns {*} The layout result
	 */
	build(obj, container, parent)
	{
		const elements = Array.isArray(obj) ? obj : [obj];
		return elements.map(element => this.buildElement(element, parent)).join('');
	}

	/**
   * This will build an element or component and return an HTML string.
   *
   * @protected
   * @param {object} obj
   * @param {object} [parent] The component adding the layout.
   * @returns {*}
   */
	buildElement(obj, parent)
	{
		if (!obj)
		{
			return '';
		}

		if (obj.isUnit === true)
		{
			return this.createComponent(obj, parent);
		}

		return this.createElement(obj, parent);
	}

	/**
   * This will create an element and return an HTML string.
   *
   * @protected
   * @param {object} obj
   * @param {object} [parent] The component adding the layout.
   * @returns {string} The HTML string.
   */
	createElement(obj, parent)
	{
		const settings = Parser.parse(obj, parent);
		let elementHtml = this.createNode(settings, parent);

		// Recursively add children elements
		const childrenHtml = settings.children
			.map(child => (child !== null ? this.buildElement(child, parent) : ''))
			.join('');

		elementHtml += childrenHtml;

		const directives = settings.directives;
		if (directives && directives.length)
		{
			this.setDirectives(settings, directives, parent);
		}

		return elementHtml;
	}

	/**
	 * This will handle attributes for elements.
	 *
	 * @param {object} ele
	 * @param {array} directives
	 * @param {object} parent
	 * @returns {void}
	 */
	setDirectives(ele, directives, parent)
	{

	}

	/**
	 * This will create a node.
	 *
	 * @param {object} settings
	 * @param {object} container
	 * @param {object} parent
	 * @returns {object}
	 */
	createNode(settings, container, parent)
	{
		const tag = settings.tag;
		if (tag === 'text')
		{
			const child = settings.attr[0];
			const text = (child)? child.value : '';
		}
		else if (tag === 'comment')
		{
			const child = settings.attr[0];
			const text = (child)? child.value : '';
		}
	}

	/**
	 * This will remove all the children from an element.
	 *
	 * @param {object} ele
	 * @returns {void}
	 */
	removeAll(ele)
	{

	}
}