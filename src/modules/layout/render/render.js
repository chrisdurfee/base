
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
	 * @returns {*} The layout result.
	 */
	build(obj, container, parent)
	{

	}

	/**
	 * This will set up the component.
	 *
	 * @protected
	 * @param {object} component
	 * @param {object} container
	 * @param {object} parent
	 * @returns {void}
	 */
	setupComponent(component, container, parent)
	{
		/**
		 * We want to set the parent to the component before setting
		 * up the component.
		 */
		const parentScope = parent?.getChildScope();
		component.parent = parentScope;

		/**
		 * We only set the persist if both the parent allows
		 * and the child does not explicitly deny it.
		 */
		if (parentScope && parentScope.persist === true && component.persist !== false)
		{
			component.persist = true;
			component.parent.addPersistedChild(component);
		}

		if (component.cache && parentScope)
		{
			parentScope[component.cache] = component;
		}

		/**
		 * This will set up the component, build the layout, and
		 * call the afterBuild method.
		 */
		component.setup(container);
	}

	/**
	 * This will build a component.
	 *
	 * @protected
	 * @param {object} component
	 * @returns {*}
	 */
	buildComponent(component)
	{
		/**
		 * This will build the layout and return the result.
		 */
		const layout = component.prepareLayout();
		const result = this.build(layout, component.container, component);

		component.afterBuild();

		/**
		 * This will call the onCreated method if it exists.
		 */
		if (component.component && typeof component.onCreated === 'function')
		{
			component.onCreated(component);
		}

		return result;
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
		this.buildComponent(component);

		return component;
	}

	/**
	 * This will add the element directives.
	 *
	 * @param {object} ele
	 * @param {Array<any>} directives
	 * @param {object} parent
	 * @returns {void}
	 */
	setDirectives(ele, directives, parent)
	{

	}

	/**
	 * This will remove a node.
	 *
	 * @param {object} node
	 * @returns {void}
	 */
	removeNode(node)
	{

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