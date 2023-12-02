import { DataTracker } from '../../main/data-tracker/data-tracker.js';
import { Html } from '../html/html.js';

/**
 * This will register the component system to the data
 * tracker to remove components that have been nested
 * in layouts.
 */
DataTracker.addType('components', (data) =>
{
	if (!data)
	{
		return;
	}

	const component = data.component;
	if (component && component.rendered === true)
	{
		component.prepareDestroy();
	}
});

let unitNumber = 0;

/**
 * Unit
 *
 * @class
 *
 * This will allow units to be extended
 * from a single factory.
 *
 * @example
 * class Alert extends Unit
 *	{
 *		render()
 *		{
 *			return {
 *
 *			};
 *		}
 *	}
 */
export class Unit
{
	/**
	 * This will create a unit.
	 *
	 * @constructor
	 * @param {object} [props]
	 */
	constructor(props)
	{
		/**
		 * @param {bool} isUnit
		 */
		this.isUnit = true;

		this.init();
		this.setupProps(props);
		this.onCreated();

		this.rendered = false;
		this.container = null;
	}

	/**
	 * This will setup the component number and unique
	 * instance id for the component elements.
	 *
	 * @protected
	 * @returns {void}
	 */
	init()
	{
		this.id = 'cp-' + (unitNumber++);
	}

	/**
	 * This will setup the component props.
	 *
	 * @param {object} [props]
	 * @return {void}
	 */
	setupProps(props)
	{
		if (!props || typeof props !== 'object')
		{
			return;
		}

		for (var prop in props)
		{
			if (props.hasOwnProperty(prop))
			{
				this[prop] = props[prop];
			}
		}
	}

	/**
	 * This will get the parent context.
	 *
	 * @returns {object|null}
	 */
	getParentContext()
	{
		if (!this.parent)
		{
			return null;
		}

		return this.parent.getContext();
	}

	/**
	 * This will set up the context.
	 *
	 * @returns {void}
	 */
	setupContext()
	{
		const parentContext = this.getParentContext();
		const context = this.setContext(parentContext);
		if (context)
		{
			this.context = context;
			return;
		}

		this.context = parentContext;
		this.setupAddingContext();
	}

	/**
	 * This will set up the adding context.
	 *
	 * @returns {void}
	 */
	setupAddingContext()
	{
		const parentContext = this.context;
		const context = this.addContext(parentContext);
		if (!context)
		{
			return;
		}

		const branchName = context[0];
		if (!branchName)
		{
			return;
		}

		this.addingContext = true;
		this.contextBranchName = branchName;
		this.addContextBranch(branchName, context[1]);
	}

	/**
	 * This will add a branch to the context.
	 *
	 * @protected
	 * @param {string} branchName
	 * @param {mixed} value
	 */
	addContextBranch(branchName, value)
	{
		this.context = this.context || {};
		this.context[branchName] = value;
	}

	/**
	 * This will set the component context.
	 *
	 * @param {object|null} context
	 * @returns {object|null}
	 */
	setContext(context)
	{
		return null;
	}

	/**
	 * This will add context to the parent context.
	 *
	 * @param {object|null} context
	 * @return {array|null}
	 */
	addContext(context)
	{
		return null;
	}

	/**
	 * This will remove the added context from the parent.
	 *
	 * @protected
	 * @returns {void}
	 */
	removeContext()
	{
		if (!this.addingContext)
		{
			return;
		}

		this.removeContextBranch(this.contextBranchName);
	}

	/**
	 * This will remove a context branch.
	 *
	 * @protected
	 * @param {string} branch
	 * @returns {void}
	 */
	removeContextBranch(branch)
	{
		if (!branch)
		{
			return;
		}

		delete this.context[branch];
	}

	/**
	 * This will get the context.
	 *
	 * @protected
	 * @returns {object|null}
	 */
	getContext()
	{
		return this.context;
	}

	/**
	 * override this to do something when created.
	 *
	 * @returns {void}
	 */
	onCreated()
	{

	}

