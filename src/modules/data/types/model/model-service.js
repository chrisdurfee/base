import { Encode } from '../../../../shared/encode/encode.js';
import { Strings } from '../../../../shared/strings.js';
import { Ajax } from '../../../ajax/ajax.js';
import { WatcherHelper } from '../../../layout/watcher-helper.js';

/**
 * ModelService
 *
 * This will create a new model service.
 *
 * @class
 */
export class ModelService
{
	/**
	 * This will create a model service.
	 *
	 * @constructor
	 * @param {object} model
	 */
	constructor(model)
	{
		/**
		 * @type {any} model
		 */
		this.model = model;

		/**
		 * @type {string} objectType The return type.
		 */
		this.objectType = this.objectType || 'item';

		/**
		 * @type {string} url
		 */
		this.url = '';

		/**
		 * @type {function|null} validateCallBack
		 */
		this.validateCallBack = null;
		this.init();
	}

	/**
	 * This will initialize the model service.
	 *
	 * @protected
	 * @returns {void}
	 */
	init()
	{
		const model = this.model;
		if (model && model.url)
		{
			this.url = model.url;
		}
	}

	/**
	 * This will check if the model is valid.
	 *
	 * @returns {boolean}
	 */
	isValid()
	{
		const result = this.validate();
		if (result !== false)
		{
			const callBack = this.validateCallBack;
			if (typeof callBack === 'function')
			{
				callBack(result);
			}
		}
		return result;
	}

	/**
	 * This should be overriden to validate the model
	 * before submitting.
	 *
	 * @returns {boolean}
	 */
	validate()
	{
		return true;
	}

	/**
	 * This can be overriden to add default params
	 * with each request.
	 *
	 * @protected
	 * @returns {string}
	 */
	getDefaultParams()
	{
		return '';
	}

	/**
	 * This will setup the request params.
	 *
	 * @protected
	 * @param {(string|object)} params
	 * @returns {(string|object)}
	 */
	setupParams(params)
	{
		const defaults = this.getDefaultParams();
		params = this.addParams(params, defaults);
		return params;
	}

	/**
	 * This will convert an object to a string.
	 *
	 * @protected
	 * @param {object} object
	 * @returns {string}
	 */
	objectToString(object)
	{
		const params = [];
		for (var prop in object)
		{
			if (Object.prototype.hasOwnProperty.call(object, prop))
			{
				params.push(prop + '=' + object[prop]);
			}
		}
		return params.join('&');
	}

	/**
	 * This will add the params.
	 *
	 * @protected
	 * @param {*} params
	 * @param {*} addingParams
	 * @returns {string|object}
	 */
	addParams(params, addingParams)
	{
		params = params || {};
		if (typeof params === 'string')
		{
			params = Strings.parseQueryString(params, false);
		}

		if (!addingParams)
		{
			return (!this._isFormData(params))? this.objectToString(params) : params;
		}

		if (typeof addingParams === 'string')
		{
			addingParams = Strings.parseQueryString(addingParams, false);
		}

		if (this._isFormData(params))
		{
			for (var key in addingParams)
			{
				if (Object.prototype.hasOwnProperty.call(addingParams, key))
				{
					params.append(key, addingParams[key]);
				}
			}
		}
		else
		{
			params = Object.assign(params, addingParams);
			params = this.objectToString(params);
		}

		return params;
	}

	/**
	 * This will get the model by id.
	 *
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @returns {XMLHttpRequest}
	 */
	get(instanceParams, callBack)
	{
		const id = this.model.get('id');
		const params = 'id=' + id;
		const url = id ? `/${id}` : '';

		const model = this.model;
		return this._get(url, params, instanceParams, callBack, (response) =>
		{
			if (response)
			{
				/* this will update the model with the get request
				response */
				const object = this.getObject(response);
				if (object)
				{
					model.set(object);
				}
			}
		});
	}

	/**
	 * This will get the object from the response.
	 *
	 * @protected
	 * @param {object} response
	 * @returns {object}
	 */
	getObject(response)
	{
		/* this will update the model with the get request
		response */
		const object = response[this.objectType] || response;
		return object || false;
	}

