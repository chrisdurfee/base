import { Component } from "../component/component.js";
import { Jot } from "../component/jot.js";
import { Builder } from '../layout/builder.js';
import { Group } from "./group.js";

/**
 * This will load the module.
 *
 * @param {Promise} promise
 * @param {function} callBack
 * @returns {void}
 */
const loadModule = (promise, callBack) =>
{
	promise.then(module =>
	{
		if (callBack)
		{
			callBack(module);
		}
	});
};

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
 * This will render the module.
 *
 * @param {object} layout
 * @param {object} ele
 * @param {object} parent
 * @returns {object}
 */
const render = (layout, ele, parent) =>
{
	/**
	 * This will build the layout and return the fragment
	 * to be added to the parent.
	 */
	const frag = Builder.build(layout, null, parent);

	/**
	 * If the component has overriden the container, the component
	 * panel will be the first child.
	 */
	const firstChild = frag.firstChild || layout?.panel;
	ele.after(frag);
	return firstChild;
};

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
	 * This will render the import wrapper.
	 *
	 * @returns {object}
	 */
	render()
	{
		console.log(this, this.layout)

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
	 * This will get the layout.
	 *
	 * @param {object} module
	 * @returns {object|null}
	 */
	getLayout(module)
	{
		let layout = module.default;
		if (!layout)
		{
			return null;
		}

		/**
		 * This will check if the import is using a custom
		 * callback to set up the module.
		 */
		const callBack = this.callBack;
		if (callBack)
		{
			layout = callBack(layout);
		}
		else
		{
			if (isConstructor(layout))
			{
				/**
				 * This will set up the layout as a component and pass
				 * the import props like persist and route.
				 */
				layout = new layout();
			}
			else
			{
				/**
				 * This will set up the layout as an atom.
				 */
				layout = layout();
			}
		}

		if (layout.isUnit === true)
		{
			layout.route = this.route;

			if (this.persist)
			{
				layout.persist = true;
			}
		}

		return (this.layout = layout);
	},

	/**
	 * This will load the module and render the layout.
	 *
	 * @param {object} ele
	 * @returns {void}
	 */
	loadAndRender(ele)
	{
		/**
		 * This will check if the src is a string and import the module.
		 */
		const type = typeof this.src;
		if (type === 'string')
		{
			this.src = import(this.src);
		}
		else if (type === 'function')
		{
			this.src = this.src();
		}

		loadModule(this.src, (module) =>
		{
			this.loaded = true;

			const layout = this.layout || this.getLayout(module);

			/**
			 * This will cache the layout root to be removed
			 * before the module is destroyed.
			 */
			this.layoutRoot = render(layout, ele, this.parent);
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
		if (this.shouldUpdate(layout))
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
			return;
		}

		Builder.removeNode(this.layoutRoot);
	}
});