import { Objects } from '../../../shared/objects.js';
import { normalizeAttr } from '../../html/html.js';
import { Directives } from '../directives/directives.js';
import { WatcherHelper } from '../watcher-helper.js';
import { AttributeDirective } from './attribute-directive.js';
import { Attribute } from './attribute.js';
import { Element } from './element.js';

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
	 * @static
	 * @private
	 * @param {object} obj
	 * @return {string}
	 */
	static getTag(obj)
	{
		return obj.tag || 'div';
	}

	/**
	 * This will setup the element children.
	 *
	 * @static
	 * @param {object} obj
	 */
	static setupChildren(obj)
	{
		if (obj.nest)
		{
			obj.children = obj.nest;
			delete obj.nest;
		}
	}

	/**
	 * This will setup the element content.
	 *
	 * @param {string} key
	 * @param {mixed} value
	 * @param {array} attr
	 * @param {array} children
	 * @return {bool}
	 */
	static setElementContent(key, value, attr, children)
	{
		if (key === 'text')
		{
			children.push({
				tag: 'text',
				textContent: value
			});

			return true;
		}

		if (key === 'html' || key === 'innerHTML')
		{
			attr.push(Attribute('innerHTML', value));

			return true;
		}

		return false;
	}

	/**
	 * This will set the text as a watcher.
	 *
	 * @private
	 * @static
	 * @param {array} directives
	 * @param {string} key
	 * @param {string} value
	 * @return {void}
	 */
	static setTextAsWatcher(directives, key, value)
	{
		/**
		 * This will convert the watcher to a custom
		 * watcher object.
		 *
		 * We also need to normalize the attribute name.
		 */
		value = {
			attr: normalizeAttr(key),
			value
		};

		directives.push(AttributeDirective(
			Attribute(key, value),
			Directives.get('watch')
		));
	}

	/**
	 * This will set the button type.
	 *
	 * @static
	 * @param {string} tag
	 * @param {object} obj
	 * @param {array} attr
	 */
	static setButtonType(tag, obj, attr)
	{
		if (tag === 'button')
		{
            const type = obj.type || 'button';
            attr.push(Attribute('type', type));
		}
	}

	/**
	 * This will parse a layout element.
	 *
	 * @static
	 * @param {object} obj
	 * @param {object} parent
	 * @return {object}
	 */
	static parse(obj, parent)
	{
		const attr = [],
		directives = [],
        tag = this.getTag(obj);

		this.setButtonType(tag, obj, attr);
		this.setupChildren(obj);

		let children = [];
		var value, directive;
		for (var key in obj)
		{
			if (!Objects.hasOwnProp(obj, key) || key === 'tag')
			{
				continue;
			}

			value = obj[key];
			if (value === undefined || value === null)
			{
				continue;
			}

			/**
			 * This will set up the attribute directives.
			 */
			if ((directive = Directives.get(key)) !== null)
			{
				directives.push(AttributeDirective(
					Attribute(key, value),
					directive
				));
				continue;
			}

			const type = typeof value;
			if (type === 'object')
			{
				if (key === 'children')
				{
					children = children.concat(value);
					continue;
				}

				/**
				 * This will check if the value is a watcher.
				 */
				if (WatcherHelper.isWatching(value))
				{
					this.setTextAsWatcher(directives, key, value);
					continue;
				}

				children.push(value);
				continue;
			}

			/**
			 * This will set event callbacks to bind to the element on the this keyword
			 * and pass the parent element in the args.
			 */
			if (type === 'function')
			{
				const callback = value;
				value = function(e)
				{
					callback.call(this, e, parent);
				};
			}

			/**
			 * This will check if the value is a watcher.
			 */
			if (WatcherHelper.isWatching(value))
			{
				this.setTextAsWatcher(directives, key, value);
				continue;
			}

			/**
			 * This will set the element text and html content.
			 */
			if (this.setElementContent(key, value, attr, children))
			{
				continue;
			}

			attr.push(Attribute(key, value));
		}

		return Element(
            tag,
            attr,
            directives,
            children
        );
	}
}