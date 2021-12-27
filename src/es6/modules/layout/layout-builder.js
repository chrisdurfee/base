import {base} from '../../core.js';
import {LayoutParser} from './layout-parser.js';
import {dataBinder} from '../data-binder/data-binder.js';
import {htmlBuilder, normalizeAttr, removeEventPrefix} from '../html-builder/html-builder.js';
import {WatcherHelper} from './watcher-helper.js';
import {Jot} from "../component/jot.js";

/**
 * This will create a watch element.
 *
 * @param {object} data
 * @param {string} prop
 * @returns {function}
 */
export const Watch = function(data, prop)
{
	return function(callBack)
	{
		return {
			onSet: [data, prop, (ele, value) =>
			{
				return callBack(value);
			}]
		};
	};
};

const parser = new LayoutParser();

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
	 * This will create a new element.
	 *
	 * @override
	 * @param {string} nodeName The node name.
	 * @param {object} attrObject The node attributes.
	 * @param {object} container The node container.
	 * @param {object} parent
	 * @return {object} The new element.
	 */
	create(nodeName, attrObject, container, parent)
	{
		let obj = document.createElement(nodeName);
		this._addElementAttrs(obj, attrObject, parent);
		this.append(container, obj);
		return obj;
	}

	/**
	 * This will add the element attributes.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {object} attrObject
	 * @param {object} parent
	 */
	_addElementAttrs(obj, attrObject, parent)
	{
		/* we want to check if we have attrributes to add */
		if(!attrObject || typeof attrObject !== 'object')
		{
			return false;
		}

		/* we need to add the type if set to stop ie
		from removing the value if set after the value is
		added */
		let type = attrObject.type;
		if(typeof type !== 'undefined')
		{
			base.setAttr(obj, 'type', type);
		}

		/* we want to add each attr to the obj */
		for(var prop in attrObject)
		{
			/* we have already added the type so we need to
			skip if the prop is type */
			if(attrObject.hasOwnProperty(prop) === false || prop === 'type')
			{
				continue;
			}

			var attrPropValue = attrObject[prop];

			/* we want to check to add the attr settings
				by property name */
			if(prop === 'innerHTML')
			{
				obj.innerHTML = attrPropValue;
			}
			else if(prop.substr(4, 1) === '-')
			{
				// this will handle data and aria attributes
				base.setAttr(obj, prop, attrPropValue);
			}
			else
			{
				this.addAttr(obj, prop, attrPropValue, parent);
			}
		}
	}

	/**
	 * This will add an element attribute.
	 *
	 * @param {object} obj
	 * @param {object} attr
	 * @param {string} value
	 */
	addAttr(obj, attr, value, parent)
	{
		if(value === '' || !attr)
		{
			return false;
		}

		/* we want to check to add a value or an event listener */
		let type = typeof value;
		if(type === 'function')
		{
			/* this will add the event using the base events
			so the event is tracked */
			attr = removeEventPrefix(attr);
			base.addListener(attr, obj, function(e)
			{
				value.call(this, e, parent);
			});
		}
		else
		{
			let attrName = normalizeAttr(attr);
			obj[attrName] = value;
		}
	}

	/**
	 * This will render a function/Unit/Component.
	 *
	 * @param {object|function} layout
	 * @param {object} container
	 * @returns {object} The layout Unit or Component
	 */
	render(layout, container)
	{
		if(!layout)
		{
			return;
		}

		switch(typeof layout)
		{
			case 'object':
				if(layout.isUnit === true)
				{
					layout.setup(container);
					return layout;
				}
			default:
				let component = Jot(layout);
				let jot = new component();
				jot.setup(container);
				return jot;
		}
	}

	/**
	 * This will build a JSON layout.
	 *
	 * @param {object} obj The JSON layout.
	 * @param {object} [container] The parent receiving the layout.
	 * @param {object} [parent] The component adding the layout.
	 * @return {object} The doc Frag element.
	 */
	build(obj, container, parent)
	{
		let fragment = this.createDocFragment();

		if (Array.isArray(obj))
		{
			let item;
			for (var i = 0, length = obj.length; i < length; i++)
			{
				item = obj[i];
				this.buildElement(item, fragment, parent);
			}
		}
		else
		{
			this.buildElement(obj, fragment, parent);
		}

		if(container && typeof container === 'object')
		{
			container.appendChild(fragment);
		}
		return fragment;
	}

	/**
	 * This will build an element or component.
	 *
	 * @param {object} obj
	 * @param {object} container
	 * @param {object} [parent] The component adding the layout.
	 */
	buildElement(obj, container, parent)
	{
		if(!obj)
		{
			return;
		}

		if(obj.component || obj.isUnit === true)
		{
			this.createComponent(obj, container, parent);
		}
		else
		{
			this.createElement(obj, container, parent);
		}
	}

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
		ele = this.createNode(settings, container);

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

		if(typeof obj.onCreated === 'function')
		{
			obj.onCreated(ele);
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

		let data = (parent.data || parent.state);
		return data || false;
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

		if(base.isArray(watcher))
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
			var layout = item(items[i], i);
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
		let data, prop, item;

		if(settings.length < 3)
		{
			if(!parent.data)
			{
				return;
			}

			data = parent.data;
			prop = settings[0];
			item = settings[1];
		}
		else
		{
			data = settings[0];
			prop = settings[1];
			item = settings[2];
		}

		base.DataBinder.watch(ele, data, prop, (items) =>
		{
			this.removeAll(ele);
			if(!items || items.length < 1)
			{
				return;
			}

			this.map(ele, items, item, parent);
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
	 * This will add an onSet watcher.
	 *
	 * @param {object} ele
	 * @param {array} onSet
	 * @param {object} parent
	 */
	onSet(ele, onSet, parent)
	{
		this.onUpdate(ele, parent.data, onSet, parent);
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

		if(base.isArray(settings[0]))
		{
			for(var i = 0, maxLength = settings.length; i < maxLength; i++)
			{
				var itemSettings = settings[i];
				if(!itemSettings)
				{
					continue;
				}

				this.onUpdate(ele, data, itemSettings, parent);
			}
			return;
		}

		if(settings.length < 3)
		{
			[prop, callBack] = settings;
		}
		else
		{
			[data, prop, callBack] = settings;
		}

		if(!data || !prop)
		{
			return false;
		}

		switch(typeof callBack)
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
		let result = callBack(ele, value);
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

	/**
	 * This will reset an element innerHTML and rebuild.
	 *
	 * @private
	 * @param {object} ele
	 * @param {object} layout
	 * @param {object} parent
	 */
	rebuild(ele, layout, parent)
	{
		this.removeAll(ele);
		this.build(layout, ele, parent);
	}

	/**
	 * This will create a component.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {object} container
	 * @param {object} parent
	 */
	createComponent(obj, container, parent)
	{
		// this will allow both cached components or native components
		let component = obj.component || obj;
		component.parent = parent;

		if(parent && parent.persist === true && component.persist !== false)
		{
			component.persist = true;
		}

		component.setup(container);

		if(obj.component && typeof obj.onCreated === 'function')
		{
			obj.onCreated(component);
		}
	}

	/**
	 * This will create a node.
	 *
	 * @param {object} settings
	 * @param {object} container
	 * @param {object} parent
	 * @return {object}
	 */
	createNode(settings, container, parent)
	{
		let tag = settings.tag;
		if(tag !== 'text')
		{
			return this.create(tag, settings.attr, container, parent);
		}

		let attr = settings.attr;
		let text = attr.textContent || attr.text;
		return this.createTextNode(text, container);
	}
}

export const builder = new LayoutBuilder();

base.augment(
{
	/**
	 * This will build a JSON layout.
	 *
	 * @param {object} obj
	 * @param {object} [container]
	 * @param {object} [parent]
	 * @return {object}
	 */
	buildLayout(obj, container, parent)
	{
		builder.build(obj, container, parent);
	}
});