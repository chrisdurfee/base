
/**
 * Render
 *
 * This will be thase class for a render.
 *
 * @class
 */
export class Render
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

	}

	/**
	 * This will create a component.
	 *
	 * @param {object} obj
	 * @param {object} container
	 * @param {object} parent
	 * @returns {void}
	 */
	createComponent(obj, container, parent)
	{
		const component = obj;
		component.parent = parent;

		if (parent && parent.persist === true && component.persist !== false)
		{
			component.persist = true;
		}

		if (component.cache && parent)
		{
			parent[component.cache] = component;
		}

		/**
		 * This will set up the component, build the layout, and
		 * call the afterBuild method.
		 */
		component.setup(container);

		const layout = component.prepareLayout();
		this.build(layout, component.container, component);

		component.afterBuild();

		if (obj.component && typeof obj.onCreated === 'function')
		{
			obj.onCreated(component);
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