	/**
	 * This will return a string with the model data json encoded.
	 *
	 * @protected
	 * @returns {string}
	 */
	setupObjectData()
	{
		const item = this.model.get();
		return this.objectType + '=' + Encode.prepareJsonUrl(item);
	}

	/**
	 * This will add or update the model.
	 *
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @returns {XMLHttpRequest|void}
	 */
	setup(instanceParams, callBack)
	{
		if (!this.isValid())
		{
			return;
		}

		let params = this.setupObjectData();
		const id = this.model.id;
		const url = (id != null) ? `/${id}` : '';

		return this._put(url, params, instanceParams, callBack);
	}

	/**
	 * This will add the model.
	 *
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @returns {XMLHttpRequest|void}
	 */
	add(instanceParams, callBack)
	{
		if (!this.isValid())
		{
			return;
		}

		let params = this.setupObjectData();
		const id = this.model.id;
		const url = (id != null) ? `/${id}` : '';

		return this._post(url, params, instanceParams, callBack);
	}

	/**
	 * This will update the model.
	 *
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @returns {XMLHttpRequest|void}
	 */
	update(instanceParams, callBack)
	{
		if (!this.isValid())
		{
			return;
		}

		let params = this.setupObjectData();
		const id = this.model.id;
		const url = (id != null) ? `/${id}` : '';

		return this._patch(url, params, instanceParams, callBack);
	}

	/**
	 * This will delete the model.
	 *
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @returns {XMLHttpRequest}
	 */
	delete(instanceParams, callBack)
	{
		const id = this.model.get('id');
		const params = (typeof id !== 'undefined')? 'id=' + id : this.setupObjectData();
		const url = (id != null) ? `/${id}` : '';

		return this._delete(url, params, instanceParams, callBack);
	}

	/**
	 * This will list rows of the model.
	 *
	 * @param {string} instanceParams
	 * @param {function} callBack
	 * @param {number} offset
	 * @param {number} limit
	 * @param {*} lastCursor
	 * @param {*} since
	 * @returns {XMLHttpRequest}
	 */
	all(instanceParams, callBack, offset, limit, lastCursor = null, since = null)
	{
		const data = this.model.get();
		offset = !isNaN(offset)? offset : 0;
		limit = !isNaN(limit)? limit : 50;
		const search = data.search || '';

		let filter = data.filter || '';
		if (typeof filter === 'object')
		{
			filter = JSON.stringify(filter);
		}

		let dates = data.dates || '';
		if (typeof dates === 'object')
		{
			dates = JSON.stringify(dates);
		}

		let orderBy = data.orderBy || '';
		if (typeof orderBy === 'object')
		{
			orderBy = JSON.stringify(orderBy);
		}

		let groupBy = data.groupBy || '';
		if (Array.isArray(groupBy))
		{
			groupBy = JSON.stringify(groupBy);
		}

		let params = '&filter=' + filter +
			'&offset=' + offset +
			'&limit=' + limit +
			'&dates=' + dates +
			'&orderBy=' + orderBy +
			'&groupBy=' + groupBy +
			'&search=' + search +
			'&lastCursor=' + ((typeof lastCursor !== 'undefined' && lastCursor !== null) ? lastCursor : '') +
			'&since=' + ((typeof since !== 'undefined' && since !== null) ? since : '');

		return this._get('', params, instanceParams, callBack);
	}

	/**
	 * This will get the url.
	 *
	 * @protected
	 * @param {string} url
	 * @returns {string}
	 */
	getUrl(url)
	{
		let baseUrl = this.url;
		if (!url)
		{
			return this.replaceUrl(baseUrl);
		}

		if (url[0] === '/')
		{
			url = url.substring(1);
		}

		const fullUrl = (url[0] === '?')
		? baseUrl + url
		: baseUrl + '/' + url;

		return this.replaceUrl(fullUrl);
	}

