import {base} from '../../core.js';
import {ElementParser} from './element-parser.js';
import {dataBinder} from '../data-binder/data-binder.js';
import {Directives} from './directives.js';
import {Html} from './html.js';
import {WatcherHelper} from './watcher-helper.js';

const parser = new ElementParser();

/**
 * LayoutBuilder
 *
 * This will build JSON layouts.
 *
 * @class
 * @augments Html
 */
export class LayoutBuilder extends Html
{
	constructor()
	{
		super();
		this.registerDirectives();
	}

	registerDirectives()
	{
		const directives = Directives;

		directives.add('cache', this.cache.bind(this));
		directives.add('bind', this.bindElement.bind(this));
		directives.add('onCreated', this.onCreated.bind(this));
		directives.add('route', this.addRoute.bind(this));
		directives.add('switch', this.addSwitch.bind(this));
		directives.add('onState', this.onState.bind(this));
		directives.add('onSet', this.onSet.bind(this));
		directives.add('watch', this.watch.bind(this));
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

		if(obj.component || obj.isComponent === true)
		{
			this.createComponent(obj, container, parent);
		}
		else
		{
			this.createElement(obj, container, parent);
		}
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
		let settings = parser.parse(obj),
		ele = this.createNode(settings, container);

		const directives = settings.directives;
		if(directives && directives.length)
		{
			this.setDirectives(ele, directives, parent);
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
	}

	/**
	 * This will add the element directives.
	 *
	 * @param {object} ele
	 * @param {array} directives
	 * @param {object} parent
	 */
	setDirectives(ele, directives, parent)
	{
		for(var i = 0, length = directives.length; i < length; i++)
		{
			this.handleDirective(ele, directives[i], parent);
		}
	}

	/**
	 * This will handle an attr directive.
	 *
	 * @param {object} ele
	 * @param {object} attrDirective
	 * @param {object} parent
	 */
	handleDirective(ele, attrDirective, parent)
	{
		attrDirective.directive.callBack(ele, attrDirective.attr.value, parent);
	}

	/**
	 * This will be called when an element onCreated directive is called.
	 *
	 * @param {object} ele
	 * @param {function} callBack
	 * @param {object} parent
	 */
	onCreated(ele, callBack, parent)
	{
		callBack(ele);
	}

	/**
	 * This will cache an element ot the parent.
	 *
	 * @param {object} ele
	 * @param {object} propName
	 * @param {object} parent
	 */
	cache(ele, propName, parent)
	{
		if(parent && propName)
		{
			parent[propName] = ele;
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
				if(parent && result.isComponent === true && parent.persist === true && parent.state)
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
	 * @return {object}
	 */
	createNode(settings, container)
	{
		let tag = settings.tag;
		if(tag !== 'text')
		{
			return this.create(tag, settings.attr, settings.content, container);
		}

		let attr = settings.attr,
		text = attr.textContent || attr.text;
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