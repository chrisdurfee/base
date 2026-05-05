import { normalizeAttr } from '../../html/html.js';
import { Directives } from '../directives/directives.js';
import { WatcherHelper } from '../watcher-helper.js';
import { AttributeDirective } from './attribute-directive.js';
import { Attribute } from './attribute.js';
import { Element } from './element.js';

/**
 * Cached reference to the 'watch' directive.
 * Avoids a Map lookup on every watcher encountered during parsing.
 *
 * @type {function|null}
 */
let _watchDirective = null;

/**
 * Returns the cached watch directive, resolving it on first call.
 *
 * @returns {function}
 */
// @ts-ignore
const getWatchDirective = () => (_watchDirective || (_watchDirective = Directives.get('watch')));

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
	 * @returns {string}
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
	 * @returns {void}
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
	 * @param {*} value
	 * @param {Array<any>} attr
	 * @param {Array<any>} children
	 * @returns {boolean}
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
	 * @param {Array<any>} directives
	 * @param {string} key
	 * @param {string} value
	 * @returns {void}
	 */
	static setTextAsWatcher(directives, key, value)
	{
		directives.push(
			AttributeDirective(
				Attribute(
					key,

					/**
					 * This will convert the watcher to a custom
					 * watcher object.
					 *
					 * We also need to normalize the attribute name.
					 */
					WatcherHelper.getWatcherSettings(value, normalizeAttr(key))
				),
				getWatchDirective()
			)
		);
	}

	/**
	 * This will set the button type.
	 *
	 * @static
	 * @param {string} tag
	 * @param {object} obj
	 * @param {Array<any>} attr
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
	 * @returns {object}
	 */
	static parse(obj, parent)
	{
		const attr = [],
		directives = [],
		tag = obj.tag || 'div';

		/* Inline button default type (avoids method call). */
		if (tag === 'button')
		{
			attr.push(Attribute('type', obj.type || 'button'));
		}

		let children = [];
		let value, directive;

		/**
		 * `for..in` over a plain layout object avoids the per-element
		 * `Object.keys()` array allocation. The hasOwnProperty guard
		 * keeps us safe against any inherited keys (Atoms can spread
		 * props from objects with custom prototypes).
		 */
		for (const key in obj)
		{
			if (!Object.prototype.hasOwnProperty.call(obj, key))
			{
				continue;
			}

			if (key === 'tag')
			{
				continue;
			}

			value = obj[key];
			if (value === undefined || value === null)
			{
				continue;
			}

			/**
			 * Handle children and nest inline.
			 * Avoids setupChildren() which used `delete obj.nest`
			 * (delete triggers V8 hidden class transitions).
			 */
			if (key === 'children' || key === 'nest')
			{
				if (Array.isArray(value))
				{
					for (let ci = 0; ci < value.length; ci++)
					{
						children.push(value[ci]);
					}
				}
				else
				{
					children.push(value);
				}
				continue;
			}

			/**
			 * This will set up the attribute directives.
			 */
			if ((directive = Directives.get(key)) !== null)
			{
				directives.push(
					AttributeDirective(
						Attribute(key, value),
						directive
					)
				);
				continue;
			}

			const type = typeof value;
			if (type === 'object')
			{
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
				/**
				 * Store the original callback reference on the wrapper function
				 * so it can be matched during event removal.
				 */
				const wrapper = function(e)
				{
					// @ts-ignore
					callback.call(this, e, parent);
				};

				// @ts-ignore - Add originalCallback for event cleanup tracking
				wrapper.originalCallback = callback;
				attr.push(Attribute(key, wrapper));
				continue;
			}

			/**
			 * Inline watcher check for strings.
			 * At this point value is a string or number; includes()
			 * only exists on strings so the type guard is required.
			 */
			if (type === 'string' && value.includes('[['))
			{
				this.setTextAsWatcher(directives, key, value);
				continue;
			}

			/**
			 * Inline text/html content checks (avoids
			 * setElementContent method call per attribute).
			 */
			if (key === 'text')
			{
				children.push({
					tag: 'text',
					textContent: value
				});
				continue;
			}

			if (key === 'html' || key === 'innerHTML')
			{
				attr.push(Attribute('innerHTML', value));
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