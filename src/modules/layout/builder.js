import { base } from '../../main/base.js';
import { Jot } from "../component/jot.js";
import { RenderController } from './render/render-controller.js';

/**
 * This will set up the render engine.
 */
const render = RenderController.setup();

/**
 * This will check if the layout is a component.
 *
 * @param {object} layout
 * @returns {boolean}
 */
const isComponent = (layout) => (typeof layout === 'object' && layout.isUnit === true);

/**
 * This will create a Jot component.
 *
 * @param {object} layout
 * @returns {object}
 */
const createJotComponent = (layout) =>
{
	const Component = Jot(layout);
    return new Component();
};

/**
 * Builder
 *
 * This will build JSON layouts.
 *
 * @class
 */
export class Builder
{
	/**
	 * This will render a function/Unit/Component.
	 *
	 * @param {object|function} layout
	 * @param {object} container
	 * @param {object} [parent]
	 * @returns {*} The render result.
	 */
	static render(layout, container, parent)
	{
		if (!layout)
		{
			return null;
		}

		if (!isComponent(layout))
		{
            layout = createJotComponent(layout);
        }

        return render.createComponent(layout, container, parent);
	}

	/**
	 * This will build a JSON layout.
	 *
	 * @param {object} obj The JSON layout.
	 * @param {object} [container] The parent receiving the layout.
	 * @param {object} [parent] The component adding the layout.
	 * @returns {*} The render result.
	 */
	static build(obj, container, parent)
	{
		return render.build(obj, container, parent);
	}

	/**
	 * This will rebuild a layout.
	 *
	 * @param {object} layout
	 * @param {object} ele
	 * @param {object} parent
	 * @returns {object}
	 */
	static rebuild(layout, ele, parent)
	{
		render.removeAll(ele);
		return this.build(layout, ele, parent);
	}

	/**
	 * This will add the element directives.
	 *
	 * @param {object} ele
	 * @param {array} directives
	 * @param {object} parent
	 * @returns {void}
	 */
	static setDirectives(ele, directives, parent)
	{
		render.setDirectives(ele, directives, parent);
	}

	/**
	 * This will create a node.
	 *
	 * @param {object} settings
	 * @param {object} container
	 * @param {object} parent
	 * @returns {object}
	 */
	static createNode(settings, container, parent)
	{
		return render.createNode(settings, container, parent);
	}
}

base.augment(
{
	/**
	 * This will build a JSON layout.
	 *
	 * @param {object} obj
	 * @param {object} [container]
	 * @param {object} [parent]
	 * @returns {object}
	 */
	buildLayout(obj, container, parent)
	{
		Builder.build(obj, container, parent);
	}
});