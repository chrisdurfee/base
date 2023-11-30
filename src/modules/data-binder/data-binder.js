import { Events } from '../../main/events/events.js';
import { Types } from '../../shared/types.js';
import { ConnectionTracker } from './connection-tracker/connection-tracker.js';
import { OneWayConnection } from './connection-tracker/connections/one-way-connection.js';
import { TwoWayConnection } from './connection-tracker/connections/two-way-connection.js';
import { DataPubSub } from './data-pub-sub.js';
export { DataPubSub } from './data-pub-sub.js';

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
		 * @member {string} version
		 */
		this.version = "1.0.1";

		/**
		 * @member {string} attr
		 */
		this.attr = 'bindId';

		/**
		 * @member {array} blockedKeys
		 * @protected
		 */
		this.blockedKeys = [
			20, //caps lock
			37, //arrows
			38,
			39,
			40
		];

		/**
		 * @member {object} connections
		 * @protected
		 */
		this.connections = new ConnectionTracker();

		/**
		 * @member {object} pubSub
		 * @protected
		 */
		this.pubSub = new DataPubSub();

		/**
		 * @member {number} idCount
		 */
		this.idCount = 0;
		this.setup();
	}

	/**
	 * This will setup the events.
	 *
	 * @protected
	 * @return {void}
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
	 * @param {(string|function)} [filter]
	 * @return {object} an instance of the databinder.
	 */
	bind(element, data, prop, filter)
	{
		let bindProp = prop,
		bindAttr = null;

		if (prop.indexOf(':') !== -1)
		{
			/* this will setup the custom attr if the prop
			has specified one. */
			const parts = prop.split(':');
			if (parts.length > 1)
			{
				bindProp = parts[1];
				bindAttr = parts[0];
			}
		}

		/**
		 * This will setup the model bind attr to the element
		 * and assign a bind id attr to support two way
		 * binding.
		 */
		const connection = this.setupConnection(element, data, bindProp, bindAttr, filter);

		/**
		 * We want to get the starting value of the data and
		 * et it on our element.
		 */
		const connectionElement = connection.element,
		value = data.get(bindProp);
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
	 * @param {(string|function)} [filter]
	 * @return {object} The new connection.
	 */
	setupConnection(element, data, prop, customAttr, filter)
	{
		const id = this.getBindId(element),
		connection = new TwoWayConnection(),

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
		const dataId = data.getDataId(),
		msg = dataId + ':' + prop;

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
	 * @return {void}
	 */
	addConnection(id, attr, connection)
	{
		this.connections.add(id, attr, connection);
	}

	/**
	 * This will set the bind id.
	 *
	 * @protected
	 * @param {object} element
	 * @return {string}
	 */
	setBindId(element)
	{
		const id = 'db-' + this.idCount++;
		element.dataset[this.attr] = id;
		element[this.attr] = id;
		return id;
	}

	/**
	 * This will get the bind id.
	 *
	 * @protected
	 * @param {object} element
	 * @return {string}
	 */
	getBindId(element)
	{
		return element[this.attr] || this.setBindId(element);
	}

	/**
	 * This will unbind the element.
	 *
	 * @param {object} element
	 * @return {object} an instance of the data binder.
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
	 * @return {void}
	 */
	watch(element, data, prop, callBack)
	{
		if (!element || typeof element !== 'object')
		{
			return;
		}

		const connection = new OneWayConnection();

		/**
		 * This will setup the data source and subscribe
		 * the element to the data.
		 */
		const source = connection.addSource(data);
		source.subscribe(prop, callBack);

		// this will add the new connection to the connection tracker
		const id = this.getBindId(element),
		attr = data.getDataId() + ':' + prop;
		this.addConnection(id, attr, connection);

		const value = data.get(prop);
		if (typeof value !== 'undefined')
		{
			callBack(value);
		}
	}

	/**
	 * This will remove a watcher from an element.
	 *
	 * @param {object} element
	 * @param {object} data
	 * @param {string} prop
	 * @return {void}
	 */
	unwatch(element, data, prop)
	{
		if (Types.isObject(element) === false)
		{
			return false;
		}

		const id = element[this.attr];
		if (id)
		{
			const attr = data.getDataId() + ':' + prop;
			this.connections.remove(id, attr);
		}
	}

	/**
	 * This will publish to the pub sub.
	 *
	 * @param {string} msg
	 * @param {*} value
	 * @param {object} committer
	 * @return {object} an instance of the data binder.
	 */
	publish(msg, value, committer)
	{
		pubSub.publish(msg, value, committer);
		return this;
	}

	/**
	 * This will check if an element is bound.
	 *
	 * @protected
	 * @param {object} element
	 * @return {boolean}
	 */
	isDataBound(element)
	{
		if (!element)
		{
			return false;
		}

		const id = element[this.attr];
		return (id) ? id : false;
	}

	/**
	 * This will check if the key is blocked.
	 *
	 * @protected
	 * @param {object} evt
	 * @return {boolean}
	 */
	isBlocked(evt)
	{
		if (evt.type !== 'keyup')
		{
			return false;
		}

		/* this will check to block ctrl, shift or alt +
		buttons */
		return (this.blockedKeys.indexOf(evt.keyCode) !== -1);
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
		if (id)
		{
			const connection = this.connections.get(id, 'bind');
			if (connection)
			{
				const value = connection.element.get();
				/* this will publish to the ui and to the
				model that subscribes to the element */
				pubSub.publish(id, value, target);
			}
		}
		evt.stopPropagation();
	}

	/**
	 * This wil setup the events.
	 *
	 * @protected
	 * @return {void}
	 */
	setupEvents()
	{
		this.changeHandler = this.bindHandler.bind(this);
		this.addEvents();
	}

	/**
	 * This will add the events.
	 *
	 * @protected
	 * @return {void}
	 */
	addEvents()
	{
		Events.on(["change", "paste", "input"], document, this.changeHandler, false);
	}

	/**
	 * This will remove the events.
	 *
	 * @protected
	 * @return {void}
	 */
	removeEvents()
	{
		Events.off(["change", "paste", "input"], document, this.changeHandler, false);
	}
}

export const dataBinder = new DataBinder();