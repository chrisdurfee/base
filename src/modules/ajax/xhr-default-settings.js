/**
 * This is the default xhr (ajax) settings.
 */
export const XhrDefaultSettings =
{
	/**
	 * @member {string} url This is the url of the server
	 */
	url: '',

	/**
	 * @member {string} params This is the responseType of the server
	 */
	responseType: 'json',

	/**
	 * @member {string} method This is the method of the request
	 */
	method: 'POST',

	/**
	 * @member {object|string} params This can fix a param string
	 * to be added to every ajax request.
	 */
	fixedParams: '',

	/**
	 * @member {object} headers This is the headers of the request
	 */
	headers:
	{
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
	},

	/**
	 * @member {array} beforeSend This is an array of callbacks
	 */
	beforeSend: [],

	/**
	 * @member {boolean} async This is the async of the request
	 */
	async: true,

	/**
	 * @member {boolean} crossDomain This will allow cross domain requests
	 */
	crossDomain: false,

	/**
	 * @member {boolean} withCredentials CORS with credentials
	 */
	withCredentials: false,

	/**
	 * @member {function|null} completed This is the completed callback
	 */
	completed: null,

	/**
	 * @member {function|null} failed This is the failed callback
	 */
	failed: null,

	/**
	 * @member {function|null} aborted This is the aborted callback
	 */
	aborted: null,

	/**
	 * @member {function|null} progress This is the progress callback
	 */
	progress: null
};
