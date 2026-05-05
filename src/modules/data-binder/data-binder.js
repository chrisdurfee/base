import { Events } from '../../main/events/events.js';
import { Types } from '../../shared/types.js';
import { ConnectionTracker } from './connection-tracker/connection-tracker.js';
import { OneWayConnection } from './connection-tracker/connections/one-way-connection.js';
import { TwoWayConnection } from './connection-tracker/connections/two-way-connection.js';
import { DataPubSub } from './data-pub-sub.js';

/**
 * DataBinder
 *
 * This will create a data binder object that can
 * create one way and two way data bindings.
 *
 * @class
 */
export class DataBinder
{
	/**
	 * This will create a data binder.
	 *
	 * @constructor
	 */
	constructor()
	{
		/**
		 * @type {string} version
		 */
		this.version = "1.0.1";

		/**
		 * @type {string} attr
		 */
		this.attr = 'bindId';

		/**
		 * @type {Set<number>} blockedKeys
		 * @protected
		 */
		this.blockedKeys = new Set([
			20, //caps lock
			37, //arrows
			38,
			39,
			40
		]);

		/**
		 * @type {object} connections
		 * @protected
		 */
		this.connections = new ConnectionTracker();

		/**
		 * @type {object} pubSub
		 * @protected
		 */
		this.pubSub = new DataPubSub();

		/**
		 * @type {number} idCount
		 */
		this.idCount = 0;
		this.setup();
	}

	/**
	 * This will setup the events.
	 *
	 * @protected
	 * @returns {void}
	 */
	setup()
	{
		this.setupEvents();
	}

	/**
	 * This will bind an element to a data property.
	 *
	 * @param {object} element
	 * @param {object} data
	 * @param {string} prop
	 * @param {string|function} filter
	 * @returns {this} an instance of the databinder.
	 */
	bind(element, data, prop, filter)
	{
		let bindProp = prop,
		bindAttr = null;

		const colonIdx = prop.indexOf(':');
		if (colonIdx !== -1)
		{
			/* this will setup the custom attr if the prop
			has specified one. */
			bindAttr = prop.substring(0, colonIdx);
			bindProp = prop.substring(colonIdx + 1);
		}

		/**
		 * This will setup the model bind attr to the element
		 * and assign a bind id attr to support two way
		 * binding.
		 */
		const attr = bindAttr ?? '';
		const connection = this.setupConnection(element, data, bindProp, attr, filter);

		/**
		 * We want to get the starting value of the data and
		 * et it on our element.
		 */
		const connectionElement = connection.element;
		let value = data.get(bindProp);
		if (typeof value !== 'undefined')
		{
			connectionElement.set(value);
		}
		else
		{
			/**
			 * This will set the element value as the
			 * prop value.
			 */
			value = connectionElement.get();
			if (value !== '')
			{
				connection.data.set(value);
			}
		}
		return this;
	}

	/**
	 * This will bind an element to a data property.
	 *
	 * @protected
	 * @param {object} element
	 * @param {object} data
	 * @param {string} prop
	 * @param {string} customAttr
	 * @param {string|function} filter
	 * @returns {object} The new connection.
	 */
	setupConnection(element, data, prop, customAttr, filter)
	{
		const id = this.getBindId(element),
		connection = new TwoWayConnection(this.pubSub),

		/**
		 * This will create the data source and
		 * subscribe the element to the data.
		 */
		dataSource = connection.addData(data, prop);
		dataSource.subscribe(id);

		/**
		 * This will add the data binding attr to our
		 * element so it will subscribe to the two
		 * data changes.
		 */
		const dataId = data.getDataId();
		const msg = `${dataId}:${prop}`;

		/**
		 * This will create the element source and subscribe
		 * the data to the element.
		 */
		const elementSource = connection.addElement(element, customAttr, filter);
		elementSource.subscribe(msg);

		this.addConnection(id, 'bind', connection);

		return connection;
	}

	/**
	 * This will add a new connection to the
	 * connection tracker.
	 *
	 * @protected
	 * @param {string} id
	 * @param {string} attr
	 * @param {object} connection
	 * @returns {this}
	 */
	addConnection(id, attr, connection)
	{
		this.connections.add(id, attr, connection);
		return this;
	}

