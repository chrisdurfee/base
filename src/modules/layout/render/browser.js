import { Html } from '../html/html.js';

/**
 * Browser
 *
 * This will redner the layout in the browser.
 *
 * @class
 */
export class Browser
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
			const attr = settings.attr;
			const text = attr.textContent || attr.text;
			return Html.createText(text, container);
		}

		if (tag === 'comment')
		{
			const attr = settings.attr;
			const text = attr.text;
			return Html.createComment(text, container);
		}

		return Html.create(tag, settings.attr, container, parent);
	}
}