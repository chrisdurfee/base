import { HtmlHelper } from '../html-helper.js';
import { Render } from './render.js';

/**
 * BrowserRender
 *
 * This will redner the layout in the browser.
 *
 * @class
 */
export class BrowserRender extends Render
{
	/**
	 * This will create a fragment.
	 *
	 * @returns {*}
	 */
	createFrag()
	{
		return HtmlHelper.createDocFragment();
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