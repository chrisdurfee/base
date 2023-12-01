import { Directives } from '../directives/directives.js';
import { WatcherHelper } from '../watcher-helper.js';
import { AttributeDirective } from './attribute-directive.js';
import { Attribute } from './attribute.js';
import { Element } from './element.js';

/**
 * This will setup the element content.
 *
 * @param {object} settings
 * @return {object}
 */
const ElementContent = (settings) =>
{
	return {
		textContent: (typeof settings.text !== 'undefined')? settings.text : null,
		innerHTML: settings.innerHTML || null
	};
};

/**
 * Parser
 *
 * This will parse JSON layouts.
 *
 * @class
 */
export class Parser
{
	/**
	 * This will get the tag name of an element.
	 *
	 * @param {object} obj
	 * @return {string}
	 */
	static getTag(obj)
	{
		let type = 'div',
		node = obj.tag;
		if (typeof node !== 'undefined')
		{
			type = node;
		}

		return type;
	}

	/**
	 * This will setup the element children.
	 *
	 * @param {object} obj
	 */
	static setupChildren(obj)
	{
		if (obj.nest)
		{
			obj.children = obj.nest;
			obj.nest = null;
		}
	}

	/**
	 * This will parse a layout element.
	 *
	 * @param {object} obj
	 * @param {object} parent
	 * @return {object}
	 */
	static parse(obj, parent)
	{
		let children = [];
		const attr = [],
        directives = [],
        tag = this.getTag(obj),
        content = ElementContent(obj);

        // this will reset the node to stop them fron being added
        obj.tag = obj.text = obj.innerHTML = null;

		if (tag === 'button')
		{
            const type = obj.type || 'button';
            attr.push(Attribute('type', type));
		}

		this.setupChildren(obj);

		var value, directive;
		for (var key in obj)
		{
			if (!obj.hasOwnProperty(key))
			{
				continue;
			}

			value = obj[key];
			if (value === undefined || value === null)
			{
				continue;
			}

			if ((directive = Directives.get(key)) !== null)
			{
				directives.push(AttributeDirective(
					Attribute(key, value),
					directive
				));
				continue;
			}

			/* we need to filter the children from the attr
			settings. the children need to keep their order. */
			const type = typeof value;
			if (type !== 'object')
			{
				if (type === 'function')
				{
					const callback = value;
					value = function(e)
					{
						callback.call(this, e, parent);
					};
				}
				attr.push(Attribute(key, value));
			}
			else
			{
				if (key === 'children')
				{
					children = children.concat(value);
					continue;
				}

				/**
				 * This will check if the value is a watcher.
				 */
				if (WatcherHelper.hasParams(value))
				{
					directives.push(AttributeDirective(
						Attribute(key, value),
						Directives.get('watch')
					));
					continue;
				}

				children.push(value);
			}
		}

		return Element(
            tag,
            attr,
            directives,
            children,
            content
        );
	}
}