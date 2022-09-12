import {OneWaySource} from './one-way-source.js';
import {Connection} from './connection.js';

/**
 * OneWayConnection
 *
 * This will create a one way connection.
 * @class
 * @augments Connection
 */
export class OneWayConnection extends Connection
{
	/**
	 * @constructor
	 */
	constructor()
	{
		super();

		/**
		 * @member {object} source
		 */
		this.source = null;
	}

	/**
	 * This will setup the connection source.
	 *
	 * @param {object} data
	 * @return {object}
	 */
	addSource(data)
	{
		return (this.source = new OneWaySource(data));
	}

	/**
	 * This will be used to unsubscribe.
	 * @override
	 */
	unsubscribe()
	{
		this.source.unsubscribe();
		this.source = null;
	}
}