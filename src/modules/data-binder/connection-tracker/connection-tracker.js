
/**
 * ConnectionTracker
 *
 * This will create a new connection tracker to track active
 * connections in the data binder.
 *
 * @class
 */
export class ConnectionTracker
{
	/**
	 * This will create a connection tracker.
	 *
	 * @constructor
	 */
	constructor()
	{
		/**
		 * @member {Map} connections
		 */
		this.connections = new Map();
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
		const connections = this.find(id);
		connections.set(attr, connection);
		return connection;
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
		const connections = this.connections.get(id);
		if (connections)
		{
			return (connections.get(attr) || false);
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
		const connections = this.connections.get(id);
		if (connections)
		{
			return connections;
		}

		const map = new Map();
		this.connections.set(id, map);
		return map;
	}

	/**
	 * This will remove a connection or all connections by id.
	 * @param {string} id
	 * @param {string} [attr]
	 * @return {void}
	 */
	remove(id, attr)
	{
		const connections = this.connections.get(id);
		if (!connections)
		{
			return;
		}

		let connection;
		if (attr)
		{
			connection = connections.get(attr);
			if (connection)
			{
				connection.unsubscribe();
				connections.delete(attr);
			}

			/* this will remove the msg from the elements
			if no elements are listed under the msg */
			if (connections.size === 0)
			{
				this.connections.delete(id);
			}
		}
		else
		{
			for (let prop of connections)
			{
				connection = connections.get(prop);
				if (connection)
				{
					connection.unsubscribe();
				}
			}

			this.connections.delete(id);
		}
	}
}