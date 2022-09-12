import {base} from '../../core.js';
import {TwoWaySource} from './two-way-source.js';

/**
 * This will set an element attr by the setAttribute method.
 *
 * @param {object} element
 * @param {string} attr
 * @param {mixed} value
 */
const SetAttr = (element, attr, value) =>
{
	base.setAttr(element, attr, value);
};

const UpdateRadioAttr = (element, attr, value) =>
{
	element.checked = (element.value === value);
};

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
 * @param {nixed} value
 */
const UpdateAttr = (element, attr, value) =>
{
	element[attr] = value;
};

const GetAttr = (element, attr) =>
{
	return base.getAttr(element, attr);
};

const GetAttribute = (element, attr) =>
{
	return element[attr];
};

/**
 * ElementSource
 *
 * This will create an element source to use with
 * a connection.
 * @class
 * @augments TwoWaySource
 */
export class ElementSource extends TwoWaySource
{
	/**
	 * @constructor
	 * @param {object} element
	 * @param {string} attr
	 * @param {(string|function)} [filter]
	 */
	constructor(element, attr, filter)
	{
		super();
		this.element = element;
		this.attr = this.getAttrBind(attr);
		this.addSetMethod(element, this.attr);

		this.filter = (typeof filter === 'string')? this.setupFilter(filter) : filter;
	}

	addSetMethod(element, attr)
	{
		if(attr.substring(4, 1) === '-')
		{
			this.setValue = SetAttr;
			this.getValue = GetAttr;
		}
		else
		{
			this.getValue = GetAttribute;

			var type = element.type;
			if(type)
			{
				switch(type)
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
		}
	}

	/**
	 * This will get the bind attribute.
	 *
	 * @param {string} [customAttr]
	 * @return {string}
	 */
	getAttrBind(customAttr)
	{
		/* this will setup the custom attr if the prop
		has specified one. */
		if(customAttr)
		{
			return customAttr;
		}

		let attr = 'textContent';
		/* if no custom attr has been requested we will get the
		default attr of the element */
		let element = this.element;
		if(!(element && typeof element === 'object'))
		{
			return attr;
		}

		let tagName = element.tagName.toLowerCase();
		if (tagName === "input" || tagName === "textarea" || tagName === "select")
		{
			let type = element.type;
			if(type)
			{
				switch(type)
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
			else
			{
				attr = 'value';
			}
		}
		return attr;
	}

	/**
	 * This will setup a filter callBack.
	 *
	 * @param {string} filter
	 * @return {function}
	 */
	setupFilter(filter)
	{
		let pattern = /(\[\[[^\]]+\]\])/;
		return (value) =>
		{
			return filter.replace(pattern, value);
		};
	}

	/**
	 * This will set a value on an element.
	 *
	 * @param {*} value
	 */
	set(value)
	{
		let element = this.element;
		if(!element || typeof element !== 'object')
		{
			return false;
		}

		/* this will check to apply the option filter before
		setting the value */
		if(this.filter)
		{
			value = this.filter(value);
		}

		this.setValue(element, this.attr, value);
	}

	/**
	 * This will get the value from an element.
	 */
	get()
	{
		let element = this.element;
		if(!element || typeof element !== 'object')
		{
			return '';
		}

		return this.getValue(element, this.attr);
	}

	/**
	 * The callBack when updated.
	 *
	 * @param {*} value
	 * @param {object} committer
	 */
	callBack(value, committer)
	{
		if(committer !== this.element)
		{
			this.set(value);
		}
	}
}