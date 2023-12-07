import { HtmlHelper } from '../html-helper.js';
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
	 * This will create a node.
	 *
	 * @param {object} settings
	 * @param {object} container
	 * @param {object} parent
	 * @return {object}
	 */
	createNode(settings, container, parent)
	{
		const tag = settings.tag;
		if (tag === 'text')
		{
			const child = settings.attr[0];
			const text = (child)? child.value : '';
			return HtmlHelper.createText(text, container);
		}
		else if (tag === 'comment')
		{
			const child = settings.attr[0];
			const text = (child)? child.value : '';
			return HtmlHelper.createComment(text, container);
		}

		return HtmlHelper.create(tag, settings.attr, container, parent);
	}
}