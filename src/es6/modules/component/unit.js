import {base} from '../../core.js';
import {builder} from '../layout/layout-builder.js';
import {dataBinder} from '../data-binder/data-binder.js';

/* this will register the component system to the
data tracker to remove components that have been
nested in layouts. */
base.dataTracker.addType('components', (data) =>
{
	if(!data)
	{
		return;
	}

	let component = data.component;
	if(component && component.rendered === true)
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
 * var Alert = base.Unit.extend(
 *	{
 *		constructor: function(props)
 *		{
 *			// this will setup the component id
 *			base.Component.call(this, props);
 *		},
 *
 *		render: function()
 *		{
 *			return {
 *
 *			};
 *		}
 *	});
 */
export class Unit
{
	/**
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
	 * @protected
	 */
	init()
	{
		this.id = 'cp-' + (unitNumber++);
	}

	/**
	 * This will setup the component props.
	 *
	 * @param {object} [props]
	 */
	setupProps(props)
	{
		if(!props || typeof props !== 'object')
		{
			return false;
		}

		for(var prop in props)
		{
			if(props.hasOwnProperty(prop))
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
		if(!this.parent)
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
		let parentContext = this.getParentContext();
		let context = this.setContext(parentContext);
		if(context)
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
		let parentContext = this.context;
		let context = this.addContext(parentContext);
		if(!context)
		{
			return;
		}

		let branchName = context[0];
		if(!branchName)
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
	 * @returns {void}
	 */
	removeContext()
	{
		if(!this.addingContext)
		{
			return;
		}

		this.removeContextBranch(this.contextBranchName);
	}

	/**
	 * This will remove a context branch.
	 *
	 * @param {string} branch
	 * @returns {void}
	 */
	removeContextBranch(branch)
	{
		if(!branch)
		{
			return;
		}

		delete this.context[branch];
	}

	/**
	 * This will get the context.
	 *
	 * @returns {object|null}
	 */
	getContext()
	{
		return this.context;
	}

	/**
	 * override this to do something when created.
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
		if(!layout)
		{
			return layout;
		}

		if(!layout.id)
		{
			layout.id = this.getId();
		}

		layout.cache = 'panel';
		return layout;
	}

	/**
	 * This will create the component layout.
	 * @protected
	 * @return {object}
	 */
	_createLayout()
	{
		if(this.persist)
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
		let layout = this._createLayout();
		return this._cacheRoot(layout);
	}

	/**
	 * This will build the layout.
	 * @protected
	 */
	buildLayout()
	{
		let layout = this.prepareLayout();
		this.build(layout, this.container);

		base.dataTracker.add(this.panel, 'components',
		{
			component: this
		});

		this.rendered = true;
	}

	/**
	 * This will build a layout.
	 *
	 * @param {object} layout
	 * @param {object} container
	 * @return {object}
	 */
	build(layout, container)
	{
		return builder.build(layout, container, this);
	}

	/**
	 * This will prepend layout to a container.
	 *
	 * @param {object} layout
	 * @param {object} container
	 * @param {object} [optionalNode]
	 */
	prepend(layout, container, optionalNode)
	{
		var frag = this.build(layout, null);
		builder.prepend(container, frag, optionalNode);
	}

	/**
	 * This will rebuild a layout.
	 *
	 * @param {object} layout
	 * @param {object} container
	 * @return {object}
	 */
	rebuild(layout, container)
	{
		return builder.rebuild(container, layout, this);
	}

	/**
	 * This will render the content on condition of a property.
	 *
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
	 * @param {array} items
	 * @param {function} callBack
	 * @returns {array}
	 */
	map(items, callBack)
	{
		let children = [];
		if(!items || items.length < 1)
		{
			return children;
		}

		for(var i = 0, length = items.length; i < length; i++)
		{
			var item = callBack(items[i], i);
			children.push(item);
		}
		return children;
	}

	/**
	 * This will remove children from an element.
	 *
	 * @param {object} layout
	 * @param {object} container
	 * @return {object}
	 */
	removeAll(ele)
	{
		return builder.removeAll(ele);
	}

	/**
	 * This will cache an element when its created by
	 * saving a reference to it as a property on the
	 * component.
	 *
	 * @param {string} propName The name to use as
	 * the reference.
	 * @param {object} layout
	 * @param {function} [callBack]
	 * @return {object}
	 */
	cache(propName, layout, callBack)
	{
		if(!layout || typeof layout !== 'object')
		{
			return false;
		}

		if(layout.isUnit === true)
		{
			layout =
			{
				component: layout
			};
		}

		layout.onCreated = (element) =>
		{
			this[propName] = element;

			if(typeof callBack === 'function')
			{
				callBack(element);
			}
		};
		return layout;
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
		if(typeof id === 'string')
		{
			mainId += '-' + id;
		}
		return mainId;
	}

	/**
	 * This will initialize the component.
	 * @protected
	 */
	initialize()
	{
		this.setupContext();
		this.beforeSetup();
		this.buildLayout();
		this.afterSetup();
	}

	/**
	 * override this to do something before setup.
	 */
	beforeSetup()
	{

	}

	/**
	 * override this to do something after setup.
	 */
	afterSetup()
	{

	}

	/**
	 * This will setup and render the component.
	 * @param {object} container
	 */
	setup(container)
	{
		this.container = container;
		this.initialize();
	}

	/**
	 * This will remove the component.
	 * @protected
	 */
	remove()
	{
		this.prepareDestroy();
		this.removeContext();

		let panel = this.panel || this.id;
		builder.removeElement(panel);
	}

	/**
	 * This will prepare the component to be destroyed.
	 */
	prepareDestroy()
	{
		this.rendered = false;
		this.beforeDestroy();
	}

	/**
	 * Override this to do something before destroy.
	 */
	beforeDestroy()
	{

	}

	/**
	 * This will destroy the component.
	 */
	destroy()
	{
		this.remove();
	}

	/**
	 * This will bind and element to data.
	 *
	 * @param {object} element
	 * @param {object} data
	 * @param {string} prop
	 * @param {function} filter
	 */
	bindElement(element, data, prop, filter)
	{
		if(element)
		{
			dataBinder.bind(element, data, prop, filter);
		}
	}
}