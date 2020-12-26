import { Directives } from './directives.js';
import { Element } from './element.js';
import { Attribute } from './attribute.js';
import { AttributeDirective } from './attribute-directive.js';

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

		if(tag === 'button')
		{
            let type = obj.type || 'button';
            attr.push(Attribute('type', type));
		}

		if(typeof obj.children === 'undefined')
		{
			obj.children = null;
		}

		var value, directive;
		const allDirectives = Directives;

		for (var key in obj)
		{
			if (obj.hasOwnProperty(key))
			{
				value = obj[key];
				if (value === null)
				{
					continue;
                }

                if((directive = allDirectives.get(key)) !== null)
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
					else
					{
						children.push(value);
					}
				}
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