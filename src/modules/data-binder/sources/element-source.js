import { Dom } from '../../../shared/dom.js';
import { TwoWaySource } from './two-way-source.js';

/**
 * This will set an element attr by the setAttribute method.
 *
 * @param {object} element
 * @param {string} attr
 * @param {*} value
 * @returns {void}
 */
const SetAttr = (element, attr, value) =>
{
	Dom.setAttr(element, attr, value);
};

/**
 * This will update a radio element attr.
 *
 * @param {object} element
 * @param {string} attr
 * @param {*} value
 * @returns {void}
 */
const UpdateRadioAttr = (element, attr, value) =>
{
	element.checked = (element.value == value);
};

/**
 * This will update a checkbox element attr.
 *
 * @param {object} element
 * @param {string} attr
 * @param {*} value
 * @returns {void}
 */
const UpdateCheckboxAttr = (element, attr, value) =>
{
	value = (value == 1);
	UpdateAttr(element, attr, value);
};

/**
 * This will update an element attr by the bracket notation.
 *
 * @param {object} element
 * @param {string} attr
 * @param {*} value
 * @returns {void}
 */
const UpdateAttr = (element, attr, value) =>
{
	element[attr] = value;
};

/**
 * This will get an element attr by the getAttribute method.
 *
 * @param {object} element
 * @param {string} attr
 * @returns {*}
 */
const GetAttr = (element, attr) =>
{
	return Dom.getAttr(element, attr);
};

/**
 * This will get an element attr by the bracket notation.
 *
 * @param {object} element
 * @param {string} attr
 * @returns {*}
 */
const GetAttribute = (element, attr) =>
{
	return element[attr];
};

/**
 * ElementSource
 *
 * This will create an element source to use with
 * a connection.
 *
 * @class
 * @augments TwoWaySource
 */
export class ElementSource extends TwoWaySource
{
	/**
	 * This will create a new element source.
	 *
	 * @constructor
	 * @param {object} element
	 * @param {string} attr
	 * @param {string|function} filter
	 * @param {object} pubSub
	 */
	constructor(element, attr, filter, pubSub)
	{
		super(pubSub);

		/**
		 * @member {object} element
		 */
		this.element = element;

		/**
		 * @member {string} attr
		 */
		this.attr = this.getAttrBind(attr);
		this.addSetMethod(element, this.attr);

		/**
		 * @member {function} filter
		 * @private
		 */
		this.filter = (typeof filter === 'string')? this.setupFilter(filter) : filter;
	}

	/**
	 * This will set up the set and get methods.
	 *
	 * @private
	 * @param {object} element
	 * @param {string} attr
	 * @returns {object}
	 */
	addSetMethod(element, attr)
	{
		if (attr.substring(4, 1) === '-')
		{
			this.setValue = SetAttr;
			this.getValue = GetAttr;
			return this;
		}

		this.getValue = GetAttribute;

		const type = element.type;
		if (type)
		{
			switch (type)
			{
				case 'checkbox':
					this.setValue = UpdateCheckboxAttr;
					return;
				case 'radio':
					this.setValue = UpdateRadioAttr;
					return;
			}
		}

		this.setValue = UpdateAttr;
		return this;
	}

	/**
	 * This will get the bind attribute.
	 *
	 * @private
	 * @param {string} [customAttr]
	 * @returns {string}
	 */
	getAttrBind(customAttr)
	{
		/**
		 * This will setup the custom attr if the prop
		 * has specified one.
		 */
		if (customAttr)
		{
			return customAttr;
		}

		/**
		 * If no custom attr has been requested we will get the
		 * default attr of the element.
		 */
		let attr = 'textContent';
		const element = this.element;
		if (!element || typeof element !== 'object')
		{
			return attr;
		}

		/**
		 * This will get the default attr by the element type.
		 */
		const tagName = element.tagName.toLowerCase();
		if (tagName === "input" || tagName === "textarea" || tagName === "select")
		{
			const type = element.type;
			if (!type)
			{
				attr = 'value';
				return attr;
			}

			switch (type)
			{
				case 'checkbox':
					attr = 'checked';
					break;
				case 'file':
					attr = 'files';
					break;
				default:
					attr = 'value';
			}
		}
		return attr;
	}

	/**
	 * This will setup a filter callBack.
	 *
	 * @private
	 * @param {string} filter
	 * @returns {function}
	 */
	setupFilter(filter)
	{
		const pattern = /(\[\[[^\]]+\]\])/;
		return (value) =>
		{
			return filter.replace(pattern, value);
		};
	}

	/**
	 * This will set a value on an element.
	 *
	 * @param {*} value
	 * @returns {object}
	 */
	set(value)
	{
		const element = this.element;
		if (!element || typeof element !== 'object')
		{
			return this;
		}

		/* this will check to apply the option filter before
		setting the value */
		if (this.filter)
		{
			value = this.filter(value);
		}

		this.setValue(element, this.attr, value);
		return this;
	}

	/**
	 * This will get the value from an element.
	 *
	 * @returns {*}
	 */
	get()
	{
		const element = this.element;
		if (!element || typeof element !== 'object')
		{
			return '';
		}

		return this.getValue(element, this.attr);
	}

	/**
	 * The callBack when updated.
	 *
	 * @overload
	 * @param {*} value
	 * @param {object} committer
	 * @returns {object}
	 */
	// @ts-ignore
	callBack(value, committer)
	{
		if (committer !== this.element)
		{
			this.set(value);
		}
		return this;
	}
}