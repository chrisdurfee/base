import { setupBaseAjaxMethods } from './base-ajax-methods.js';
import { XhrRequest } from './xhr-request.js';

/* Setup base ajax methods */
setupBaseAjaxMethods();

/**
 * This will make an xhr (ajax) request.
 *
 * @overload
 * @param {string} url
 * @param {string} [params]
 * @param {function} [callBackFn]
 * @param {string} [responseType]
 * @param {string} [method=POST]
 * @param {boolean} [async]
 *
 * @overload
 * @param {object} settings
 * @example
 * {
 * 	url: '',
 * 	params: '',
 * 	completed(response)
 * 	{
 *
 * 	}
 * }
 *
 * @returns {XMLHttpRequest|null} xhr object.
 */
export const Ajax = (...args) =>
{
	/* we want to save the args so we can check
	which way we are adding the ajax settings */
	const ajax = new XhrRequest(args);
	return ajax.xhr;
};

/* Re-export XhrRequest for backwards compatibility */
export { XhrRequest };

