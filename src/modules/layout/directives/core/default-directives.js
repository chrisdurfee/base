import {base} from '../../core.js';
import {dataBinder} from '../data-binder/data-binder.js';
import {htmlBuilder, normalizeAttr, removeEventPrefix} from '../html-builder/html-builder.js';
import {Directives} from './directives/directives.js';
import {WatcherHelper} from './watcher-helper.js';

/**
 * LayoutBuilder
 *
 * This will build JSON layouts.
 *
 * @class
 * @augments htmlBuilder
 */
export class LayoutBuilder extends htmlBuilder
{
	/**
	 * This will append a child element to a parent.
	 *
	 * @override
	 * @param {object} parent
	 * @param {object} child
	 */
	append(parent, child)
	{
		parent.appendChild(child);
	}

	/**
	 * This will create an element.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {object} container
	 * @param {object} [parent] The component adding the layout.
	 */
	createElement(obj, container, parent)
	{
		let settings = parser.parseElement(obj),
		ele = this.createNode(settings, container, parent);

		const propName = obj.cache;
		if(parent && propName)
		{
			parent[propName] = ele;
		}

		/* we want to recursively add the children to
		the new element */
		let children = settings.children;
		if (children.length > 0)
		{
			let child;
			for (var i = 0, length = children.length; i < length; i++)
			{
				child = children[i];
				if(child === null)
				{
					continue;
				}

				this.buildElement(child, ele, parent);
			}
		}

		this.addElementDirectives(ele, obj, parent);
	}

	/**
	 * This will add the element directives.
	 *
	 * @param {object} ele
	 * @param {object} obj
	 * @param {object} [parent]
	 */
	addElementDirectives(ele, obj, parent)
	{
		if(typeof obj.onCreated === 'function')
		{
			obj.onCreated(ele, parent);
		}

		/* this will check to bind the element to
		the prop of a data */
		let bind = obj.bind;
		if(bind)
		{
			this.bindElement(ele, bind, parent);
		}

		if(obj.route)
		{
			this.addRoute(ele, obj.route, parent);
		}

		if(obj.switch)
		{
			this.addSwitch(ele, obj.switch, parent);
		}

		if(obj.html)
		{
			this.addHtml(ele, obj.html);
		}

		if(obj.useContext)
		{
			this.useContext(ele, obj.useContext, parent);
		}

		if(obj.addContext)
		{
			this.addContext(ele, obj.addContext, parent);
		}

		if(obj.context)
		{
			this.context(ele, obj.context, parent);
		}

		if(obj.role)
		{
			this.addRole(ele, obj.role, parent);
		}

		if(obj.aria)
		{
			this.addAria(ele, obj.aria, parent);
		}

		if(parent)
		{
			let onState = obj.onState;
			if(onState && onState.length)
			{
				this.onState(ele, onState, parent);
			}

			let onSet = obj.onSet;
			if(onSet && onSet.length)
			{
				this.onSet(ele, onSet, parent);
			}

			let map = obj.map;
			if(map && map.length)
			{
				this.map(ele, map, parent);
			}

			let forBind = obj.for;
			if(forBind && forBind.length)
			{
				this.for(ele, forBind, parent);
			}

			let useParent = obj.useParent;
			if(useParent)
			{
				this.useParent(ele, useParent, parent);
			}

			let useData = obj.useData;
			if(useData)
			{
				this.useData(ele, useData, parent);
			}

			let useState = obj.useState;
			if(useState)
			{
				this.useState(ele, useState, parent);
			}

			let addState = obj.addState;
			if(addState)
			{
				this.addState(ele, addState, parent);
			}
		}

		if(obj.watch)
		{
			this.watch(ele, obj.watch, parent);
		}
	}

	/**
	 * This will get the data source from the parent component.
	 *
	 * @protected
	 * @param {object} [parent]
	 * @return {(object|boolean)}
	 */
	_getDataSource(parent)
	{
		if(!parent)
		{
			return false;
		}

		if(parent.data)
		{
			return parent.data;
		}

		if(parent.context && parent.context.data)
		{
			return parent.context.data;
		}

		if(parent.state)
		{
			return parent.state;
		}

		return false;
	}

