
/**
 * ConnectionTracker
 *
 * Tracks active connections in the data binder. Supports multiple
 * connections per element+attribute pair.
 *
 * @class
 */
export class ConnectionTracker
{
	/**
	 * Creates a connection tracker.
	 *
	 * @constructor
	 */
	constructor()
	{
		/**
		 * @type {Map<string, Map<string, object|object[]>>} connections
		 */
		this.connections = new Map();
	}

	/**
	 * Adds a connection to be tracked.
	 *
	 * @param {string} id
	 * @param {string} attr
	 * @param {object} connection
	 * @returns {object}
	 */
	add(id, attr, connection)
	{
		const attrMap = this.getOrCreate(id);
		const existing = attrMap.get(attr);
		if (!existing)
		{
			attrMap.set(attr, connection);
		}
		else if (Array.isArray(existing))
		{
			existing.push(connection);
		}
		else
		{
			attrMap.set(attr, [existing, connection]);
		}

		return connection;
	}

	/**
	 * Gets the most recent connection for an element+attribute.
	 *
	 * @param {string} id
	 * @param {string} attr
	 * @returns {object|false}
	 */
	get(id, attr)
	{
		const value = this.connections.get(id)?.get(attr);
		if (!value)
		{
			return false;
		}

		return Array.isArray(value) ? (value[value.length - 1] || false) : value;
	}

	/**
	 * Gets or creates the attribute map for an element.
	 *
	 * @param {string} id
	 * @returns {Map<string, object|object[]>}
	 */
	getOrCreate(id)
	{
		let attrMap = this.connections.get(id);
		if (!attrMap)
		{
			attrMap = new Map();
			this.connections.set(id, attrMap);
		}
		return attrMap;
	}

	/**
	 * Removes connections by id, or by id+attr.
	 *
	 * @param {string} id
	 * @param {string} [attr]
	 * @returns {void}
	 */
	remove(id, attr)
	{
		const attrMap = this.connections.get(id);
		if (!attrMap)
		{
			return;
		}

		if (attr)
		{
			this.unsubscribe(attrMap.get(attr));
			attrMap.delete(attr);

			if (attrMap.size === 0)
			{
				this.connections.delete(id);
			}
		}
		else
		{
			for (const connection of attrMap.values())
			{
				this.unsubscribe(connection);
			}
			this.connections.delete(id);
		}
	}

	/**
	 * Unsubscribes a connection or array of connections.
	 *
	 * @private
	 * @param {object|object[]|undefined} connection
	 * @returns {void}
	 */
	unsubscribe(connection)
	{
		if (!connection)
		{
			return;
		}

		if (Array.isArray(connection))
		{
			for (let i = 0, len = connection.length; i < len; i++)
			{
				connection[i]?.unsubscribe();
			}
		}
		else
		{
			connection.unsubscribe();
		}
	}
}