	/**
	 * This will make an ajax request.
	 *
	 * @protected
	 * @param {string} url
	 * @param {string} method
	 * @param {(string|object)} params
	 * @param {function} [callBack]
	 * @param {function} [requestCallBack]
	 * @returns {XMLHttpRequest}
	 */
	setupRequest(url, method, params, callBack, requestCallBack)
	{
		const settings = {
			url: this.getUrl(url),
			method,
			params,
			completed: (response, xhr) =>
			{
				if (typeof requestCallBack === 'function')
				{
					requestCallBack(response);
				}

				this.getResponse(response, callBack, xhr);
			}
		};

		const overrideHeader = this._isFormData(params);
		if (overrideHeader)
		{
			settings.headers = {};
		}

		return Ajax(settings);
	}

	/**
	 * Set up an EventSource for real-time activity updates with auto-reconnection.
	 *
	 * @param {string} url - The URL path relative to the model's base URL.
	 * @param {string} params - The query parameters.
	 * @param {function} callBack - The callback function for incoming updates.
	 * @param {function|null} onOpenCallBack - Optional callback when connection opens.
	 * @param {boolean} [reconnect=true] - Whether to auto-reconnect on disconnection.
	 * @returns {object} Object with source and cleanup function
	 */
	setupEventSource(url, params, callBack, onOpenCallBack, reconnect = true)
	{
		let source = null;
		let reconnectTimer = null;
		let intentionallyClosed = false;
		let isConnecting = false;

		/**
		 * Clears any pending reconnect timer.
		 *
		 * @returns {void}
		 */
		const clearReconnectTimer = () =>
		{
			if (reconnectTimer)
			{
				clearTimeout(reconnectTimer);
				reconnectTimer = null;
			}
		};

		/**
		 * Schedules a reconnection attempt.
		 *
		 * @returns {void}
		 */
		const scheduleReconnect = () =>
		{
			if (intentionallyClosed || !reconnect || isConnecting)
			{
				return;
			}

			clearReconnectTimer();

			const RECONNECT_DELAY = 3000; // 3 seconds
			reconnectTimer = setTimeout(() =>
			{
				reconnectTimer = null;
				connect();
			}, RECONNECT_DELAY);
		};

		/**
		 * Connects to the EventSource and sets up event handlers.
		 *
		 * @returns {void}
		 */
		const connect = () =>
		{
			if (intentionallyClosed || isConnecting)
			{
				return;
			}

			// Close any existing connection before creating a new one
			if (source)
			{
				try
				{
					source.close();
				}
				catch (e)
				{
					// Ignore close errors
				}
				source = null;
			}

			isConnecting = true;

			const fullUrl = this.getUrl(url);
			const queryString = params ? '?' + params : '';
			source = new EventSource(fullUrl + queryString, { withCredentials: true });

			source.onopen = () =>
			{
				isConnecting = false;
				clearReconnectTimer();

				if (onOpenCallBack)
				{
					onOpenCallBack();
				}
			};

			source.onerror = () =>
			{
				isConnecting = false;

				// Only handle if connection is closed (readyState === 2)
				// If readyState is 0 (CONNECTING), let the browser retry first
				if (source && source.readyState === EventSource.CLOSED)
				{
					source = null;
					scheduleReconnect();
				}
			};

			source.onmessage = (event) =>
			{
				try
				{
					const data = JSON.parse(event.data);
					if (callBack)
					{
						callBack(data);
					}
				}
				catch (error)
				{
					// Ignore parse errors
				}
			};
		};

		connect();

		// Return object with source getter and cleanup function
		return {
			get source() { return source; },
			close: () =>
			{
				intentionallyClosed = true;
				isConnecting = false;
				clearReconnectTimer();

				if (source)
				{
					try
					{
						source.close();
					}
					catch (e)
					{
						// Ignore close errors
					}
					source = null;
				}
			}
		};
	}

	/**
	 * This will replace the url params with the model data.
	 *
	 * @param {string} url
	 * @returns {string}
	 */
	replaceUrl(url)
	{
		if (WatcherHelper.isWatching(url))
		{
			url = WatcherHelper.replaceParams(url, this.model);
		}

		if (url.endsWith('/'))
		{
			url = url.substring(0, url.length - 1);
		}

		return url;
	}

