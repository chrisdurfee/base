/**
 * Utils
 *
 * These are some helper functions for the router.
 */
export const Utils =
{
	/**
	 * This will remove the begining and ending slashes from a url.
	 *
	 * @param {string} uri
	 * @returns {string}
	 */
	removeSlashes(uri)
	{
		if (typeof uri !== 'string')
		{
			return '';
		}

		/**
		 * Remove the first slash.
		 */
		if (uri.substring(0, 1) === '/')
		{
			uri = uri.substring(1);
		}

		/**
		 * Remove the last slash.
		 */
		if (uri.substring(-1) === '/')
		{
			uri = uri.substring(0, uri.length - 1);
		}

		return uri;
	}
};