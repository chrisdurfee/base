import { DataTracker } from '../../main/data-tracker/data-tracker.js';
import { Data } from '../data/data.js';
import { Html } from '../html/html.js';
import { StateTarget } from '../state/state-target.js';

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
	if (!component || !component.isUnit)
	{
		return;
	}

	if (component.persistToken && component.parent)
	{
		component.parent.removePersistedChild(component.persistToken);
	}

	if (component.rendered === true)
	{
		component.prepareDestroy();
		component.cleanUpAfterDestroy();
	}
});

/**
 * @type {number} unitNumber
 */
let unitNumber = 0;

/**
 * Unit
 *
 * @class
 *
 * This will allow units to be extended
 * from a single factory.
 *
 * @param {...any} args
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
	 * @param {any} [first]
	 * @param {*} [second]
	 * @param {*} [third]
	 */
	constructor(first, second, third)
	{
		/**
		 * @type {boolean} isUnit
		 */
		this.isUnit = true;

		/**
		 * @type {Data|null} data
		 */
		this.data = null;

		/**
		 * @type {boolean|null} persist
		 */
		this.persist = null;

		/**
		 * @type {?array} nest
		 */
		this.nest = null;

		/**
		 * @type {StateTarget|null} state
		 */
		this.state = null;

		/**
		 * @type {?object} panel
		 */
		this.panel = null;

		/**
		 * @type {?Unit} parent
		 */
		this.parent = null;

		/**
		 * @type {?string} unitType
		 */
		this.unitType = null;

		/**
		 * @type {?string} _classId
		 */
		// @ts-ignore
		this._classId;

		/**
		 * @type {string} id
		 */
		this.id = '';

		/**
		 * @type {Array<any>} cached
		 */
		this.cached = [];

		this.init();

		/**
		 * This will allow the unit to access optional args.
		 */
		let props, children;
		if (first == null)
		{
			props = {};
			children = [];
		}
		else
		{
			const firstType = typeof first;
			if (firstType === 'string' || firstType === 'number')
			{
				props = {};
				children = [{ tag: 'text', textContent: first }];
			}
			else if (Array.isArray(first))
			{
				props = {};
				children = first;
			}
			else
			{
				props = first || {};
				children = (typeof second === 'string') ? [{ tag: 'text', textContent: second }] : second;
			}
		}
		this.setupProps(props);

		/**
		 * @type {Array<any>} children
		 */
		this.children = children || [];
		this.persistedChildren = {};
		this.persistedCount = 0;

		this.onCreated();

		/**
		 * @type {boolean} rendered
		 */
		this.rendered = false;

		/**
		 * @type {?object} container
		 */
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
		// @ts-ignore
		this.unitType = this._classId || this.constructor.name.toLowerCase();
	}

	/**
	 * This will declare the component props.
	 *
	 * @returns {void}
	 */
	declareProps()
	{

	}

	/**
	 * This will add a persisted child.
	 *
	 * @param {object} child
	 * @returns {string}
	 */
	addPersistedChild(child)
	{
		/**
		 * A child may declare a stable `key` (e.g. `{ data, key: 'media' }`).
		 * Positional tokens drift when a persisted parent is not destroyed
		 * but a subtree is rebuilt in isolation (e.g. `UseParent`/`On`
		 * partial rebuilds): each rebuild appends a new child and the
		 * monotonic counter keeps climbing, so the same logical child gets
		 * a different slot every time and never matches its persisted
		 * predecessor. A stable key sidesteps the counter entirely so
		 * resume works across those partial rebuilds.
		 */
		// @ts-ignore
		const key = child.key;

		/**
		 * A `key` alone is not guaranteed to be unique among siblings: many
		 * components reuse the same logical key (e.g. a list's row-identity
		 * field `key: 'id'`), so multiple distinct sibling components of the
		 * same `unitType` would otherwise collide on a single `pk:` token and
		 * resume each other's scope (data, state and persisted children). The
		 * `cache` name is the explicit, per-scope-unique slot a component is
		 * stored under (see the render controller's `parent[cache] = child`),
		 * so it is the most reliable stable identity. We prefer it, fall back
		 * to `key`, and combine the two when both are present so same-key
		 * siblings stay distinct while remaining stable across rebuilds.
		 */
		// @ts-ignore
		const cache = child.cache;
		let token;
		if (cache != null && key != null)
		{
			token = 'pk:' + cache + ':' + key;
		}
		else if (cache != null)
		{
			token = 'pk:' + cache;
		}
		else if (key != null)
		{
			token = 'pk:' + key;
		}
		else
		{
			/**
			 * Tokens are assigned monotonically as `'pc' + count`, so the key
			 * for slot `count` is computed directly. This avoids an O(N)
			 * `Object.keys()` allocation per child (which made the original
			 * implementation O(N^2) across a list).
			 */
			token = 'pc' + (this.persistedCount++);
		}

		/**
		 * Check to see if the child has a persisted state
		 * and if so, resume the scope with the persisted state.
		 */
		const persistedChild = this.persistedChildren[token];
		// @ts-ignore
		if (persistedChild && child.unitType === persistedChild.unitType)
		{
			// @ts-ignore
			child.resumeScope(persistedChild);
		}

		// @ts-ignore
		child.persistToken = token;

		/**
		 * This will add the child to the persisted children
		 * so that it can be resumed later.
		 */
		this.persistedChildren[token] = child;
		return token;
	}

	/**
	 * This will remove a persisted child by its token.
	 *
	 * @param {string} token
	 * @returns {void}
	 */
	removePersistedChild(token)
	{
		if (!this.rendered)
		{
			return;
		}

		if (!token || !this.persistedChildren[token])
		{
			return;
		}

		delete this.persistedChildren[token];
	}

	/**
	 * This will setup the component props.
	 *
	 * @protected
	 * @param {object} [props]
	 * @returns {void}
	 */
	setupProps(props)
	{
		this.declareProps();
		if (!props || typeof props !== 'object')
		{
			return;
		}

		for (let prop in props)
		{
			if (Object.prototype.hasOwnProperty.call(props, prop))
			{
				this[prop] = props[prop];

				/**
				 * When a parent passes `data` (or `state`) directly
				 * as a prop, treat the component as having external
				 * data so the persist/resume merge logic doesn't
				 * clobber the freshly-passed values with persisted
				 * ones from a previous render.
				 */
				if (prop === 'data')
				{
					this._externalData = true;
				}
			}
		}
	}

	/**
	 * This will get the child scope instance of the component.
	 * If the component is transparent, children see through
	 * to the parent scope instead.
	 *
	 * @returns {this}
	 */
	getChildScope()
	{
		return this;
	}

	/**
	 * This will get the parent context.
	 *
	 * @protected
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
	 * @protected
	 * @returns {void}
	 */
	setupContext()
	{
		/**
		 * If resumeScope already restored a context owned by
		 * this component, keep it. Re-running the user's
		 * setContext() would replace the persisted Data
		 * instance and break every binding still subscribed
		 * to it (e.g. xhr writes via parent.context.data
		 * would no longer notify the visible layout).
		 */
		// @ts-ignore
		if (this._contextResumed)
		{
			return;
		}

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
	 * @protected
	 * @returns {void}
	 */
	setupAddingContext()
	{
		const parentContext = this.context;
		// @ts-ignore
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
	 * @param {*} value
	 * @returns {void}
	 */
	addContextBranch(branchName, value)
	{
		this.context ??= {};
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
	 * @returns {array|null}
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

		// @ts-ignore
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
		// @ts-ignore
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
	 * @returns {object}
	 */
	render()
	{
		return {

		};
	}

	/**
	 * This will cache the layout panel and set the main id.
	 *
	 * @protected
	 * @param {object} layout
	 * @returns {object}
	 */
	_cacheRoot(layout)
	{
		if (!layout)
		{
			return layout;
		}

		// @ts-ignore
		if (!layout.id)
		{
			// @ts-ignore
			layout.id = this.getId();
		}

		// @ts-ignore
		layout.cache = 'panel';
		return layout;
	}

	/**
	 * This will create the component layout.
	 *
	 * @protected
	 * @returns {object}
	 */
	_createLayout()
	{
		return this.render();
	}

	/**
	 * This will prepare the layout.
	 *
	 * @protected
	 * @returns {object}
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
	 * @returns {void}
	 */
	afterBuild()
	{
		// @ts-ignore
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
	 * @returns {void}
	 */
	afterLayout()
	{
		this.afterSetup();
	}

	/**
	 * This will render the content on condition of a property.
	 *
	 * @protected
	 * @param {*} prop
	 * @param {*} content
	 * @returns {object|null}
	 */
	if(prop, content)
	{
		return (!prop)? null : (content || prop);
	}

	/**
	 * This will map an array to children elements.
	 *
	 * @protected
	 * @param {Array<any>} items
	 * @param {function} callBack
	 * @returns {Array<any>}
	 */
	map(items, callBack)
	{
		const children = [];
		if (!items || items.length < 1)
		{
			return children;
		}

		for (let i = 0, length = items.length; i < length; i++)
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
	 * @param {object} ele
	 * @returns {object}
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
	 * @returns {string}
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
	 * This will cache an element to the component.
	 *
	 * @param {object} ele
	 * @param {string} propName
	 * @returns {void}
	 */
	cacheEle(ele, propName)
	{
		if (!propName)
		{
			return;
		}

		this[propName] = ele;
		this.cached.push(propName);
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
		this.setContainer(container);
		this.initialize();
	}

	/**
	 * This will set the container.
	 *
	 * @param {object} container
	 * @returns {void}
	 */
	setContainer(container)
	{
		this.container = container;
	}

	/**
	 * This will remove the component.
	 *
	 * @protected
	 * @returns {void}
	 */
	_remove()
	{
		this.prepareDestroy();
		this.removeContext();

		const panel = this.panel;
		if (panel)
		{
			Html.removeElement(panel);
		}

		this.cleanUpAfterDestroy();
	}

	/**
	 * This will clean up after destroy.
	 * @protected
	 * @returns {void}
	 */
	cleanUpAfterDestroy()
	{
		/**
		 * This will clear the panel and container references
		 * to prevent memory leaks.
		 */
		this.panel = null;
		this.container = null;

		/**
		 * This will clear all cached element references
		 * to prevent memory leaks.
		 */
		const cached = this.cached;
		for (let i = 0, len = cached.length; i < len; i++)
		{
			this[cached[i]] = null;
		}
		this.cached = [];

		/**
		 * This will clear the component data if it is not
		 * set to persist to free up memory.
		 */
		if (this.persist !== true)
		{
			this.persistedChildren = {};
			this.persistToken = null;
		}
	}

	/**
	 * This will prepare the component to be destroyed.
	 *
	 * @protected
	 * @returns {void}
	 */
	prepareDestroy()
	{
		this.persistedCount = 0;
		this.rendered = false;

		/**
		 * A user error in beforeDestroy must not prevent the
		 * framework cleanup below from running.
		 */
		try
		{
			this.beforeDestroy();
		}
		catch (error)
		{
			console.error('Error in beforeDestroy:', error);
		}

		/**
		 * This will unlink the data to prevent memory leaks.
		 */
		if (this.data && typeof this.data.unlink === 'function')
		{
			this.data.unlink();
		}
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
		this._remove();
	}
}