	/**
	 * This will bind an element to data.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {(string|array)} bind
	 * @param {*} parent
	 */
	bindElement(ele, bind, parent)
	{
		let data, prop, filter;

		if(typeof bind === 'string')
		{
			data = this._getDataSource(parent);
			if(!data)
			{
				return false;
			}

			prop = bind;
		}
		else if(Array.isArray(bind))
		{
			if((typeof bind[0] !== 'object'))
			{
				let dataSource = this._getDataSource(parent);
				if(!dataSource)
				{
					return false;
				}
				else
				{
					bind.unshift(dataSource);
				}
			}

			[data, prop, filter] = bind;
		}

		dataBinder.bind(ele, data, prop, filter);
	}

	/**
	 * This will add a route.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {(object|array)} route
	 * @param {object} parent
	 */
	addRoute(ele, route, parent)
	{
		if(!route)
		{
			return false;
		}

		if(base.isArray(route))
		{
			for(var i = 0, length = route.length; i < length; i++)
			{
				this.setupRoute(ele, route[i], parent);
			}
		}
		else
		{
			this.setupRoute(ele, route, parent);
		}
	}

	/**
	 * This will setup a route.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {object} route
	 * @param {object} parent
	 */
	setupRoute(ele, route, parent)
	{
		// this will check to resume route
		// if(this.checkResume(route))
		// {
		// 	this.resumeRoute(ele, route.component.route);
		// 	return;
		// }

		route.container = ele;
		route.parent = parent;
		let newRoute = base.router.add(route);

		this.trackRoute(ele, newRoute);
	}

	/**
	 * This will check to resume route.
	 *
	 * @param {object} route
	 */
	checkResume(route)
	{
		return (route && route.component && route.component.route);
	}

	/**
	 * This will resume a route.
	 *
	 * @param {object} ele
	 * @param {object} route
	 */
	resumeRoute(ele, route)
	{
		base.router.resume(route, ele);

		this.trackRoute(ele, route);
	}

	/**
	 * This will track a route.
	 *
	 * @param {object} ele
	 * @param {object} route
	 */
	trackRoute(ele, route)
	{
		base.dataTracker.add(ele, 'routes',
		{
			route
		});
	}

	/**
	 * This will add a switch.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {array} group
	 * @param {object} parent
	 */
	addSwitch(ele, group, parent)
	{
		let route = group[0];
		// this will check to resume switch
		// if(this.checkResume(route))
		// {
		// 	this.resumeSwitch(ele, group);
		// 	return;
		// }

		for(var i = 0, length = group.length; i < length; i++)
		{
			route = group[i];
			route.container = ele;
			route.parent = parent;
		}

		let id = base.router.addSwitch(group);
		this.trackSwitch(ele, id);
	}

	resumeSwitch(ele, group)
	{
		let id = base.router.resumeSwitch(group, ele);
		this.trackSwitch(ele, id);
	}

	/**
	 * This will track a switch.
	 *
	 * @param {object} ele
	 * @param {int} id
	 */
	trackSwitch(ele, id)
	{
		base.dataTracker.add(ele, 'switch',
		{
			id
		});
	}

	/**
	 * This will add aria attributes.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {array} role
	 * @param {object} parent
	 */
	addRole(ele, role, parent)
	{
		if(!role)
		{
			return;
		}

		if(role)
		{
			base.setAttr(ele, 'role', role);
		}
	}

	/**
	 * This will add aria attributes.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {array} attributes
	 * @param {object} parent
	 */
	addAria(ele, attributes, parent)
	{
		if(!attributes)
		{
			return;
		}

		let role = attributes.role;
		if(role)
		{
			base.setAttr(ele, 'role', role);
			attributes.role = null;
		}

		/**
		 * This will setup the onSet callBack.
		 *
		 * @param {string} attr
		 * @return {function}
		 */
		const onSetCallBack = (attr) =>
		{
			return (ele, val) =>
			{
				var text = (val)? "true" : "false";
				base.setAttr(ele, attr, text);
			};
		};

		for(var prop in attributes)
		{
			if(attributes.hasOwnProperty(prop) === false || attributes[prop] === null)
			{
				continue;
			}

			var value = attributes[prop];
			var attr = 'aria-' + prop;

			/* this will setup an onSet to change the attr value
			when the data chnages. */
			if(Array.isArray(value))
			{
				value.push(onSetCallBack(attr));
				this.onSet(ele, value, parent);
			}
			else
			{
				base.setAttr(ele, attr, value);
			}
		}
	}