	/**
	 * This will set the bind id.
	 *
	 * @protected
	 * @param {object} element
	 * @returns {string}
	 */
	setBindId(element)
	{
		const id = 'db-' + this.idCount++;
		element[this.attr] = id;
		return id;
	}

	/**
	 * This will get the bind id.
	 *
	 * @protected
	 * @param {object} element
	 * @returns {string}
	 */
	getBindId(element)
	{
		return element[this.attr] || this.setBindId(element);
	}

	/**
	 * This will unbind the element.
	 *
	 * @param {object} element
	 * @returns {this} an instance of the data binder.
	 */
	unbind(element)
	{
		const id = element[this.attr];
		if (id)
		{
			this.connections.remove(id);
		}
		return this;
	}

	/**
	 * This will setup a watcher for an element.
	 *
	 * @param {object} element
	 * @param {object} data
	 * @param {string} prop
	 * @param {function} callBack
	 * @returns {this}
	 */
	watch(element, data, prop, callBack)
	{
		if (Types.isObject(element) === false)
		{
			return this;
		}

		const connection = new OneWayConnection();

		/**
		 * This will get the starting value of the data before subscribing
		 * so we can guard against double-fire. If the data was set before
		 * watch() is called, the batched microtask event is still pending.
		 * Subscribing would cause the callback to fire twice: once
		 * immediately below and once when the microtask flushes with the
		 * same value. We skip that first subscription event when it matches
		 * the value we are about to fire synchronously.
		 */
		const value = data.get(prop);
		let skipFirstSameValue = true;
		const guardedCallBack = (newValue) =>
		{
			if (skipFirstSameValue)
			{
				skipFirstSameValue = false;
				if (newValue === value)
				{
					return;
				}
			}
			callBack(newValue);
		};

		/**
		 * This will setup the data source and subscribe
		 * the element to the data.
		 */
		const source = connection.addSource(data);
		source.subscribe(prop, guardedCallBack);

		// this will add the new connection to the connection tracker
		const id = this.getBindId(element),
		attr = data.getDataId() + ':' + prop;
		this.addConnection(id, attr, connection);

		/**
		 * This will call the callback with the starting value of the data.
		 */
		callBack(value);
		return this;
	}

	/**
	 * Sets up a one-way watcher across multiple properties on the same
	 * data source, sharing a single connection, source, and outer
	 * callback. Used by `WatcherHelper.addDataWatcher` to avoid
	 * allocating one `OneWayConnection` + `OneWaySource` per property
	 * for multi-token watchers like `'[[a]] - [[b]]'`.
	 *
	 * The shared `callBack` is invoked once during setup (matches the
	 * per-prop `watch()` behaviour for the first prop) and then on each
	 * subsequent change to any watched prop. Per-prop guards skip the
	 * first batched event when its value matches the value read at
	 * setup time, mirroring the double-fire guard in `watch()`.
	 *
	 * @param {object} element
	 * @param {object} data
	 * @param {Array<string>} props
	 * @param {function} callBack
	 * @returns {this}
	 */
	watchMany(element, data, props, callBack)
	{
		if (Types.isObject(element) === false)
		{
			return this;
		}

		const len = props ? props.length : 0;
		if (len === 0)
		{
			return this;
		}

		/* Single-prop fast path delegates to watch() so the existing
		 * guarded-callback semantics are preserved exactly. */
		if (len === 1)
		{
			return this.watch(element, data, props[0], callBack);
		}

		const connection = new OneWayConnection();
		const source = connection.addSource(data);

		/* Capture initial values so we can skip the first batched
		 * event per prop when it matches (avoids the double-fire that
		 * watch() guards against). */
		const initials = new Array(len);
		const skip = new Array(len);
		for (let i = 0; i < len; i++)
		{
			initials[i] = data.get(props[i]);
			skip[i] = true;
		}

		/* Build per-prop guard wrappers that share the outer callBack.
		 * Closures are tiny; the savings come from one Connection,
		 * one Source, and one connection-tracker entry instead of N. */
		const wrappers = new Array(len);
		for (let i = 0; i < len; i++)
		{
			const idx = i;
			const initial = initials[i];
			wrappers[i] = (newValue) =>
			{
				if (skip[idx])
				{
					skip[idx] = false;
					if (newValue === initial)
					{
						return;
					}
				}
				callBack(newValue);
			};
		}

		/* Subscribe each msg with its own wrapper, but stored under a
		 * single source so unsubscribe tears them all down together. */
		if (typeof data.on !== 'function')
		{
			console.warn('DataBinder.watchMany: data source has no "on" method.', data);
			return this;
		}

		const subs = new Array(len);
		for (let i = 0; i < len; i++)
		{
			subs[i] = { msg: props[i], token: data.on(props[i], wrappers[i]) };
		}
		source.subscriptions = subs;

		const id = this.getBindId(element);
		const attr = data.getDataId() + ':' + props.join(',');
		this.addConnection(id, attr, connection);

		/* Fire once with the first prop value. The WatcherHelper
		 * multi-prop callBack re-reads all values via getPropValues,
		 * so a single invocation produces the same DOM as the prior
		 * N-invocation behaviour from chained watch() calls. */
		callBack(initials[0]);
		return this;
	}

