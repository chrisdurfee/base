/**
 * This is the default xhr (ajax) settings.
 */
export const XhrDefaultSettings =
{
	/**
	 * @type {string} url This is the url of the server
	 */
	url: '',

	/**
	 * @type {string} params This is the responseType of the server
	 */
	responseType: 'json',

	/**
	 * @type {string} method This is the method of the request
	 */
	method: 'POST',

	/**
	 * @type {object|string} params This can fix a param string
	 * to be added to every ajax request.
	 */
	fixedParams: '',

	/**
	 * @type {object} headers This is the headers of the request
	 */
	headers:
	{
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
	},

	/**
	 * @type {Array<any>} beforeSend This is an array of callbacks
	 */
	beforeSend: [],

	/**
	 * @type {boolean} async This is the async of the request
	 */
	async: true,

	/**
	 * @type {boolean} crossDomain This will allow cross domain requests
	 */
	crossDomain: false,

	/**
	 * @type {boolean} withCredentials CORS with credentials
	 */
	withCredentials: false,

	/**
	 * @type {function|null} completed This is the completed callback
	 */
	completed: null,

	/**
	 * @type {function|null} failed This is the failed callback
	 */
	failed: null,

	/**
	 * @type {function|null} aborted This is the aborted callback
	 */
	aborted: null,

	/**
	 * @type {function|null} progress This is the progress callback
	 */
	progress: null
};
