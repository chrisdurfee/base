/**
 * Utils
 *
 * These are some helper functions for the router.
 *
 * @constant
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
		if (uri[0] === '/')
		{
			uri = uri.substring(1);
		}

		/**
		 * Remove the last slash.
		 */
		if (uri[uri.length - 1] === '/')
		{
			uri = uri.substring(0, uri.length - 1);
		}

		return uri;
	},

	/**
	 * This will get the pathname style uri from a hash url.
	 *
	 * The hashchange event reports absolute urls, but route patterns
	 * are anchored against the uri that `Router.getPath()` produces
	 * for hash routing, which is the hash without its '#'.
	 *
	 * @param {string} url
	 * @returns {string}
	 */
	getHashUri(url)
	{
		if (typeof url !== 'string')
		{
			return '';
		}

		const index = url.indexOf('#');
		return (index === -1)? '' : url.substring(index + 1);
	}
};