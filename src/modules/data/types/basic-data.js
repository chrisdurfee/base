import { Objects } from '../../../shared/objects.js';
import { dataBinder } from '../../data-binder/data-binder.js';
import { DataPubSub } from '../../data-binder/data-pub-sub.js';
import { DataProxy } from '../data-proxy.js';
import { LocalData } from '../local-data.js';
import { setupAttrSettings } from './model/attrs.js';

let dataNumber = 0;

/**
 * EVENT
 *
 * This will hold the event strings for the data object.
 *
 * @type {object} EVENT
 * @property {string} CHANGE
 * @property {string} DELETE
 * @readonly
 * @enum {string} EVENT - The event strings for the data object.
 * @const
 */
export const EVENT =
{
	CHANGE: 'change',
	DELETE: 'delete'
};

/**
 * createEventMessage
 *
 * This will create an event message.
 *
 * @param {string} attr
 * @param {string} event
 * @returns {string} The event message.
 */
export const createEventMessage = (attr, event) =>
{
	return `${attr}:${event}`;
};

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
	 * This will create a basic data object.
	 *
	 * @constructor
	 * @param {object} [settings]
	 */
	constructor(settings = {})
	{
		/**
		 * @member {boolean} dirty
		 * @default false
		 */
		this.dirty = false;

		/**
		 * @member {object} links
		 * @default {}
		 * @protected
		 */
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
		const attributes = setupAttrSettings(settings);
		this.set(attributes);

		// @ts-ignore
		return DataProxy(this);
	}

	/**
	 * This will setup the data object.
	 *
	 * @protected
	 * @returns {void}
	 */
	setup()
	{
		/**
		 * @member {object} stage
		 */
		this.stage = {};
	}

	/**
	 * This will setup the number and unique id of the data object.
	 *
	 * @protected
	 * @returns {void}
	 */
	_init()
	{
		const id = (++dataNumber);
		this._dataNumber = id;

		this._id = `dt-${id}`;
		this._dataId = `${this._id}:`;
	}

	/**
	 * This will get the data id.
	 *
	 * @returns {string}
	 */
	getDataId()
	{
		return this._id;
	}

	/**
	 * This is a placeholder.
	 *
	 * @returns {void}
	 */
	remove()
	{

	}

	/**
	 * This will setup a one way bind.
	 *
	 * @param {string} attrName
	 * @param {function} callBack
	 * @returns {string} The subscription token.
	 */
	on(attrName, callBack)
	{
		const message = createEventMessage(attrName, EVENT.CHANGE);
		const token = this.eventSub.on(message, callBack);
		return token;
	}

	/**
	 * This will unbind from a one way bind.
	 *
	 * @param {string} attrName
	 * @param {string} token
	 * @returns {void}
	 */
	off(attrName, token)
	{
		const message = createEventMessage(attrName, EVENT.CHANGE);
		this.eventSub.off(message, token);
	}

	/**
	 * This will set the attribute value.
	 *
	 * @protected
	 * @param {string} attr
	 * @param {*} val
	 * @param {object} committer
	 * @param {boolean} stopMerge
	 * @returns {void}
	 */
	_setAttr(attr, val, committer = this, stopMerge = false)
	{
		const prevValue = this.stage[attr];
		if (val === prevValue)
		{
			return;
		}

		this.stage[attr] = val;

		/* this will publish the data to the data binder
		to update any ui elements that are subscribed */
		this._publish(attr, val, committer, EVENT.CHANGE);
	}

	/**
	 * This will publish a local event.
	 *
	 * @protected
	 * @param {string} attr
	 * @param {*} val
	 * @param {object|null} committer
	 * @param {string} event
	 * @returns {void}
	 */
	publishLocalEvent(attr, val, committer, event)
	{
		/**
		 * This will publish the event to the event sub.
		 */
		const message = createEventMessage(attr, event);
		this.eventSub.publish(message, val, committer);
	}

	/**
	 * This will publish an update to the data binder.
	 *
	 * @protected
	 * @param {string} attr
	 * @param {*} val
	 * @param {*} committer
	 * @param {string} event
	 * @returns {void}
	 */
	_publish(attr, val, committer, event)
	{
		/**
		 * This will publish the event to the event sub.
		 */
		this.publishLocalEvent(attr, val, committer, event);

		/**
		 * This will set the committer to the current object if it is not set.
		 * This is deferred until the local event is published.
		 *
		 * This will publish the event to the data binder.
		 */
		committer = committer || this;
		dataBinder.publish(this._dataId + attr, val, committer);
	}

	/**
	 * This will set the data value of an attribute or attributes.
	 *
	 * @overload
	 * @param {string} key
	 * @param {*} value
	 * @param {object} [committer]
	 *
	 * @overload
	 * @param {object} data
	 * @returns {object} this
	 */
	set(...args)
	{
		if (typeof args[0] !== 'object')
		{
			// @ts-ignore
			this._setAttr(...args);
			return this;
		}

		const [items, committer, stopMerge] = args;
		Object.entries(items).forEach(([attr, value]) =>
		{
			if (typeof value === 'function')
			{
				return;
			}
			this._setAttr(attr, value, committer, stopMerge);
		});

		return this;
	}

	/**
	 * This will get the model data.
	 *
	 * @protected
	 * @returns {object}
	 */
	getModelData()
	{
		return this.stage;
	}

	/**
	 * This will delete an attribute.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {string} attr
	 * @param {object} [committer]
	 * @returns {void}
	 */
	_deleteAttr(obj, attr, committer = this)
	{
		delete obj[attr];

		/**
		 * This will pulish the delete event to the event sub only. This will
		 * not publish the delete event to the data binder.
		 */
		this.publishLocalEvent(attr, null, committer, EVENT.DELETE);
	}

	/**
	 * This will toggle a bool attribute.
	 *
	 * @param {string} attr
	 * @returns {object} this
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
	 * @returns {object} this
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
	 * @returns {object} this
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
	 * @returns {object} this
	 */
	concat(attr, value)
	{
		if (typeof attr === 'undefined')
		{
			return;
		}

		const currentValue = this.get(attr);
		this.set(attr, currentValue + value);
		return this;
	}

	/**
	 * This will set the key value if it is null.
	 *
	 * @param {string} key
	 * @param {*} value
	 * @returns {object} this
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
	 * @returns {object} this
	 */
	setKey(key)
	{
		this.key = key;
		return this;
	}

	/**
	 * This will restore the data from local storage.
	 *
	 * @param {*} defaultValue
	 * @returns {object} this
	 */
	resume(defaultValue)
	{
		const data = LocalData.resume(this.key, defaultValue);
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
	 * @returns {boolean}
	 */
	store()
	{
		const data = this.get();
		return LocalData.store(this.key, data);
	}

	/**
	 * This will delete a property value or the model data.
	 *
	 * @param {object|string|null} [attrName]
	 * @returns {object} this
	 */
	delete(attrName)
	{
		if (typeof attrName === 'string')
		{
			this._deleteAttr(this.stage, attrName);
			return this;
		}

		// this will clear the stage and attributes
		this.setup();
		return this;
	}

	/**
	 * This will get the value of an attribute.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {string} attr
	 * @returns {*}
	 */
	_getAttr(obj, attr)
	{
		return obj[attr];
	}

	/**
	 * This will get a property value or the model data.
	 *
	 * @param {string} [attrName]
	 * @returns {*}
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
	 * @returns {string|array}
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
		Object.entries(attr).forEach(([prop]) =>
		{
			tokens.push(this.remoteLink(data, prop));
		});

		return tokens;
	}

	/**
	 * This will link a remote data source by property.
	 *
	 * @param {object} data
	 * @param {string} attr
	 * @param {string} [alias]
	 * @returns {string}
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
	 * @returns {void}
	 */
	addLink(token, data)
	{
		this.links[token] = data;
	}

	/**
	 * This will remove a link or all links if no token is provided.
	 *
	 * @param {string|null} [token=null]
	 * @returns {void}
	 */
	unlink(token)
	{
		if (token)
		{
			this.removeLink(token);
			return;
		}

		const links = this.links;
		if (Objects.isEmpty(links))
		{
			return;
		}

		Object.entries(links).forEach(([key, token]) =>
		{
			this.removeLink(token, false);
		});
		this.links = {};
	}

	/**
	 * This will remove the linked subscription.
	 *
	 * @param {string} token
	 * @param {boolean} [removeFromLinks=true]
	 * @returns {void}
	 */
	removeLink(token, removeFromLinks = true)
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