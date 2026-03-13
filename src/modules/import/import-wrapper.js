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
 * Cache for import promises keyed by the original src (string or function
 * reference). This ensures the same module is never fetched more than once
 * even when the caller wraps the dynamic import in a new arrow function that
 * is the same stable reference (e.g. from a route definition).
 *
 * Resolved promises are replaced with their module value so the Promise
 * can be garbage-collected.
 *
 * @type {Map<unknown, Promise<unknown>|object>}
 */
const importCache = new Map();

/**
 * This will get the promise from the src.
 *
 * @param {unknown} src
 * @returns {Promise<unknown>}
 */
const getPromise = (src) =>
{
	if (importCache.has(src))
	{
		const cached = importCache.get(src);
		// If we stored the resolved module, wrap it in a resolved promise.
		if (cached && typeof /** @type {*} */ (cached).then !== 'function')
		{
			return Promise.resolve(cached);
		}
		return /** @type {Promise<unknown>} */ (cached);
	}

	const type = typeof src;
	/** @type {Promise<unknown>} */
	let promise;
	if (type === 'string')
	{
		promise = import(/** @type {string} */ (src));
	}
	else if (type === 'function')
	{
		promise = (/** @type {() => Promise<unknown>} */ (src))();
	}
	else
	{
		// Already a Promise – no need to cache, it's a one-off value.
		return /** @type {Promise<unknown>} */ (src);
	}

	// Replace the promise with the resolved module so the Promise object
	// can be garbage-collected and lookups are synchronous on future hits.
	promise.then((module) =>
	{
		importCache.set(src, module);
	});

	importCache.set(src, promise);
	return promise;
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
		 * @type {boolean}
		 */
		this.loaded = false;

		/**
		 * Generation counter incremented on each destroy to
		 * invalidate in-flight load callbacks from a prior lifecycle.
		 *
		 * @type {number}
		 */
		this.generation = 0;
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
		// Capture the current generation so the async callback can detect
		// whether destroy() was called while the import was in-flight.
		const gen = this.generation;

		ModuleLoader.load(getPromise(this.src), (module) =>
		{
			/**
			 * If the generation changed, this instance was destroyed
			 * (and possibly re-created) while we were loading.
			 * Discard the stale callback.
			 */
			if (gen !== this.generation)
			{
				return;
			}

			this.loaded = true;

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
		},
		(error) =>
		{
			if (gen !== this.generation)
			{
				return;
			}

			this.loaded = false;
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
		// Bump generation so any in-flight load callback is discarded.
		this.generation++;

		if (!this.layoutRoot)
		{
			return;
		}

		Builder.removeNode(this.layoutRoot);

		if (this.persist !== true)
		{
			this.layoutRoot = null;
			this.layout = null;
			this.loaded = false;
			this.updateLayout = false;
		}
	}
});