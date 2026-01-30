import { Component } from '../../component/component.js';
import { Parser } from '../element/parser.js';
import { HtmlHelper } from '../html-helper.js';
import { Render } from './render.js';

/**
 * BrowserRender
 *
 * This will redner the layout in the browser.
 *
 * @class
 */
export class BrowserRender extends Render
{
	/**
	 * This will build a JSON layout.
	 *
	 * @override
	 * @param {object} obj The JSON layout.
	 * @param {object} [container] The parent receiving the layout.
	 * @param {object} [parent] The component adding the layout.
	 * @returns {*} The doc Frag element.
	 */
	build(obj, container, parent)
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
	 * This will build an element or component.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {object} container
	 * @param {object} [parent] The component adding the layout.
	 * @returns {void}
	 */
	buildElement(obj, container, parent)
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
	createElement(obj, container, parent)
	{
		/**
		 * If there is data or state bindings, we want to
		 * create a temporary component to handle those
		 * bindings and nest the layout inside of it.
		 */
		if (obj.data || obj.state)
		{
			this.createTempComponent(obj, container, parent);
			return;
		}

		const settings = Parser.parse(obj, parent);
		const ele = this.createNode(settings, container, parent);

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
	 * This will create a temporary component for data/state
	 * bindings in the layout.
	 *
	 * @param {object} obj
	 * @param {object} container
	 * @param {object} parent
	 * @returns {void}
	 */
	createTempComponent(obj, container, parent)
	{
		const props = {
			setData: () => obj.data,
			render()
			{
				return {...obj, data: null, state: null};
			}
		};

		if (obj.state)
		{
			props.setupStateTarget = function(id)
			{
				this.state = obj.state;
			};
		}

		const component = new Component(props);
		this.createComponent(component, container, parent);
	}

	/**
	 * This will add the element directives.
	 *
	 * @param {object} ele
	 * @param {array} directives
	 * @param {object} parent
	 * @returns {void}
	 */
	setDirectives(ele, directives, parent)
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
	handleDirective(ele, attrDirective, parent)
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
	cache(ele, propName, parent)
	{
		if (parent && propName)
		{
			parent[propName] = ele;
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
	createNode(settings, container, parent)
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

	/**
	 * This will remove a node.
	 *
	 * @param {object} node
	 * @returns {void}
	 */
	removeNode(node)
	{
		HtmlHelper.removeElement(node);
	}

	/**
	 * This will remove all the children from an element.
	 *
	 * @override
	 * @param {object} ele
	 * @returns {void}
	 */
	removeAll(ele)
	{
		HtmlHelper.removeAll(ele);
	}
}