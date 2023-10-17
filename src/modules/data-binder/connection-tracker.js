import {base} from '../../main/core.js';

/**
 * ConnectionTracker
 *
 * This will create a new connection tracker to track active
 * connections in the data binder.
 * @class
 */
export class ConnectionTracker
{
	/**
	 * @constructor
	 */
	constructor()
	{
		/**
		 * @member {object} connections
		 */
		this.connections = {};
	}

	/**
	 * This will add a new connection to be tracked.
	 *
	 * @param {string} id
	 * @param {string} attr
	 * @param {object} connection
	 * @return {object}
	 */
	add(id, attr, connection)
	{
		let connections = this.find(id);
		return (connections[attr] = connection);
	}

	/**
	 * This will get a connection.
	 *
	 * @param {string} id
	 * @param {string} attr
	 * @return {(object|bool)}
	 */
	get(id, attr)
	{
		let connections = this.connections[id];
		if(connections)
		{
			return (connections[attr] || false);
		}
		return false;
	}

	/**
	 * This will find a connection.
	 *
	 * @param {string} id
	 * @return {object}
	 */
	find(id)
	{
		let connections = this.connections;
		return (connections[id] || (connections[id] = {}));
	}

	/**
	 * This will remove a connection or all connections by id.
	 * @param {string} id
	 * @param {string} [attr]
	 */
	remove(id, attr)
	{
		let connections = this.connections[id];
		if(!connections)
		{
			return false;
		}

		let connection;
		if(attr)
		{
			connection = connections[attr];
			if(connection)
			{
				connection.unsubscribe();
				delete connections[attr];
			}

			/* this will remove the msg from the elements
			if no elements are listed under the msg */
			if(base.isEmpty(connections))
			{
				delete this.connections[id];
			}
		}
		else
		{
			for(var prop in connections)
			{
				if(connections.hasOwnProperty(prop))
				{
					connection = connections[prop];
					if(connection)
					{
						connection.unsubscribe();
					}
				}
			}

			delete this.connections[id];
		}
	}
}