	/**
	 * This will remove a watcher from an element.
	 *
	 * @param {object} element
	 * @param {object} data
	 * @param {string} prop
	 * @returns {this}
	 */
	unwatch(element, data, prop)
	{
		if (Types.isObject(element) === false)
		{
			return this;
		}

		const id = element[this.attr];
		if (id)
		{
			const attr = data.getDataId() + ':' + prop;
			this.connections.remove(id, attr);
		}
		return this;
	}

	/**
	 * This will publish to the pub sub.
	 *
	 * @param {string} msg
	 * @param {*} value
	 * @param {object} committer
	 * @returns {this} an instance of the data binder.
	 */
	publish(msg, value, committer)
	{
		this.pubSub.publish(msg, value, committer);
		return this;
	}

	/**
	 * This will check if an element is bound.
	 *
	 * @protected
	 * @param {object} element
	 * @returns {?string}
	 */
	isDataBound(element)
	{
		if (!element)
		{
			return null;
		}

		const id = element[this.attr];
		return (id) ? id : null;
	}

	/**
	 * This will check if the key is blocked.
	 *
	 * @protected
	 * @param {object} evt
	 * @returns {boolean}
	 */
	isBlocked(evt)
	{
		if (evt.type !== 'keyup')
		{
			return false;
		}

		/* this will check to block ctrl, shift or alt +
		buttons */
		return (this.blockedKeys.has(evt.keyCode));
	}

	/**
	 * This is the callBack for the chnage event.
	 *
	 * @param {object} evt
	 */
	bindHandler(evt)
	{
		if (this.isBlocked(evt))
		{
			return true;
		}

		const target = evt.target || evt.srcElement,
		id = this.isDataBound(target);
		if (id !== null)
		{
			const connection = this.connections.get(id, 'bind');
			if (connection)
			{
				const value = connection.element.get();
				/* this will publish to the ui and to the
				model that subscribes to the element */
				this.pubSub.publish(id, value, target);
			}
		}
		evt.stopPropagation();
	}

	/**
	 * This wil setup the events.
	 *
	 * @protected
	 * @returns {void}
	 */
	setupEvents()
	{
		/**
		 * @type {function} changeHandler
		 */
		this.changeHandler = this.bindHandler.bind(this);
		this.addEvents();
	}

	/**
	 * This will add the events.
	 *
	 * @protected
	 * @returns {void}
	 */
	addEvents()
	{
		if (typeof document !== 'undefined')
		{
			// @ts-ignore
			Events.on(["change", "paste", "input"], document, this.changeHandler, false);
		}
	}

	/**
	 * This will remove the events.
	 *
	 * @protected
	 * @returns {void}
	 */
	removeEvents()
	{
		if (typeof document !== 'undefined')
		{
			// @ts-ignore
			Events.off(["change", "paste", "input"], document, this.changeHandler, false);
		}
	}
}

export const dataBinder = new DataBinder();