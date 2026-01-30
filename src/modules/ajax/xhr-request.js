import { base } from '../../main/base.js';
import { Events } from '../../main/events/events.js';
import { Objects } from '../../shared/objects.js';
import { Strings } from '../../shared/strings.js';
import { XhrDefaultSettings } from './xhr-default-settings.js';

/**
 * XhrRequest
 *
 * This will create an xhr request object.
 *
 * @class
 */
export class XhrRequest
{
	/**
	 * This will create an xhr request object.
	 *
	 * @constructor
	 * @param {*} args
	 */
	constructor(args)
	{
		this.settings = null;
		this.xhr = null;
		this.setup(args);
	}

	/**
	 * This will setup the xhr request.
	 *
	 * @protected
	 * @param {*} args
	 */
	setup(args)
	{
		this.getXhrSettings(args);

		const xhr = this.xhr = this.createXHR();
		const {method, url, async} = this.settings;
		xhr.open(method, url, async);

		this.setupHeaders();
		this.addXhrEvents();
		this.beforeSend();

		/* this will setup the params and send the
		xhr request */
		xhr.send(this.getParams());
	}

	/**
	 * This will call all before send callbacks.
	 *
	 * @protected
	 * @returns {void}
	 */
	beforeSend()
	{
		// @ts-ignore
		const items = XhrDefaultSettings.beforeSend;
		if (items.length < 1)
		{
			return;
		}

		const xhr = this.xhr;
		const settings = this.settings;
		for (var i = 0, length = items.length; i < length; i++)
		{
			var callBack = items[i];
			if (callBack)
			{
				callBack(xhr, settings);
			}
		}
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
				params.push(prop + '=' + encodeURIComponent(object[prop]));
			}
		}
		return params.join('&');
	}

	/**
	 * This will add the base params to the request params.
	 *
	 * @protected
	 * @param {*} params
	 * @param {*} addingParams
	 * @returns {*}
	 */
	setupParams(params, addingParams)
	{
		const paramsType = typeof params;
		if (!addingParams)
		{
			if ((params instanceof FormData) === false && paramsType === 'object')
			{
				params = this.objectToString(params);
			}
			return params;
		}

		/**
		 * This will convert the adding params to match
		 * the params type.
		 */
		const addingType = typeof addingParams;
		if (paramsType === 'string')
		{
			if (addingType !== 'string')
			{
				addingParams = this.objectToString(addingParams);
			}

			const char = (params === '')? '?' : '&';
			params += char + addingParams;
			return params;
		}

		if (addingType === 'string')
		{
			addingParams = Strings.parseQueryString(addingParams, false);
		}

		if (params instanceof FormData)
		{
			for (var key in addingParams)
			{
				if (Object.prototype.hasOwnProperty.call(addingParams, key))
				{
					params.append(key, addingParams[key]);
				}
			}
		}
		else if (paramsType === 'object')
		{
			/* we don't want to modify the original object
			so we need to clone the object before extending */
			params = Objects.clone(params);

			params = Object.assign(addingParams, params);
			params = this.objectToString(params);
		}
		return params;
	}

	/**
	 * This will get the params.
	 *
	 * @protected
	 * @returns {*}
	 */
	getParams()
	{
		const settings = this.settings;
		const fixedParams = settings.fixedParams;
		let params = settings.params;
		if (params)
		{
			params = this.setupParams(params, fixedParams);
		}
		else if(fixedParams)
		{
			params = this.setupParams(fixedParams);
		}

		return params;
	}

	/**
	 * This will set the settings from the args.
	 *
	 * @protected
	 * @param {array} args
	 * @returns {void}
	 */
	getXhrSettings(args)
	{
		/* we want to create a clone of the default
		settings before adding the new settings */
		// @ts-ignore
		let settings = this.settings = {...base.xhrSettings};

		/* we want to check if we are adding the ajax settings by
		individual args or by a settings object */
		if (args.length >= 2 && typeof args[0] !== 'object')
		{
			for (var i = 0, maxLength = args.length; i < maxLength; i++)
			{
				var arg = args[i];

				switch (i)
				{
					case 0:
						settings.url = arg;
						break;
					case 1:
						settings.params = arg;
						break;
					case 2:
						settings.completed = arg;
						settings.failed = arg;
						break;
					case 3:
						settings.responseType = arg || 'json';
						break;
					case 4:
						settings.method = (arg)? arg.toUpperCase() : 'POST';
						break;
					case 5:
						settings.async = (typeof arg !== 'undefined')? arg : true;
						break;
				}
			}
		}
		else
		{
			/* override the default settings with the args
			settings object */
			settings = this.settings = Objects.extendClass(this.settings, args[0]);

			/* we want to check to add the completed callback
			as the error and aborted if not set */
			if (typeof settings.completed === 'function')
			{
				if (typeof settings.failed !== 'function')
				{
					settings.failed = settings.completed;
				}

				if (typeof settings.aborted !== 'function')
				{
					settings.aborted = settings.failed;
				}
			}
		}
	}

	/**
	 * This will create the xhr object.
	 *
	 * @protected
	 * @returns {XMLHttpRequest}
	 */
	createXHR()
	{
		const settings = this.settings,
		xhr = new XMLHttpRequest();
		xhr.responseType = settings.responseType;

		if (settings.withCredentials === true)
		{
			xhr.withCredentials = true;
		}

		return xhr;
	}

	/**
	 * This will setup the request headers.
	 *
	 * @protected
	 * @returns {void}
	 */
	setupHeaders()
	{
		const settings = this.settings;
		if (!settings || typeof settings.headers !== 'object')
		{
			return;
		}

		/* we want to add a header for each
		property in the object */
		let headers = settings.headers;
		for (var header in headers)
		{
			if (Object.prototype.hasOwnProperty.call(headers, header))
			{
				this.xhr.setRequestHeader(header, headers[header]);
			}
		}
	}

	/**
	 * This will update the request status.
	 *
	 * @protected
	 * @param {object} e
	 * @param {string} [overrideType]
	 */
	update(e, overrideType)
	{
		const xhr = this.xhr;

		/* this will remove the xhr events from the active events
		after the events are completed, aborted, or errored */
		const removeEvents = () =>
		{
			Events.removeEvents(xhr.upload);
			Events.removeEvents(xhr);
		};

		const settings = this.settings;
		if (!settings)
		{
			return false;
		}

		const type = overrideType || e.type;
		switch (type)
		{
			case 'load':
				if (typeof settings.completed === 'function')
				{
					let response = this.getResponseData();
					settings.completed(response, this.xhr);
				}
				removeEvents();
				break;
			case 'error':
				if (typeof settings.failed === 'function')
				{
					settings.failed(false, this.xhr);
				}
				removeEvents();
				break;
			case 'progress':
				if (typeof settings.progress === 'function')
				{
					settings.progress(e);
				}
				break;
			case 'abort':
				if (typeof settings.aborted === 'function')
				{
					settings.aborted(false, this.xhr);
				}
				removeEvents();
				break;
		}
	}

	/**
	 * This will get the response data.
	 *
	 * @protected
	 * @returns {*}
	 */
	getResponseData()
	{
		const xhr = this.xhr;
		const responseType = xhr.responseType;
		if (!responseType || responseType === 'text')
		{
			return xhr.responseText;
		}

		return xhr.response;
	}

	/**
	 * This will add the xhr events.
	 *
	 * @protected
	 * @returns {void}
	 */
	addXhrEvents()
	{
		const settings = this.settings;
		if (!settings)
		{
			return;
		}

		const xhr = this.xhr,
		callBack = this.update.bind(this);
		Events.on(['load', 'error', 'abort'], xhr, callBack);
		Events.on('progress', xhr.upload, callBack);
	}
}