	/**
	 * This will check if the data is a form data object.
	 *
	 * @protected
	 * @param {*} data
	 * @returns {boolean}
	 */
	_isFormData(data)
	{
		return data instanceof FormData;
	}

	/**
	 * This will make an ajax request.
	 *
	 * @protected
	 * @param {(string|object)} params
	 * @param {string} instanceParams
	 * @param {function} callBack
	 * @param {function} [requestCallBack]
	 * @returns {XMLHttpRequest}
	 */
	request(params, instanceParams, callBack, requestCallBack)
	{
		return this._request('', 'POST', params, instanceParams, callBack, requestCallBack);
	}

	/**
	 * This will make a GET request.
	 *
	 * @protected
	 * @param {string} url
	 * @param {(string|object)} params
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @param {function} [requestCallBack]
	 * @returns {XMLHttpRequest}
	 */
	_get(url, params, instanceParams, callBack, requestCallBack)
	{
		params = this.setupParams(params);
		params = this.addParams(params, instanceParams);

		url = url || '';

		if (params)
		{
			url += '?' + params;
		}

		return this.setupRequest(url, "GET", '', callBack, requestCallBack);
	}

	/**
	 * This will make a POST request.
	 *
	 * @protected
	 * @param {string} url
	 * @param {(string|object)} params
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @param {function} [requestCallBack]
	 * @returns {XMLHttpRequest}
	 */
	_post(url, params, instanceParams, callBack, requestCallBack)
	{
		return this._request(url, 'POST', params, instanceParams, callBack, requestCallBack);
	}

	/**
	 * This will make a PUT request.
	 *
	 * @protected
	 * @param {string} url
	 * @param {(string|object)} params
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @param {function} [requestCallBack]
	 * @returns {XMLHttpRequest}
	 */
	_put(url, params, instanceParams, callBack, requestCallBack)
	{
		return this._request(url, 'PUT', params, instanceParams, callBack, requestCallBack);
	}

	/**
	 * This will make a PATCH request.
	 *
	 * @protected
	 * @param {string} url
	 * @param {(string|object)} params
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @param {function} [requestCallBack]
	 * @returns {XMLHttpRequest}
	 */
	_patch(url, params, instanceParams, callBack, requestCallBack)
	{
		return this._request(url, 'PATCH', params, instanceParams, callBack, requestCallBack);
	}

	/**
	 * This will make a DELETE request.
	 *
	 * @protected
	 * @param {string} url
	 * @param {(string|object)} params
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @param {function} [requestCallBack]
	 * @returns {XMLHttpRequest}
	 */
	_delete(url, params, instanceParams, callBack, requestCallBack)
	{
		return this._request(url, 'DELETE', params, instanceParams, callBack, requestCallBack);
	}

	/**
	 * This will make an ajax request.
	 *
	 * @protected
	 * @param {string} url
	 * @param {string} method
	 * @param {(string|object)} params
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @param {function} [requestCallBack]
	 * @returns {XMLHttpRequest}
	 */
	_request(url, method, params, instanceParams, callBack, requestCallBack)
	{
		params = this.setupParams(params);
		params = this.addParams(params, instanceParams);

		return this.setupRequest(url, method, params, callBack, requestCallBack);
	}

	/**
	 * This will get the response.
	 *
	 * @protected
	 * @param {object} response
	 * @param {function} [callBack]
	 * @param {object} [xhr]
	 * @returns {void}
	 */
	getResponse(response, callBack, xhr)
	{
		/* this will check to return the response
		to the callBack function */
		if (typeof callBack === 'function')
		{
			callBack(response, xhr);
		}
	}

	/**
	 * This will extend the model service.
	 *
	 * @param {object} child
	 * @returns {object}
	 */
	static extend(child)
	{
		if (!child)
		{
			return false;
		}

		const parent = this;
		class service extends parent
		{
			constructor(model)
			{
				super(model);
			}
		}

		Object.assign(service.prototype, child);
		return service;
	}
}