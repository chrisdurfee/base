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
	 * This will create a fragment.
	 *
	 * @returns {*}
	 */
	createFrag()
	{
		return '';
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
}