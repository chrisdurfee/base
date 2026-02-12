import { OneWaySource } from '../../sources/one-way-source.js';
import { Connection } from './connection.js';

/**
 * OneWayConnection
 *
 * This will create a one way connection.
 *
 * @class
 * @augments Connection
 */
export class OneWayConnection extends Connection
{
	/**
	 * This will create a one way connection.
	 *
	 * @constructor
	 */
	constructor()
	{
		super();

		/**
		 * @type {object|null} source
		 */
		this.source = null;
	}

	/**
	 * This will setup the connection source.
	 *
	 * @param {object} data
	 * @returns {object}
	 */
	addSource(data)
	{
		return (this.source = new OneWaySource(data));
	}

	/**
	 * This will be used to unsubscribe.
	 *
	 * @override
	 * @returns {void}
	 */
	unsubscribe()
	{
		this.source.unsubscribe();
		this.source = null;
	}
}