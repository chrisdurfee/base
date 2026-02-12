import { Parser } from '../element/parser.js';
import { HtmlToString } from '../html-to-string.js';
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
	 * This will create a component.
	 *
	 * @param {object} component
	 * @param {object} container
	 * @param {object} parent
	 * @returns {*} the build result.
	 */
	createComponent(component, container, parent)
	{
		this.setupComponent(component, container, parent);
		return this.buildComponent(component);
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
			return this.createComponent(obj, {}, parent);
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

		const childrenHtml = settings.children
			.map(child => (child !== null ? this.buildElement(child, parent) : ''))
			.join('');

		return this.createNode(settings, childrenHtml);
	}

	/**
	 * This will create a node.
	 *
	 * @param {object} settings
	 * @param {string} childrenHtml
	 * @returns {object}
	 */
	createNode(settings, childrenHtml)
	{
		const tag = settings.tag;
		if (tag === 'text')
		{
			const child = settings.attr[0];
			const text = (child)? child.value : '';
			return HtmlToString.createText(text);
		}
		else if (tag === 'comment')
		{
			const child = settings.attr[0];
			const text = (child)? child.value : '';
			return HtmlToString.createComment(text);
		}

		return HtmlToString.create(tag, settings.attr, childrenHtml);
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