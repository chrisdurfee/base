import { Directives } from '../directives/directives.js';
import { Element } from './element.js';
import { Attribute } from './attribute.js';
import { AttributeDirective } from './attribute-directive.js';
import { WatcherHelper } from '../watcher-helper.js';

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
 * ElementParser
 *
 * This will parse JSON layouts.
 * @class
 */
export class ElementParser
{
	/**
	 * This will get the tag name of an element.
	 *
	 * @param {object} obj
	 * @return {string}
	 */
	getTag(obj)
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
	setupChildren(obj)
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
	 * @return {object}
	 */
	parse(obj)
	{
		let attr = [],
        children = [],
        directives = [],
        tag = this.getTag(obj),
        content = ElementContent(obj);

        // this will reset the node to stop them fron being added
        obj.tag = obj.text = obj.innerHTML = null;

		if (tag === 'button')
		{
            let type = obj.type || 'button';
            attr.push(Attribute('type', type));
		}

		this.setupChildren(obj);

		var value, directive;
		const allDirectives = Directives;

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

			if ((directive = allDirectives.get(key)) !== null)
			{
				directives.push(AttributeDirective(
					Attribute(key, value),
					directive
				));
				continue;
			}

			/* we need to filter the children from the attr
			settings. the children need to keep their order. */
			if (typeof value !== 'object')
			{
				attr.push(Attribute(key, value));
			}
			else
			{
				if (key === 'children')
				{
					children = children.concat(value);
				}

				/**
				 * This will check if the value is a watcher.
				 */
				if (WatcherHelper.hasParams(value))
				{
					directives.push(AttributeDirective(
						Attribute(key, value),
						allDirectives.get('watch')
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