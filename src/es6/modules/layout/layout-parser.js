/**
 * LayoutParser
 *
 * This will parse JSON layouts.
 * @class
 */
export class LayoutParser
{
	constructor()
	{
		/**
		 * @member {array} _reserved
		 * @protected
		 */
		this._reserved = [
			'tag',
			'bind',
			'onCreated',
			'route',
			'switch',
			'useParent',
			'useState',
			'useData',
			'addState',
			'map',
			'html',
			'onSet',
			'onState',
			'watch',
			'cache'
		];
	}

	/**
	 * This will get the tag name of an element.
	 *
	 * @param {object} obj
	 * @return {string}
	 */
	getElementTag(obj)
	{
		let type = 'div',
		node = obj.tag || obj.t;
		if (typeof node !== 'undefined')
		{
			type = obj.tag = node;
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
		if(obj.nest)
		{
			obj.children = obj.nest;
			obj.nest = null;
		}

		if(typeof obj.children === 'undefined')
		{
			obj.children = null;
		}
	}

	/**
	 * This will parse a layout element.
	 *
	 * @param {object} obj
	 * @return {object}
	 */
	parseElement(obj)
	{
		let attr = {},
		children = [];

		let tag = this.getElementTag(obj);
		if(tag === 'button')
		{
			attr.type = attr.type || 'button';
		}

		this.setupChildren(obj);
		const reserved = this._reserved;

		for (var key in obj)
		{
			if (obj.hasOwnProperty(key))
			{
				var value = obj[key];
				if (value === null || reserved.indexOf(key) !== -1)
				{
					continue;
				}

				/* we need to filter the children from the attr
				settings. the children need to keep their order. */
				if (typeof value !== 'object')
				{
					attr[key] = value;
				}
				else
				{
					if (key === 'children')
					{
						//Array.prototype.push.apply(children, value);
						children = children.concat(value);
					}
					else
					{
						children.push(value);
					}
				}
			}
		}

		return {
			tag,
			attr,
			children
		};
	}
}