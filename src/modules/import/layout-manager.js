import { Builder } from '../layout/builder.js';

/**
 * This will check if an object is a contructor.
 *
 * @param {object|function} object
 * @returns {boolean}
 */
const isConstructor = (object) =>
{
    if (!object)
    {
        return false;
    }

    return (typeof object?.prototype?.constructor === 'function');
};

/**
 * LayoutManager
 *
 * This will process the layout for the component or atom.
 *
 * @class
 */
export class LayoutManager
{
	/**
	 * Processes and configures a layout from a module.
	 *
	 * @param {object} module
	 * @param {object} config
	 * @returns {object|null}
	 */
	static process(module, config)
	{
		let layout = module.default;
		if (!layout)
		{
			return null;
		}

		if (config.callback)
		{
			return config.callback(layout);
		}

		if (isConstructor(layout))
		{
			layout = new layout();
		}
		else
		{
			layout = layout();
		}

		if (layout.isUnit === true)
		{
			layout.route = config.route;

			if (config.persist)
			{
				layout.persist = true;
			}
		}

		return layout;
	}

    /**
     * This will render the layout to the DOM.
     *
     * @param {object} layout
     * @param {object} element
     * @param {object} parent
     * @return {object|null}
     */
    static render(layout, element, parent)
	{
		const fragment = Builder.build(layout, null, parent);
		const firstChild = fragment.firstChild || layout?.panel;
		element.after(fragment);
		return firstChild;
	}
}