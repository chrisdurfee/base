import { base } from '../../main/base.js';
import { Jot } from "../component/jot.js";
import { Parser } from './element/parser.js';
import { HtmlHelper } from './html-helper.js';

/**
 * Builder
 *
 * This will build JSON layouts.
 *
 * @class
 */
export class Builder
{
	/**
	 * This will render a function/Unit/Component.
	 *
	 * @param {object|function} layout
	 * @param {object} container
	 * @param {object} [parent]
	 * @returns {object|null} The layout Unit, Component, or null.
	 */
	static render(layout, container, parent)
	{
		if (!layout)
		{
			return;
		}

		let component, jot;
		switch (typeof layout)
		{
			case 'object':
				if (layout.isUnit === true)
				{
					this.createComponent(layout, container, parent);
					return layout;
				}
				/* falls through */
			default:
				/**
				 * This will convert the object to a component
				 * and render it.
				 */
				component = Jot(layout);
				jot = new component();
				this.createComponent(jot, container, parent);
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
	static build(obj, container, parent)
	{
		const fragment = HtmlHelper.createDocFragment();

		if (Array.isArray(obj))
		{
			for (var i = 0, length = obj.length; i < length; i++)
			{
				this.buildElement(obj[i], fragment, parent);
			}
		}
		else
		{
			this.buildElement(obj, fragment, parent);
		}

		if (container && typeof container === 'object')
		{
			container.appendChild(fragment);
		}
		return fragment;
	}

	/**
	 * This will rebuild a layout.
	 *
	 * @param {object} layout
	 * @param {object} ele
	 * @param {object} parent
	 * @return {object}
	 */
	static rebuild(layout, ele, parent)
	{
		HtmlHelper.removeAll(ele);
		return this.build(layout, ele, parent);
	}

	/**
	 * This will build an element or component.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {object} container
	 * @param {object} [parent] The component adding the layout.
	 * @return {void}
	 */
	static buildElement(obj, container, parent)
	{
		if (!obj)
		{
			return;
		}

		if (obj.isUnit === true)
		{
			this.createComponent(obj, container, parent);
			return;
		}

		this.createElement(obj, container, parent);
	}

	/**
	 * This will create an element.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {object} container
	 * @param {object} [parent] The component adding the layout.
	 * @return {void}
	 */
	static createElement(obj, container, parent)
	{
		const settings = Parser.parse(obj, parent),
		ele = this.createNode(settings, container, parent);

		const propName = obj.cache;
		if (parent && propName)
		{
			parent[propName] = ele;
		}

		/* we want to recursively add the children to
		the new element */
		const children = settings.children;
		if (children.length > 0)
		{
			let child;
			for (var i = 0, length = children.length; i < length; i++)
			{
				child = children[i];
				if (child === null)
				{
					continue;
				}

				this.buildElement(child, ele, parent);
			}
		}

		const directives = settings.directives;
		if (directives && directives.length)
		{
			this.setDirectives(ele, directives, parent);
		}
	}

	/**
	 * This will add the element directives.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {array} directives
	 * @param {object} parent
	 * @return {void}
	 */
	static setDirectives(ele, directives, parent)
	{
		for (var i = 0, length = directives.length; i < length; i++)
		{
			this.handleDirective(ele, directives[i], parent);
		}
	}

	/**
	 * This will handle an attr directive.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {object} attrDirective
	 * @param {object} parent
	 * @return {void}
	 */
	static handleDirective(ele, attrDirective, parent)
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
		if (parent && propName)
		{
			parent[propName] = ele;
		}
	}

	/**
	 * This will create a component.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {object} container
	 * @param {object} parent
	 * @return {void}
	 */
	static createComponent(obj, container, parent)
	{
		const component = obj;
		component.parent = parent;

		if (parent && parent.persist === true && component.persist !== false)
		{
			component.persist = true;
		}

		if (component.cache && parent)
		{
			parent[component.cache] = component;
		}

		/**
		 * This will set up the component, build the layout, and
		 * call the afterBuild method.
		 */
		component.setup(container);

		const layout = component.prepareLayout();
		this.build(layout, component.container, component);

		component.afterBuild();

		if (obj.component && typeof obj.onCreated === 'function')
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
	static createNode(settings, container, parent)
	{
		const tag = settings.tag;
		if (tag === 'text')
		{
			const child = settings.attr[0];
			const text = (child)? child.value : '';
			return HtmlHelper.createText(text, container);
		}
		else if (tag === 'comment')
		{
			const child = settings.attr[0];
			const text = (child)? child.value : '';
			return HtmlHelper.createComment(text, container);
		}

		return HtmlHelper.create(tag, settings.attr, container, parent);
	}
}

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
		Builder.build(obj, container, parent);
	}
});