	/**
	 * This will get the parent context.
	 *
	 * @param {object|null} parent
	 * @returns {object|null}
	 */
	getParentContext(parent)
	{
		return (!parent)? null : parent.getContext();
	}

	/**
	 * This will set the context attributes.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {function} context
	 * @param {object} [parent]
	 */
	context(ele, context, parent)
	{
		if(typeof context !== 'function')
		{
			return;
		}

		let parentContext = this.getParentContext(parent);
		let attributes = context(parentContext);
		if(!attributes)
		{
			return;
		}

		this._addElementAttrs(ele, attributes, parent);
		this.addElementDirectives(ele, attributes, parent);
	}

	/**
	 * This will use the parent context.
	 *
	 * @param {object} ele
	 * @param {function} callBack
	 * @param {object} [parent]
	 * @returns {void}
	 */
	useContext(ele, callBack, parent)
	{
		if(typeof callBack !== 'function')
		{
			return;
		}

		let parentContext = this.getParentContext(parent);
		callBack(parentContext);
	}

	/**
	 * This will add context the parent context.
	 *
	 * @param {object} ele
	 * @param {array} callBack
	 * @param {object} [parent]
	 * @returns {void}
	 */
	addContext(ele, callBack, parent)
	{
		if(typeof callBack !== 'function' || !parent)
		{
			return;
		}

		let parentContext = this.getParentContext(parent);
		let childContext = callBack(parentContext);
		if(!childContext)
		{
			return;
		}

		parent.addContextBranch(childContext[0], childContext[1]);
	}

	/**
	 * This will track the child context on the element.
	 *
	 * @param {object} ele
	 * @param {string} branchName
	 * @param {object} parent
	 */
	trackContext(ele, branchName, parent)
	{
		base.dataTracker.add(ele, 'context',
		{
			branch: branchName,
			parent: parent
		});
	}

	/**
	 * This will add a watcher.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {(array|object)} watcher
	 * @param {object} [parent]
	 */
	watch(ele, watcher, parent)
	{
		if(!watcher)
		{
			return false;
		}

		if(Array.isArray(watcher) && typeof watcher[0] !== 'string')
		{
			for(var i = 0, length = watcher.length; i < length; i++)
			{
				WatcherHelper.setup(ele, watcher[i], parent);
			}
		}
		else
		{
			WatcherHelper.setup(ele, watcher, parent);
		}
	}

	/**
	 * This will pass the parent state to the callBack.
	 *
	 * @param {object} ele
	 * @param {function} callBack
	 * @param {object} parent
	 */
	useParent(ele, callBack, parent)
	{
		if(!callBack || !parent)
		{
			return false;
		}

		callBack(parent, ele);
	}

	/**
	 * This will pass the parent state to the callBack.
	 *
	 * @param {object} ele
	 * @param {function} callBack
	 * @param {object} parent
	 */
	useData(ele, callBack, parent)
	{
		if(!callBack || !parent)
		{
			return false;
		}

		callBack(parent.data, ele);
	}

	/**
	 * This will pass the parent state to the callBack.
	 *
	 * @param {object} ele
	 * @param {function} callBack
	 * @param {object} parent
	 */
	useState(ele, callBack, parent)
	{
		if(!callBack || !parent)
		{
			return false;
		}

		callBack(parent.state, ele);
	}

	/**
	 * This will pass the parent state to the callBack.
	 *
	 * @param {object} ele
	 * @param {function} callBack
	 * @param {object} parent
	 */
	addState(ele, callBack, parent)
	{
		if(!callBack || !parent)
		{
			return false;
		}

		if(parent.stateHelper)
		{
			let state = parent.state;
			let states = callBack(state);
			parent.stateHelper.addStates(states);
		}
	}

	/**
	 * This will map children to the element.
	 *
	 * @param {object} ele
	 * @param {array} settings
	 * @param {object} parent
	 */
	map(ele, settings, parent)
	{
		let items = settings[0];
		if(!items || items.length < 1)
		{
			return;
		}

		let item = settings[1];
		let children = [];
		for(var i = 0, length = items.length; i < length; i++)
		{
			var row = items[i];
			if(!row)
			{
				continue;
			}

			var layout = item(row, i);
			if(layout === null)
			{
				continue;
			}

			children.push(layout);
		}

		return this.build(children, ele, parent);
	}

