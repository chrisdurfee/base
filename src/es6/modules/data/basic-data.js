import {DataPubSub} from '../data-binder/data-pub-sub.js';
import {setupAttrSettings} from './attrs.js';

/**
 * BasicData
 *
 * This will create a bindable base class. This will
 * allow shallow one level deep data to be created
 * and watched.
 *
 * @class
 */
export class BasicData
{
	/**
	 * @constructor
	 * @param {object} [settings]
	 */
	constructor(settings)
	{
		this.dirty = false;

		this._init();
		this.setup();

		/**
		 * @member {string} dataTypeId
		 */
		this.dataTypeId = 'bd';

		/* this will setup the event sub for
		one way binding */
		this.eventSub = new DataPubSub();

		/* this will set the construct attributes */
		let attributes = setupAttrSettings(settings);
		this.set(attributes);
	}

	setup()
	{
		this.stage = {};
	}

	/**
	 * This will setup the number and unique id of the data object.
	 * @protected
	 */
	_init()
	{
		const constructor = this.constructor;
		this._dataNumber = (typeof constructor._dataNumber === 'undefined')? constructor._dataNumber = 0 : (++constructor._dataNumber);

		this._id = 'dt-' + this._dataNumber;
		this._dataId = this._id + ':';
	}

	/**
	 * This will get the data id.
	 * @return {string}
	 */
	getDataId()
	{
		return this._id;
	}

	/**
	 * This is a placeholder.
	 */
	remove()
	{

	}

	/**
	 * This will setup a one way bind.
	 *
	 * @param {string} attrName
	 * @param {function} callBack
	 * @return {string} The subscription token.
	 */
	on(attrName, callBack)
	{
		let message = attrName + ':change';
		return this.eventSub.on(message, callBack);
	}

	/**
	 * This will unbind from a one way bind.
	 *
	 * @param {string} attrName
	 * @param {string} token
	 */
	off(attrName, token)
	{
		let message = attrName + ':change';
		this.eventSub.off(message, token);
	}

	/**
	 * This will set the attribute value.
	 *
	 * @protected
	 * @param {string} attr
	 * @param {*} val
	 * @param {object} committer
	 */
	_setAttr(attr, val, committer)
	{
		let prevValue = this.stage[attr];
		if(val === prevValue)
		{
			return false;
		}

		this.stage[attr] = val;

		committer = committer || this;

		/* this will publish the data to the data binder
		to update any ui elements that are subscribed */
		this._publish(attr, val, committer, prevValue);
	}

	/**
	 * This will set the data value of an attribute or attributes.
	 *
	 * @param {string} key
	 * @param {*} value
	 *
	 * or
	 *
	 * @param {object} data
	 */
	set(...args)
	{
		if(typeof args[0] === 'object')
		{
			let [items, committer, stopMerge] = args;

			for(var attr in items)
			{
				if(items.hasOwnProperty(attr))
				{
					var item = items[attr];
					if(typeof item === 'function')
					{
						continue;
					}
					this._setAttr(attr, item, committer, stopMerge);
				}
			}
		}
		else
		{
			this._setAttr(...args);
		}
	}

	/**
	 * This will get the model data.
	 */
	getModelData()
	{
		return this.stage;
	}

	/**
	 * This will delete an attribute.
	 *
	 * @param {object} obj
	 * @param {string} attr
	 */
	_deleteAttr(obj, attr)
	{
		delete obj[attr];
	}

	/**
	 * This will toggle a bool attribute.
	 *
	 * @param {string} attr
	 */
	toggle(attr)
	{
		if(typeof attr === 'undefined')
		{
			return;
		}

		this.set(attr, !this.get(attr));
	}

	/**
	 * This will increment an attribute.
	 *
	 * @param {string} attr
	 */
	increment(attr)
	{
		if(typeof attr === 'undefined')
		{
			return;
		}

		let val = this.get(attr);
		this.set(attr, ++val);
	}

	/**
	 * This will decrement an attribute.
	 *
	 * @param {string} attr
	 */
	decrement(attr)
	{
		if(typeof attr === 'undefined')
		{
			return;
		}

		let val = this.get(attr);
		this.set(attr, --val);
	}

	/**
	 * This will delete a property value or the model data.
	 *
	 * @param {string} [attrName]
	 * @return {*}
	 */
	delete(attrName)
	{
		if(typeof attrName !== 'undefined')
		{
			this._deleteAttr(this.stage, attrName);
			return;
		}

		// this will clear the stage and attributes
		this.setup();
	}

	/**
	 * This will get the value of an attribute.
	 *
	 * @param {object} obj
	 * @param {string} attr
	 * @return {*}
	 */
	_getAttr(obj, attr)
	{
		return obj[attr];
	}

	/**
	 * This will get a property value or the model data.
	 *
	 * @param {string} [attrName]
	 * @return {*}
	 */
	get(attrName)
	{
		if(typeof attrName !== 'undefined')
		{
			return this._getAttr(this.stage, attrName);
		}
		else
		{
			return this.getModelData();
		}
	}
}