/**
 * Source
 *
 * This will create a new source to use with
 * a connection.
 *
 * @class
 */
export class Source
{
	/**
	 * This will create a new source.
	 *
	 * @constructor
	 */
	constructor()
	{
		/**
		 * @type {string|null} msg
		 * @protected
		 */
		this.msg = null;

		/**
		 * @type {string|null} token
		 */
		this.token = null;
	}

	/**
	 * This will set the token.
	 *
	 * @param {string} token
	 * @returns {void}
	 */
	setToken(token)
	{
		this.token = token;
	}
}