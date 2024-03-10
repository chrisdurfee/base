/**
 * Replaces all slashes in the URI.
 *
 * @param {string} uri - The URI to process.
 * @returns {string} - The processed URI.
 */
const replaceSlashes = (uri) => uri.replace(/\//g, "/");

/**
 * Sets up optional slashes before the optional params.
 *
 * @param {string} uriQuery - The URI query to process.
 * @returns {string} - The processed URI query.
 */
const setupOptionalSlashes = (uriQuery) =>
{
	return uriQuery.replace(/(\/):[^/(]*?\?/g, (str) => str.replace(/\//g, '(?:$|/)'));
};

/**
 * Sets up optional params and params and stops at the last slash or query start.
 *
 * @param {string} uriQuery - The URI query to process.
 * @returns {string} - The processed URI query.
 */
const setupOptionalParams = (uriQuery) =>
{
    uriQuery = uriQuery.replace(/(\?\/+\*?)/g, '?/*');
    return uriQuery.replace(/(:[^/?&($]+)/g, (str) => (str.indexOf('.') < 0) ? '([^/|?]+)' : '([^/|?]+.*)');
};

/**
 * Sets up the wildcard and param checks to be modified to the route URI string.
 *
 * @param {string} uriQuery - The URI query to process.
 * @returns {string} - The processed URI query.
 */
const setupWildcard = (uriQuery) => uriQuery.replace(/(\*)/g, '.*');

/**
 * Sets the string end if the wildcard is not set.
 *
 * @param {string} uriQuery - The URI query to process.
 * @param {string} uri - The original URI.
 * @returns {string} - The processed URI query.
 */
const setStringEnd = (uriQuery, uri) => uriQuery += (uri[uri.length - 1] === '*') ? '' : '$';

/**
 * Sets up a route URI pattern.
 *
 * @param {string} uri - The URI to process.
 * @returns {string} - The processed URI pattern.
 */
export const routePattern = (uri) =>
{
    if (!uri)
	{
        return '';
    }

    let uriQuery = replaceSlashes(uri);
    uriQuery = setupOptionalSlashes(uriQuery);
    uriQuery = setupOptionalParams(uriQuery);
    uriQuery = setupWildcard(uriQuery);
    uriQuery = setStringEnd(uriQuery, uri);
    return uriQuery;
};