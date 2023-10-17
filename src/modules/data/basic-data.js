import { DataPubSub } from '../data-binder/data-pub-sub.js';
import { setupAttrSettings } from './attrs.js';

let dataNumber = 0;

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
		this.links = {};

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
		const id = (++dataNumber);
		this._dataNumber = id;

		this._id = 'dt-' + id;
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
		const message = attrName + ':change';
		const token = this.eventSub.on(message, callBack);
		return token;
	}

	/**
	 * This will unbind from a one way bind.
	 *
	 * @param {string} attrName
	 * @param {string} token
	 */
	off(attrName, token)
	{
		const message = attrName + ':change';
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
	_setAttr(attr, val, committer = this)
	{
		const prevValue = this.stage[attr];
		if (val === prevValue)
		{
			return false;
		}

		this.stage[attr] = val;

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
	 * @return {object} this
	 */
	set(...args)
	{
		if (typeof args[0] !== 'object')
		{
			this._setAttr(...args);
			return this;
		}

		const [items, committer, stopMerge] = args;

		for(var attr in items)
		{
			if (!items.hasOwnProperty(attr))
			{
				continue;
			}

			var item = items[attr];
			if(typeof item === 'function')
			{
				continue;
			}
			this._setAttr(attr, item, committer, stopMerge);
		}
		return this;
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
	 * @return {object} this
	 */
	toggle(attr)
	{
		if (typeof attr === 'undefined')
		{
			return;
		}

		this.set(attr, !this.get(attr));
		return this;
	}

	/**
	 * This will increment an attribute.
	 *
	 * @param {string} attr
	 * @return {object} this
	 */
	increment(attr)
	{
		if (typeof attr === 'undefined')
		{
			return;
		}

		let val = this.get(attr);
		this.set(attr, ++val);
		return this;
	}

	/**
	 * This will decrement an attribute.
	 *
	 * @param {string} attr
	 * @param {string} value
	 * @return {object} this
	 */
	decrement(attr)
	{
		if (typeof attr === 'undefined')
		{
			return;
		}

		let val = this.get(attr);
		this.set(attr, --val);
		return this;
	}

	/**
	 * This will concat an attribute.
	 *
	 * @param {string} attr
	 * @return {object} this
	 */
	concat(attr, value)
	{
		if (typeof attr === 'undefined')
		{
			return;
		}

		let currentValue = this.get(attr);
		this.set(attr, currentValue + value);
		return this;
	}

	/**
	 * This will set the key value if it is null.
	 *
	 * @param {string} key
	 * @param {mixed} value
	 * @return {object} this
	 */
	ifNull(key, value)
	{
		if (this.get(key) === null)
		{
			this.set(key, value);
		}
		return this;
	}

	/**
	 * This will set the data local storage key.
	 *
	 * @param {string} key
	 * @return {object} this
	 */
	setKey(key)
	{
		this.key = key;
		return this;
	}

	/**
	 * This will restore the data from local storage.
	 *
	 * @param {mixed} defaultValue
	 * @returns {object} this
	 */
	resume(defaultValue)
	{
		const key = this.key;
		if (!key)
		{
			return this;
		}

		let data;
		const value = localStorage.getItem(key);
		if (value === null)
		{
			if (defaultValue)
			{
				data = defaultValue;
			}
		}
		else
		{
			data = JSON.parse(value);
		}

		if (!data)
		{
			return this;
		}

		this.set(data);
		return this;
	}

	/**
	 * This will store the data to the local stoage under
	 * the storage key.
	 *
	 * @returns {bool}
	 */
	store()
	{
		const key = this.key;
		if (!key)
		{
			return false;
		}

		const data = this.get();
		if (!data)
		{
			return false;
		}

		const value = JSON.stringify(data);
		localStorage.setItem(key, value);
		return true;
	}

	/**
	 * This will delete a property value or the model data.
	 *
	 * @param {string} [attrName]
	 * @return {*}
	 */
	delete(attrName)
	{
		if (typeof attrName !== 'undefined')
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
		if (typeof attrName !== 'undefined')
		{
			return this._getAttr(this.stage, attrName);
		}

		return this.getModelData();
	}

	/**
	 * This will link a data source property to another data source.
	 *
	 * @param {object} data
	 * @param {string|object} attr
	 * @param {string} alias
	 * @return {string|array}
	 */
	link(data, attr, alias)
	{
		// this will get the data source attrs if sending a whole data object
		if (arguments.length === 1 && data.isData === true)
		{
			attr = data.get();
		}

		if (typeof attr !== 'object')
		{
			return this.remoteLink(data, attr, alias);
		}

		const tokens = [];
		for (var prop in attr)
		{
			if (attr.hasOwnProperty(prop) === false)
			{
				continue;
			}

			tokens.push(this.remoteLink(data, prop));
		}
		return tokens;
	}

	/**
	 * This will link a remote data source by property.
	 *
	 * @param {object} data
	 * @param {string} attr
	 * @param {string} alias
	 * @return {string}
	 */
	remoteLink(data, attr, alias)
	{
		const childAttr = alias || attr;
		const value = data.get(attr);
		if (typeof value !== 'undefined' && this.get(attr) !== value)
		{
			this.set(attr, value);
		}

		const token = data.on(attr, (propValue, committer) =>
		{
			if(committer === this)
			{
				return false;
			}

			this.set(childAttr, propValue, data);
		});

		this.addLink(token, data);

		const remoteToken = this.on(childAttr, (propValue, committer) =>
		{
			if (committer === data)
			{
				return false;
			}

			data.set(attr, propValue, this);
		});

		data.addLink(remoteToken, this);
		return token;
	}

	/**
	 * This will add a link token to the links array.
	 *
	 * @param {string} token
	 * @param {object} data
	 */
	addLink(token, data)
	{
		this.links[token] = data;
	}

	/**
	 * This will remove a link or all links.
	 *
	 * @param {string} [token]
	 */
	unlink(token)
	{
		if (token)
		{
			this.removeLink(token);
			return;
		}

		const links = this.links;
		if (links.length)
		{
			for (var i = 0, length = links.length; i < length; i++)
			{
				this.removeLink(links[i], false);
			}
			this.links = [];
		}
	}

	/**
	 * This will remove the linked subscription.
	 *
	 * @param {string} token
	 * @param {bool} removeFromLinks
	 */
	removeLink(token, removeFromLinks)
	{
		const data = this.links[token];
		if (data)
		{
			data.off(token);
		}

		if (removeFromLinks === false)
		{
			return;
		}

		delete this.links[token];
	}
}

BasicData.prototype.isData = true;