	/**
	 * This will watch a data attr and update the
	 * children to the element when the attr value is updated.
	 *
	 * @param {object} ele
	 * @param {array} settings
	 * @param {object} parent
	 */
	for(ele, settings, parent)
	{
		let data, prop, item, scope;

		if(settings.length < 3)
		{
			const parentData = this.getParentSetData(parent);
			if(!parentData)
			{
				return;
			}

			data = parentData;
			prop = settings[0];
			item = settings[1];
			scope = settings[2];
		}
		else
		{
			data = settings[0];
			prop = settings[1];
			item = settings[2];
			scope = settings[3];
		}

		let scopeData = (scope !== false);
		dataBinder.watch(ele, data, prop, (items) =>
		{
			this.removeAll(ele);
			if(!items || items.length < 1)
			{
				return;
			}

			let children = [];
			for(var i = 0, length = items.length; i < length; i++)
			{
				var scoped = (scopeData)? data.scope(prop + '[' + i + ']') : null;
				var layout = item(items[i], i, scoped);
				if(layout === null)
				{
					continue;
				}

				children.push(layout);
			}

			return this.build(children, ele, parent);
		});
	}

	/**
	 * This will add an onState watcher.
	 *
	 * @param {object} ele
	 * @param {array} onState
	 * @param {object} parent
	 */
	onState(ele, onState, parent)
	{
		this.onUpdate(ele, parent.state, onState, parent);
	}

	/**
	 * This will get the parent set data.
	 *
	 * @param {object} parent
	 * @returns {object|null}
	 */
	getParentSetData(parent)
	{
		if(parent.data)
		{
			return parent.data;
		}

		if(parent.context && parent.context.data)
		{
			return parent.context.data;
		}

		return null;
	}

	/**
	 * This will add an onSet watcher.
	 *
	 * @param {object} ele
	 * @param {array} onSet
	 * @param {object} parent
	 */
	onSet(ele, onSet, parent)
	{
		const data = this.getParentSetData(parent);
		this.onUpdate(ele, data, onSet, parent);
	}

	/**
	 * This will setup a data watcher.
	 *
	 * @param {object} ele
	 * @param {object} data
	 * @param {string} prop
	 * @param {(function|object)} callBack
	 * @param {string} parent
	 */
	onUpdate(ele, data, settings, parent)
	{
		let prop,
		callBack,
		update;

		if (Array.isArray(settings[0]))
		{
			for (var i = 0, maxLength = settings.length; i < maxLength; i++)
			{
				var itemSettings = settings[i];
				if (!itemSettings)
				{
					continue;
				}

				this.onUpdate(ele, data, itemSettings, parent);
			}
			return;
		}

		if (settings.length < 3)
		{
			[prop, callBack] = settings;
		}
		else
		{
			[data, prop, callBack] = settings;
		}

		if (!data || !prop)
		{
			return false;
		}

		switch (typeof callBack)
		{
			case 'object':
				update = (value) =>
				{
					this.addClass(ele, callBack, value);
				};
				break;
			case 'function':
				update = (value) =>
				{
					this.updateElement(ele, callBack, prop, value, parent);
				};
				break;
		}

		dataBinder.watch(ele, data, prop, update);
	}

	/**
	 * This will setup a data watcher.
	 *
	 * @private
	 * @param {object} ele
	 * @param {function} callBack
	 * @param {string} value
	 * @param {string} parent
	 */
	updateElement(ele, callBack, prop, value, parent)
	{
		let result = callBack(ele, value, parent);
		switch(typeof result)
		{
			case 'object':
				if(parent && result && result.isUnit === true && parent.persist === true && parent.state)
				{
					let key = prop + ':' + value,
					state = parent.state,
					previousResult = state.get(key);
					if(typeof previousResult !== 'undefined')
					{
						result = previousResult;
					}

					state.set(key, result);
				}
				this.rebuild(ele, result, parent);
				break;
			case 'string':
				this.addHtml(ele, result);
				break;
		}
	}

	/**
	 * This will add or remove a class from an element.
	 *
	 * @param {object} ele
	 * @param {object} stateStyles
	 * @param {*} newValue
	 */
	addClass(ele, stateStyles, newValue)
	{
		for(var prop in stateStyles)
		{
			if(!stateStyles.hasOwnProperty(prop) || !prop)
			{
				continue;
			}

			if(stateStyles[prop] === newValue)
			{
				base.addClass(ele, prop);
			}
			else
			{
				base.removeClass(ele, prop);
			}
		}
	}
}