	/**
	 * This will render the component.
	 *
	 * @return {object}
	 */
	render()
	{
		return {

		};
	}

	/**
	 * This will cache the layout panel and set the main id.
	 * @param {object} layout
	 * @return {object}
	 */
	_cacheRoot(layout)
	{
		if (!layout)
		{
			return layout;
		}

		if (!layout.id)
		{
			layout.id = this.getId();
		}

		layout.cache = 'panel';
		return layout;
	}

	/**
	 * This will create the component layout.
	 *
	 * @protected
	 * @return {object}
	 */
	_createLayout()
	{
		if (this.persist)
		{
			return this._layout || (this._layout = this.render());
		}

		return this.render();
	}

	/**
	 * This will prepare the layout.
	 *
	 * @protected
	 * @return {object}
	 */
	prepareLayout()
	{
		const layout = this._createLayout();
		return this._cacheRoot(layout);
	}

	/**
	 * This will build the layout.
	 *
	 * @protected
	 * @return {void}
	 */
	afterBuild()
	{
		DataTracker.add(this.panel, 'components',
		{
			component: this
		});

		this.rendered = true;
		this.afterLayout();
	}

	/**
	 * This will activate the post build actions.
	 *
	 * @protected
	 * @return {void}
	 */
	afterLayout()
	{
		this.afterSetup();
	}

	/**
	 * This will render the content on condition of a property.
	 *
	 * @protected
	 * @param {mixed} prop
	 * @param {mixed} content
	 * @returns {object}
	 */
	if(prop, content)
	{
		return (!prop)? null : (content || prop);
	}

	/**
	 * This will map an array to children elements.
	 *
	 * @protected
	 * @param {array} items
	 * @param {function} callBack
	 * @returns {array}
	 */
	map(items, callBack)
	{
		const children = [];
		if (!items || items.length < 1)
		{
			return children;
		}

		for (var i = 0, length = items.length; i < length; i++)
		{
			const item = callBack(items[i], i);
			children.push(item);
		}
		return children;
	}

	/**
	 * This will remove children from an element.
	 *
	 * @protected
	 * @param {object} layout
	 * @param {object} container
	 * @return {object}
	 */
	removeAll(ele)
	{
		return Html.removeAll(ele);
	}

	/**
	 * This will get an id of the component or the full
	 * id that has the component id prepended to the
	 * requested id.
	 *
	 * @param {string} [id]
	 * @return {string}
	 */
	getId(id)
	{
		let mainId = this.id;
		if (typeof id === 'string')
		{
			mainId += '-' + id;
		}
		return mainId;
	}

	/**
	 * This will initialize the component.
	 *
	 * @protected
	 * @returns {void}
	 */
	initialize()
	{
		this.setupContext();
		this.beforeSetup();
	}

	/**
	 * override this to do something before setup.
	 *
	 * @protected
	 * @returns {void}
	 */
	beforeSetup()
	{

	}

	/**
	 * override this to do something after setup.
	 *
	 * @protected
	 * @returns {void}
	 */
	afterSetup()
	{

	}

	/**
	 * This will setup and render the component.
	 *
	 * @param {object} container
	 * @returns {void}
	 */
	setup(container)
	{
		this.container = container;
		this.initialize();
	}

	/**
	 * This will remove the component.
	 *
	 * @protected
	 * @returns {void}
	 */
	remove()
	{
		this.prepareDestroy();
		this.removeContext();

		const panel = this.panel || this.id;
		Html.removeElement(panel);
	}

	/**
	 * This will prepare the component to be destroyed.
	 *
	 * @protected
	 * @returns {void}
	 */
	prepareDestroy()
	{
		this.rendered = false;
		this.beforeDestroy();
	}

	/**
	 * Override this to do something before destroy.
	 *
	 * @protected
	 * @returns {void}
	 */
	beforeDestroy()
	{

	}

	/**
	 * This will destroy the component.
	 *
	 * @returns {void}
	 */
	destroy()
	{
		this.remove();
	}
}