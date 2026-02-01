import { Component } from "../component/component.js";
import { Jot } from "../component/jot.js";
import { Builder } from '../layout/builder.js';
import { Group } from "./group.js";
import { LayoutManager } from "./layout-manager.js";
import { ModuleLoader } from "./module-loader.js";

/**
 * This will create a comment.
 *
 * @param {object} props
 * @returns {object}
 */
const Comment = (props) => ({
	tag: 'comment',
	textContent: 'import placeholder',
	onCreated: props.onCreated
});

/**
 * This will get the promise from the src.
 *
 * @param {object|string} src
 * @returns {Promise}
 */
const getPromise = (src) =>
{
	const type = typeof src
	if (type === 'string')
	{
		return import(src);
	}
	else if (type === 'function')
	{
		return src();
	}
	return src;
};

/**
 * ImportWrapper
 *
 * This will create an import wrapper component that
 * will wrap the comment atom to pass route to the
 * imported layout.
 *
 * @type {typeof Component}
 */
export const ImportWrapper = Jot(
{
	/**
	 * This will declare the component props.
	 *
	 * @returns {void}
	 */
	declareProps()
	{
		/**
		 * @member {boolean}
		 */
		this.loaded = false;

		/**
		 * @member {boolean}
		 */
		this.blockRender = false;
	},

	/**
	 * This will render the import wrapper.
	 *
	 * @returns {object}
	 */
	render()
	{
		/**
		 * This will create a comment atom to be replaced
		 * by the module.
		 */
		return Comment(
		{
			onCreated: (ele) =>
			{
				const src = this.src;
				if (!src)
				{
					return;
				}

				if (this.layout)
				{
					/**
					 * This will cache the layout root to be removed
					 * before the module is destroyed.
					 */
					this.layoutRoot = LayoutManager.render(this.layout, this.panel, this.parent);
					return;
				}

				/**
				 * This will set up a resource group to load the
				 * depends before the module.
				 */
				if (this.depends)
				{
					const group = new Group(() =>
					{
						this.loadAndRender(ele);
					});

					group.addFiles(this.depends);
					return;
				}

				this.loadAndRender(ele);
			}
		});
	},

	/**
	 * This will load the module and render the layout.
	 *
	 * @param {object} ele
	 * @returns {void}
	 */
	loadAndRender(ele)
	{
		this.src = getPromise(this.src);
		ModuleLoader.load(this.src, (module) =>
		{
			this.loaded = true;

			/**
			 * We don't want to render if the render has been blocked
			 * by the destroy method.
			 */
			if (this.blockRender === true)
			{
				this.blockRender = false;
				return;
			}

			const layout = this.layout || LayoutManager.process(module,
			{
				callback: this.callback,
				route: this.route,
				persist: this.persist
			});

			this.layout = layout;

			/**
			 * This will cache the layout root to be removed
			 * before the module is destroyed.
			 */
			this.layoutRoot = LayoutManager.render(layout, ele, this.parent);
		});
	},

	/**
	 * This will check if the layout should be updated.
	 *
	 * @param {object} layout
	 * @returns {boolean}
	 */
	shouldUpdate(layout)
	{
		if (this.updateLayout === true)
		{
			return true;
		}

		return (this.updateLayout = (layout && layout.isUnit && typeof layout.update === 'function'));
	},

	/**
	 * This will update the module layout.
	 *
	 * @param {object} params
	 * @returns {void}
	 */
	updateModuleLayout(params)
	{
		const layout = this.layout;
		if (this.shouldUpdate(layout) && layout)
		{
			layout.update(params);
		}
	},

	/**
	 * This will call if the import is added to a route. This will pass
	 * the update params to the imported layout.
	 *
	 * @param {object} params
	 * @returns {void}
	 */
	update(params)
	{
		if (this.loaded === true)
		{
			this.updateModuleLayout(params);
		}
	},

	/**
	 * This will remove the imported layout when the
	 * comment is being removed.
	 *
	 * @returns {void}
	 */
	destroy()
	{
		if (!this.layoutRoot)
		{
			/**
			 * The layout has been requested to load and now is called
			 * destroy before the module has loaded.
			 *
			 * We will block the render and exit now.
			 */
			this.blockRender = true;
			return;
		}

		this.blockRender = false;
		Builder.removeNode(this.layoutRoot);

		this.layoutRoot = null;
		this.layout = null;
	}
});