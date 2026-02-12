import { DataSource } from '../../sources/data-source.js';
import { ElementSource } from '../../sources/element-source.js';
import { Connection } from './connection.js';

/**
 * TwoWayConnection
 *
 * This will setup a two way connection.
 *
 * @class
 * @augments Connection
 */
export class TwoWayConnection extends Connection
{
	/**
	 * This will create a two way connection.
	 *
	 * @param {object} pubSub
	 * @constructor
	 */
	constructor(pubSub)
	{
		super();

		/**
		 * @type {object|null} element
		 */
		this.element = null;

		/**
		 * @type {object|null} data
		 */
		this.data = null;

		/**
		 * @type {object} pubSub
		 */
		this.pubSub = pubSub;
	}

	/**
	 * This will add the element source.
	 *
	 * @param {object} element
	 * @param {string} attr
	 * @param {(string|function)} filter
	 * @returns {object}
	 */
	addElement(element, attr, filter)
	{
		return (this.element = new ElementSource(element, attr, filter, this.pubSub));
	}

	/**
	 * This will add the data source.
	 *
	 * @param {object} data
	 * @param {string} prop
	 * @returns {object}
	 */
	addData(data, prop)
	{
		return (this.data = new DataSource(data, prop, this.pubSub));
	}

	/**
	 * This will unsubscribe from a source.
	 *
	 * @param {object} source
	 * @returns {object}
	 */
	unsubscribeSource(source)
	{
		if (source)
		{
			source.unsubscribe();
		}
		return this;
	}

	/**
	 * This will be used to unsubscribe.
	 *
	 * @override
	 * @returns {object}
	 */
	unsubscribe()
	{
		this.unsubscribeSource(this.element);
		this.unsubscribeSource(this.data);

		this.element = null;
		this.data = null;
		return this;
	}
}