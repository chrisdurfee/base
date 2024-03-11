import { base } from '../../main/base.js';
import { Jot } from "../component/jot.js";
import { Parser } from './element/parser.js';
import { HtmlHelper } from './html-helper.js';
import { RenderController } from './render/render-controller.js';

/**
 * This will set up the render engine.
 */
const render = RenderController.setup();

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
			return null;
		}

		if (typeof layout === 'object' && layout.isUnit === true)
		{
            this.createComponent(layout, container, parent);
            return layout;
        }

		const Component = Jot(layout);
        const componentInstance = new Component();
        this.createComponent(componentInstance, container, parent);
        return componentInstance;
	}

	/**
	 * This will build a JSON layout.
	 *
	 * @param {object} obj The JSON layout.
	 * @param {object} [container] The parent receiving the layout.
	 * @param {object} [parent] The component adding the layout.
	 * @returns {object} The doc Frag element.
	 */
	static build(obj, container, parent)
	{
		const fragment = HtmlHelper.createDocFragment();
		const elements = Array.isArray(obj) ? obj : [obj];
        elements.forEach(element => this.buildElement(element, fragment, parent));

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
	 * @returns {object}
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
	 * @returns {void}
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
	 * @returns {void}
	 */
	static createElement(obj, container, parent)
	{
		const settings = Parser.parse(obj, parent),
		ele = this.createNode(settings, container, parent);

		this.cache(ele, obj.cache, parent);

		/* we want to recursively add the children to
		the new element */
		settings.children.forEach(child =>
		{
            if (child !== null)
			{
                this.buildElement(child, ele, parent);
            }
        });

		const directives = settings.directives;
		if (directives && directives.length)
		{
			this.setDirectives(ele, directives, parent);
		}
	}

	/**
	 * This will add the element directives.
	 *
	 * @param {object} ele
	 * @param {array} directives
	 * @param {object} parent
	 * @returns {void}
	 */
	static setDirectives(ele, directives, parent)
	{
		directives.forEach(directive =>
		{
            this.handleDirective(ele, directive, parent);
        });
	}

	/**
	 * This will handle an attr directive.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {object} attrDirective
	 * @param {object} parent
	 * @returns {void}
	 */
	static handleDirective(ele, attrDirective, parent)
	{
		attrDirective.directive.callBack(ele, attrDirective.attr.value, parent);
	}

	/**
	 * This will cache an element ot the parent.
	 *
	 * @param {object} ele
	 * @param {object} propName
	 * @param {object} parent
	 */
	static cache(ele, propName, parent)
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
	 * @returns {void}
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
	 * @returns {object}
	 */
	static createNode(settings, container, parent)
	{
		return render.createNode(settings, container, parent);
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
	 * @returns {object}
	 */
	buildLayout(obj, container, parent)
	{
		Builder.build(obj, container, parent);
	}
});