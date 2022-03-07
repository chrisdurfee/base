import {ajax} from '../ajax/ajax.js';
import {base} from '../../core.js';

/**
 * ModelService
 *
 * This will create a new model service.
 * @class
 */
export class ModelService
{
	/**
	 * @constructor
	 * @param {object} model
	 */
	constructor(model)
	{
		/**
		 * @member {object} model
		 */
		this.model = model;

		/**
		 * @member {string} objectType The return type.
		 */
		this.objectType = 'item';

		this.url = '';
		this.validateCallBack = null;
		this.init();
	}

	init()
	{
		let model = this.model;
		if(model && model.url)
		{
			this.url = model.url;
		}
	}

	/**
	 * This will check if the model is valid.
	 *
	 * @return {boolean}
	 */
	isValid()
	{
		let result = this.validate();
		if(result !== false)
		{
			let callBack = this.validateCallBack;
			if(typeof callBack === 'function')
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
	 * @return {boolean}
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
	 * @return {string}
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
	 * @return {(string|object)}
	 */
	setupParams(params)
	{
		let defaults = this.getDefaultParams();
		params = this.addParams(params, defaults);
		return params;
	}

	/**
	 * This will convert an object to a string.
	 *
	 * @protected
	 * @param {object} object
	 * @return {string}
	 */
	objectToString(object)
	{
		const params = [];
		for (var prop in object)
		{
			if(object.hasOwnProperty(prop))
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
	 * @return {(string|object)}
	 */
	addParams(params, addingParams)
	{
		params = params || {};
		if(typeof params === 'string')
		{
			params = base.parseQueryString(params, false);
		}

		if(!addingParams)
		{
			return this.objectToString(params);
		}

		if(typeof addingParams === 'string')
		{
			addingParams = base.parseQueryString(addingParams, false);
		}

		if(this._isFormData(params))
		{
			for(var key in addingParams)
			{
				if(addingParams.hasOwnProperty(key))
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
	 * @return {object}
	 */
	get(instanceParams, callBack)
	{
		let id = this.model.get('id'),
		params = 'op=get' +
						'&id=' + id;

		let model = this.model;
		return this._get('', params, instanceParams, callBack, (response) =>
		{
			if(response)
			{
				/* this will update the model with the get request
				response */
				let object = this.getObject(response);
				if(object)
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
	 * @return {object}
	 */
	getObject(response)
	{
		/* this will update the model with the get request
		response */
		let object = response[this.objectType] || response;
		return object || false;
	}

	/**
	 * This will return a string with the model data json encoded.
	 *
	 * @protected
	 * @return {string}
	 */
	setupObjectData()
	{
		let item = this.model.get();
		return this.objectType + '=' + base.prepareJsonUrl(item);
	}

	/**
	 * This will add or update the model.
	 *
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @return {object}
	 */
	setup(instanceParams, callBack)
	{
		if(!this.isValid())
		{
			return false;
		}

		let params = 'op=setup' +
						'&' + this.setupObjectData();

		/* this will add the instance params with the
		method params */
		params = this.addParams(params, instanceParams, instanceParams);

		return this._put('', params, callBack);
	}

	/**
	 * This will add the model.
	 *
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @return {object}
	 */
	add(instanceParams, callBack)
	{
		if(!this.isValid())
		{
			return false;
		}

		let params = 'op=add' +
						'&' + this.setupObjectData();

		return this._post('', params, instanceParams, callBack);
	}

	/**
	 * This will update the model.
	 *
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @return {object}
	 */
	update(instanceParams, callBack)
	{
		if(!this.isValid())
		{
			return false;
		}

		let params = 'op=update' +
						'&' + this.setupObjectData();

		return this._patch('', params, instanceParams, callBack);
	}

	/**
	 * This will delete the model.
	 *
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @return {object}
	 */
	delete(instanceParams, callBack)
	{
		let id = this.model.get('id'),
		params = 'op=delete' +
						'&id=' + id;

		return this._delete('', params, instanceParams, callBack);
	}

	/**
	 * This will list rows of the model.
	 *
	 * @param {string} [instanceParams]
	 * @param {function} [callBack]
	 * @param {int} start
	 * @param {int} count
	 * @param {string} filter
	 * @return {object}
	 */
	all(instanceParams, callBack, start, count, filter)
	{
		filter = filter || '';
		start = !isNaN(start)? start : 0;
		count = !isNaN(count)? count : 50;

		let params = 'op=all' +
						'&option=' + filter +
						'&start=' + start +
						'&stop=' + count;

		return this._get('', params, instanceParams, callBack);
	}

	getUrl(url)
	{
		let baseUrl = this.url;
		if(!url)
		{
			return baseUrl;
		}

		if(url[0] === '?')
		{
			return baseUrl + url;
		}

		return baseUrl += '/' + url;
	}

	/**
	 * This will make an ajax request.
	 *
	 * @param {string} url
	 * @param {string} method
	 * @param {(string|object)} params
	 * @param {function} callBack
	 * @param {function} [requestCallBack]
	 * @param {object}
	 */
	setupRequest(url, method, params, callBack, requestCallBack)
	{
		let settings = {
			url: this.getUrl(url),
			method,
			params,
			completed: (response, xhr) =>
			{
				if(typeof requestCallBack === 'function')
				{
					requestCallBack(response);
				}

				this.getResponse(response, callBack, xhr);
			}
		};

		let overrideHeader = this._isFormData(params);
		if(overrideHeader)
		{
			settings.headers = {};
		}

		return ajax(settings);
	}

	_isFormData(data)
	{
		return data instanceof FormData;
	}

	/**
	 * This will make an ajax request.
	 *
	 * @param {(string|object)} params
	 * @param {string} instanceParams
	 * @param {function} callBack
	 * @param {function} [requestCallBack]
	 * @param {object}
	 */
	request(params, instanceParams, callBack, requestCallBack)
	{
		return this._request('', 'POST', params, instanceParams, callBack, requestCallBack);
	}

	/**
	 * This will make a GET request.
	 *
	 * @param {string} url
	 * @param {(string|object)} params
	 * @param {string} instanceParams
	 * @param {function} callBack
	 * @param {function} [requestCallBack]
	 * @param {object}
	 */
	_get(url, params, instanceParams, callBack, requestCallBack)
	{
		params = this.setupParams(params);
		params = this.addParams(params, instanceParams);

		url = url || '';

		if(params)
		{
			url += '?' + params;
		}

		return this.setupRequest(url, "GET", '', callBack, requestCallBack);
	}

	/**
	 * This will make a POST request.
	 *
	 * @param {string} url
	 * @param {(string|object)} params
	 * @param {string} instanceParams
	 * @param {function} callBack
	 * @param {function} [requestCallBack]
	 * @param {object}
	 */
	_post(url, params, instanceParams, callBack, requestCallBack)
	{
		return this._request(url, 'POST', params, instanceParams, callBack, requestCallBack);
	}

	/**
	 * This will make a PUT request.
	 *
	 * @param {string} url
	 * @param {(string|object)} params
	 * @param {string} instanceParams
	 * @param {function} callBack
	 * @param {function} [requestCallBack]
	 * @param {object}
	 */
	_put(url, params, instanceParams, callBack, requestCallBack)
	{
		return this._request(url, 'PUT', params, instanceParams, callBack, requestCallBack);
	}

	/**
	 * This will make a PATCH request.
	 *
	 * @param {string} url
	 * @param {(string|object)} params
	 * @param {string} instanceParams
	 * @param {function} callBack
	 * @param {function} [requestCallBack]
	 * @param {object}
	 */
	_patch(url, params, instanceParams, callBack, requestCallBack)
	{
		return this._request(url, 'PATCH', params, instanceParams, callBack, requestCallBack);
	}

	/**
	 * This will make a DELETE request.
	 *
	 * @param {string} url
	 * @param {(string|object)} params
	 * @param {string} instanceParams
	 * @param {function} callBack
	 * @param {function} [requestCallBack]
	 * @param {object}
	 */
	_delete(url, params, instanceParams, callBack, requestCallBack)
	{
		return this._request(url, 'DELETE', params, instanceParams, callBack, requestCallBack);
	}

	/**
	 * This will make an ajax request.
	 *
	 * @param {string} url
	 * @param {string} method
	 * @param {(string|object)} params
	 * @param {string} instanceParams
	 * @param {function} callBack
	 * @param {function} [requestCallBack]
	 * @param {object}
	 */
	_request(url, method, params, instanceParams, callBack, requestCallBack)
	{
		params = this.setupParams(params);
		params = this.addParams(params, instanceParams);

		return this.setupRequest(url, method, params, callBack, requestCallBack);
	}

	getResponse(response, callBack, xhr)
	{
		/* this will check to return the response
		to the callBack function */
		if(typeof callBack === 'function')
		{
			callBack(response, xhr);
		}
	}

	static extend(child)
	{
		if(!child)
		{
			return false;
		}

		var parent = this;
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