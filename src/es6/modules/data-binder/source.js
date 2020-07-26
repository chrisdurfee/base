/**
 * Source
 *
 * This will create a new source to use with
 * a connection.
 * @class
 */
export class Source
{
	/**
	 * @constructor
	 */
	constructor()
	{
		/**
		 * @member {string} msg
		 * @protected
		 */
		this.msg = null;

		/**
		 * @member {string} token
		 */
		this.token = null;
	}

	/**
	 * This will set the token.
	 *
	 * @param {string} token
	 */
	setToken(token)
	{
		this.token = token;
	}
}