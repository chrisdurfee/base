import { LRUCache } from '../../../shared/lru-cache.js';
import { dataBinder } from '../../data-binder/data-binder.js';
import { DataPubSub } from '../../data-binder/data-pub-sub.js';
import { DataProxy } from '../data-proxy.js';
import { LocalData } from '../local-data.js';
import { setupAttrSettings } from './model/attrs.js';

let dataNumber = 0;

/**
 * Module-level cache for event message strings.
 * Avoids building `attr + ':change'` / `attr + ':delete'` strings on every data change.
 * Since property names repeat constantly, hit rate is near 100% after warm-up.
 *
 * Deep paths ('items[0].name') are attrs too, so the key space grows
 * with the data, not with the source. The bound keeps a long lived
 * page from retaining a message entry per row it ever rendered.
 *
 * @type {LRUCache}
 */
const eventMessageCache = new LRUCache(2000);

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
	let entry = eventMessageCache.get(attr);
	if (!entry)
	{
		entry = { change: `${attr}:change`, delete: `${attr}:delete` };
		eventMessageCache.set(attr, entry);
	}
	return event === 'change' ? entry.change : entry.delete;
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
		 * @type {boolean} dirty
		 * @default false
		 */
		this.dirty = false;

		/**
		 * When true, the persist/resume system will prefer
		 * persisted values over fresh defaults from setData().
		 *
		 * @type {boolean}
		 * @default false
		 */
		this._retainState = false;

		/**
		 * When true, the persist/resume system treats the
		 * fresh data from setData() as authoritative and
		 * only copies persisted keys that are missing from
		 * the fresh data.
		 *
		 * @type {boolean}
		 * @default false
		 */
		this._refreshState = false;

		/**
		 * Link records keyed by subscription token.
		 *
		 * Tokens are the numbers handed out by the event sub, so both
		 * sides of a link pair must key and read this map with a
		 * number. A stringified token would delete nothing.
		 *
		 * @type {Map<number, {data: object, attr: string, pair: number}>} links
		 * @protected
		 */
		this.links = new Map();

		this._init();
		this.setup();

		/**
		 * @type {string} dataTypeId
		 */
		this.dataTypeId = 'bd';

		/* this will setup the event sub for
		one way binding */
		this.eventSub = new DataPubSub();

		/* this will set the construct attributes */
		const attributes = setupAttrSettings(settings);
		this.set(attributes);

		/**
		 * Store the proxy reference so that chainable methods
		 * (e.g. retainState()) can return the proxy instead of
		 * the raw target. Without this, method chaining like
		 * `new Data({}).retainState()` would return the raw
		 * object, breaking proxy-based property access.
		 *
		 * @type {Proxy}
		 */
		// @ts-ignore
		const proxy = DataProxy(this);
		this._proxy = proxy;
		// @ts-ignore
		return proxy;
	}

	/**
	 * Marks this data source so the persist/resume system
	 * keeps persisted values instead of overwriting them
	 * with fresh defaults from setData().
	 *
	 * Use this when accumulated state (filters, selections,
	 * loaded content) should survive across route navigations.
	 *
	 * @returns {this}
	 */
	retainState()
	{
		this._retainState = true;
		// @ts-ignore
		return this._proxy || this;
	}

	/**
	 * Marks this data source so the persist/resume system
	 * uses the fresh values from setData() as the source
	 * of truth. Persisted keys missing from the fresh data
	 * are still copied over so async-added properties
	 * survive across resumes.
	 *
	 * Use this when setData() reads from props, the URL,
	 * or other external sources that should override any
	 * previously stored values.
	 *
	 * @returns {this}
	 */
	refreshState()
	{
		this._refreshState = true;
		// @ts-ignore
		return this._proxy || this;
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
		 * @type {object} stage
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
	 * This will setup a flush callback.
	 *
	 * @param {function} callBack
	 * @returns {void}
	 */
	onFlush(callBack)
	{
		this.eventSub.onFlush(callBack);
	}

	/**
	 * This will flush any pending batched publishes immediately.
	 * Useful for draining stale queued updates before setting up
	 * new subscribers, preventing duplicate notifications.
	 *
	 * @returns {void}
	 */
	flushPending()
	{
		this.eventSub.flush();
	}

	/**
	 * This will get the data id.
	 *
	 * @returns {string}
	 */
	getDataId()
	{
		return String(this._id);
	}

	/**
	 * This will release every subscription and link the data
	 * source holds.
	 *
	 * @returns {void}
	 */
	remove()
	{
		this.unlink();
		this.eventSub.reset();
	}

	/**
	 * This will setup a one way bind.
	 *
	 * @param {string} attrName
	 * @param {function} callBack
	 * @returns {number} The subscription token.
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
	 * @param {number} token
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
	 * @returns {this}
	 */
	set(first, second, third)
	{
		if (typeof first !== 'object')
		{
			this._setAttr(first, second, third);
			return this;
		}

		/* Bulk set: first=items, second=committer, third=stopMerge */
		const keys = Object.keys(first);
		for (let i = 0; i < keys.length; i++)
		{
			const attr = keys[i];
			const value = first[attr];
			if (typeof value !== 'function')
			{
				this._setAttr(attr, value, second, third);
			}
		}

		return this;
	}

	/**
	 * Bulk-write top-level keys directly into stage WITHOUT
	 * publishing to subscribers.
	 *
	 * Used by the persist/resume system: when a fresh component
	 * instance is being seeded with persisted state, no watchers
	 * have subscribed yet (the new layout has not been built),
	 * so the deep `Publisher.publish` cascade fires into an empty
	 * subscriber set. For large data trees that is the dominant
	 * cost of resume.
	 *
	 * Subclasses (DeepData) may override to also keep their
	 * committed-attribute mirror in sync.
	 *
	 * @param {object} updates
	 * @returns {void}
	 */
	_silentSet(updates)
	{
		const stage = this.stage;
		const keys = Object.keys(updates);
		for (let i = 0, len = keys.length; i < len; i++)
		{
			const key = keys[i];
			stage[key] = updates[key];
		}
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
	 * @returns {this}
	 */
	toggle(attr)
	{
		if (typeof attr === 'undefined')
		{
			return this;
		}

		this.set(attr, !this.get(attr));
		return this;
	}

	/**
	 * This will increment an attribute.
	 *
	 * @param {string} attr
	 * @param {number|null} value
	 * @returns {this}
	 */
	increment(attr, value = null)
	{
		if (typeof attr === 'undefined')
		{
			return this;
		}

		// this will ensure we have a number value
		value = (value !== null && typeof value === 'number' ? value : 1);

		let val = this.get(attr);
		this.set(attr, val + value);
		return this;
	}

	/**
	 * This will decrement an attribute.
	 *
	 * @param {string} attr
	 * @param {number|null} value
	 * @returns {this}
	 */
	decrement(attr, value = null)
	{
		if (typeof attr === 'undefined')
		{
			return this;
		}

		// this will ensure we have a number value
		value = (value !== null && typeof value === 'number' ? value : 1);

		let val = this.get(attr);
		this.set(attr, val - value);
		return this;
	}

	/**
	 * This will concat an attribute.
	 *
	 * @param {string} attr
	 * @returns {this}
	 */
	concat(attr, value)
	{
		if (typeof attr === 'undefined')
		{
			return this;
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
	 * @returns {this}
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
	 * An optional version can be passed to scope the stored
	 * data to a release. Bumping the version after a deploy
	 * that changes the stored data shape prevents resuming
	 * stale, incompatible structures.
	 *
	 * @param {string} key
	 * @param {string|number} [version]
	 * @returns {this}
	 */
	setKey(key, version)
	{
		this.key = (version !== undefined && version !== null)? key + ':v' + version : key;
		return this;
	}

	/**
	 * This will restore the data from local storage.
	 *
	 * @param {*} defaultValue
	 * @returns {this}
	 */
	resume(defaultValue)
	{
		const data = LocalData.resume(String(this.key), defaultValue);
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
		return LocalData.store(String(this.key), data);
	}

	/**
	 * This will delete a property value or the model data.
	 *
	 * @param {object|string|null} [attrName]
	 * @returns {this}
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
	 * @returns {number|Array<number>}
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
	 * @returns {number} The subscription token.
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

		const remoteToken = this.on(childAttr, (propValue, committer) =>
		{
			if (committer === data)
			{
				return false;
			}

			data.set(attr, propValue, this);
		});

		/**
		 * Both sides record the attr they subscribed on plus the
		 * paired token, so releasing either direction can tear down
		 * the whole link instead of leaving the other side holding a
		 * subscription and a reference back.
		 */
		this.addLink(token, data, attr, remoteToken);
		data.addLink(remoteToken, this, childAttr, token);
		return token;
	}

	/**
	 * This will add a link token to the links map.
	 *
	 * The attr name is what makes the link removable: subscriptions
	 * are registered per attr message, so a record without one can
	 * only be forgotten, not unsubscribed.
	 *
	 * @param {number} token
	 * @param {object} data
	 * @param {string} [attr]
	 * @param {number} [pair] The token of the opposite direction.
	 * @returns {void}
	 */
	addLink(token, data, attr, pair)
	{
		this.links.set(token, { data, attr, pair });
	}

	/**
	 * This will remove a link or all links if no token is provided.
	 *
	 * @param {number|null} [token=null]
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
		if (links.size === 0)
		{
			return;
		}

		links.forEach((link, linkToken) =>
		{
			this.removeLink(linkToken, false);
		});
		links.clear();
	}

	/**
	 * This will remove the linked subscription.
	 *
	 * @param {number} token
	 * @param {boolean} [removeFromLinks=true]
	 * @returns {void}
	 */
	removeLink(token, removeFromLinks = true)
	{
		const link = this.links.get(token);
		if (link)
		{
			const data = link.data;
			if (link.attr)
			{
				data.off(link.attr, token);
			}

			/**
			 * The opposite direction is dropped here as well. Without
			 * it the other source keeps both the callBack and a link
			 * record pointing back at this source.
			 */
			const pair = link.pair;
			const pairLinks = pair && data.links;
			if (pairLinks)
			{
				const pairLink = pairLinks.get(pair);
				if (pairLink)
				{
					pairLinks.delete(pair);
					if (pairLink.attr)
					{
						this.off(pairLink.attr, pair);
					}
				}
			}
		}

		if (removeFromLinks === false)
		{
			return;
		}

		this.links.delete(token);
	}
}

BasicData.prototype.isData = true;