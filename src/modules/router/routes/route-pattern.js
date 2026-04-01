/**
 * Pre-compiled regex patterns to avoid recompilation on each call.
 * @private
 */
const OPTIONAL_SLASH_RE = /(\/):[^/(]*?\?/g;
const SLASH_RE = /\//g;
const TRAILING_OPTIONAL_RE = /(\?\/+\*?)/g;
const PARAM_RE = /(:[^/?&($]+)/g;
const WILDCARD_RE = /(\*)/g;

/**
 * Sets up optional slashes before the optional params.
 *
 * @param {string} uriQuery - The URI query to process.
 * @returns {string} - The processed URI query.
 */
const setupOptionalSlashes = (uriQuery) =>
{
	return uriQuery.replace(OPTIONAL_SLASH_RE, (str) => str.replace(SLASH_RE, '(?:$|/)'));
};

/**
 * Sets up optional params and params and stops at the last slash or query start.
 *
 * @param {string} uriQuery - The URI query to process.
 * @returns {string} - The processed URI query.
 */
const setupOptionalParams = (uriQuery) =>
{
    uriQuery = uriQuery.replace(TRAILING_OPTIONAL_RE, '?/*');
    return uriQuery.replace(PARAM_RE, (str) => (str.indexOf('.') < 0) ? '([^/|?]+)' : '([^/|?]+.*)');
};

/**
 * Sets up the wildcard and param checks to be modified to the route URI string.
 *
 * @param {string} uriQuery - The URI query to process.
 * @returns {string} - The processed URI query.
 */
const setupWildcard = (uriQuery) => uriQuery.replace(WILDCARD_RE, '.*');

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

    let uriQuery = uri;
    uriQuery = setupOptionalSlashes(uriQuery);
    uriQuery = setupOptionalParams(uriQuery);
    uriQuery = setupWildcard(uriQuery);
    uriQuery = setStringEnd(uriQuery, uri);
    return uriQuery;
};