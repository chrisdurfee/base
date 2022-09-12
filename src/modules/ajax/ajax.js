import {base} from '../../core.js';

/**
 * This is the default xhr (ajax) settings.
 */
let XhrDefaultSettings =
{
	url: '',

	/* this is the responseType of the server
	response (string) */
	responseType:  'json',

	/* this is the server method */
	method: 'POST',

	/* this can fix a param string to be added
	to every ajax request */
	fixedParams: '',

	/* headers (object) */
	headers:
	{
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
	},

	beforeSend: [],

	/* this will set the ajax request to async (bool) */
	async: true,

	/* cross domain (bool) */
	crossDomain: false,

	/* cors with credentials (bool) */
	withCredentials: false,

	/* events (function) */
	completed: null,
	failed: null,
	aborted: null,
	progress: null
};

/* this will add ajax settings to the base class */
base.augment(
{
	/**
	 * @member {object} xhrSettings
	 */
	xhrSettings: XhrDefaultSettings,

	/**
	 * This will add fixed params to each xhr request.
	 *
	 * @param {(string|object)} params
	 */
	addFixedParams(params)
	{
		this.xhrSettings.fixedParams = params;
	},

	/**
	 * This will add a callback that will be called before
	 * each request.
	 *
	 * @param {function} callBack
	 */
	beforeSend(callBack)
	{
		this.xhrSettings.beforeSend.push(callBack);
	},

	/**
	 * This will update the xhr settings.
	 *
	 * @param {object} settingsObj
	 */
	ajaxSettings(settingsObj)
	{
		if(typeof settingsObj === 'object')
		{
			this.xhrSettings = this.extendClass(base.xhrSettings, settingsObj);
		}
	},

	/**
	 * This will reset the xhr settings.
	 */
	resetAjaxSettings()
	{
		this.xhrSettings = XhrDefaultSettings;
	}
});

/**
 * This will make an xhr (ajax) request.
 *
 * @param {string} url
 * @param {string} params
 * @param {function} callBackFn
 * @param {string} responseType
 * @param {string} [method=POST]
 * @param {boolean} async
 *
 * or
 *
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
 * @return {object} xhr object.
 */
export const ajax = (...args) =>
{
	/* we want to save the args so we can check
	which way we are adding the ajax settings */
	const ajax = new XhrRequest(args);
	return ajax.xhr;
};

/**
 * XhrRequest
 *
 * This will create an xhr request object.
 * @class
 */
export class XhrRequest
{
	/**
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
	 * @return {(object|boolean)}
	 */
	setup(args)
	{
		this.getXhrSettings(args);

		let xhr = this.xhr = this.createXHR();
		if(xhr === false)
		{
			return false;
		}

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
	 * @returns {void}
	 */
	beforeSend()
	{
		let items = base.xhrSettings.beforeSend;
		if(items.length < 1)
		{
			return;
		}

		let xhr = this.xhr;
		let settings = this.settings;
		for(var i = 0, length = items.length; i < length; i++)
		{
			var callBack = items[i];
			if(callBack)
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
	 * @return {string}
	 */
	objectToString(object)
	{
		let params = [];
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
	 * This will add the base params to the request params.
	 *
	 * @protected
	 * @param {*} params
	 * @param {*} addingParams
	 * @return {*}
	 */
	setupParams(params, addingParams)
	{
		let paramsType = typeof params;
		if(addingParams)
		{
			/* this will convert the adding params to match
			the params type */
			let addingType = typeof addingParams;
			if(paramsType === 'string')
			{
				if(addingType !== 'string')
				{
					addingParams = this.objectToString(addingParams);
				}

				const char = (params === '')? '?' : '&';
				params += char + addingParams;
			}
			else
			{
				if(addingType === 'string')
				{
					addingParams = base.parseQueryString(addingParams, false);
				}

				if(params instanceof FormData)
				{
					for(var key in addingParams)
					{
						if(addingParams.hasOwnProperty(key))
						{
							params.append(key, addingParams[key]);
						}
					}
				}
				else if(paramsType === 'object')
				{
					/* we don't want to modify the original object
					so we need to clone the object before extending */
					params = base.cloneObject(params);

					params = Object.assign(addingParams, params);
					params = this.objectToString(params);
				}
			}
		}
		else
		{
			if((params instanceof FormData) === false && paramsType === 'object')
			{
				params = this.objectToString(params);
			}
		}
		return params;
	}

	/**
	 * This will get the params.
	 * @protected
	 * @return {*}
	 */
	getParams()
	{
		let settings = this.settings,
		params = settings.params;

		let fixedParams = settings.fixedParams;
		if(params)
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
	 */
	getXhrSettings(args)
	{
		/* we want to create a clone of the default
		settings before adding the new settings */
		let settings = this.settings = Object.create(base.xhrSettings);

		/* we want to check if we are adding the ajax settings by
		individual args or by a settings object */
		if(args.length >= 2 && typeof args[0] !== 'object')
		{
			for(var i = 0, maxLength = args.length; i < maxLength; i++)
			{
				var arg = args[i];

				switch(i)
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
			settings = this.settings = base.extendClass(this.settings, args[0]);

			/* we want to check to add the completed callback
			as the error and aborted if not set */
			if(typeof settings.completed === 'function')
			{
				if(typeof settings.failed !== 'function')
				{
					settings.failed = settings.completed;
				}

				if(typeof settings.aborted !== 'function')
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
	 * @return {(object|boolean)}
	 */
	createXHR()
	{
		/* we want to check to setup the xhr by
		the crossDomain settings */
		let settings = this.settings,

		xhr = new XMLHttpRequest();
		xhr.responseType = settings.responseType;

		if(settings.withCredentials === true)
		{
			xhr.withCredentials = true;
		}

		return xhr;
	}

	/**
	 * This will setup the request headers.
	 */
	setupHeaders()
	{
		let settings = this.settings;
		if(settings && typeof settings.headers === 'object')
		{
			/* we want to add a header for each
			property in the object */
			let headers = settings.headers;
			for(var header in headers)
			{
				if(headers.hasOwnProperty(header))
				{
					this.xhr.setRequestHeader(header, headers[header]);
				}
			}
		}
	}

	/**
	 * This will update the request status.
	 *
	 * @param {object} e
	 * @param {string} [overrideType]
	 */
	update(e, overrideType)
	{
		let xhr = this.xhr;

		/* this will remove the xhr events from the active events
		after the events are completed, aborted, or errored */
		let removeEvents = () =>
		{
			let events = base.events;
			events.removeEvents(xhr.upload);
			events.removeEvents(xhr);
		};

		let settings = this.settings;
		if(!settings)
		{
			return false;
		}

		let type = overrideType || e.type;
		switch(type)
		{
			case 'load':
				if(typeof settings.completed === 'function')
				{
					let response = this.getResponseData();
					settings.completed(response, this.xhr);
				}
				removeEvents();
				break;
			case 'error':
				if(typeof settings.failed === 'function')
				{
					settings.failed(false, this.xhr);
				}
				removeEvents();
				break;
			case 'progress':
				if(typeof settings.progress === 'function')
				{
					settings.progress(e);
				}
				break;
			case 'abort':
				if(typeof settings.aborted === 'function')
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
	 * @return {*}
	 */
	getResponseData()
	{
		let xhr = this.xhr,
		response = xhr.response;

		const responseType = xhr.responseType;
		if(!responseType || responseType === 'text')
		{
			return xhr.responseText;
		}

		return response;
	}

	/**
	 * This will add the xhr events.
	 */
	addXhrEvents()
	{
		let settings = this.settings;
		if(!settings)
		{
			return;
		}

		let xhr = this.xhr,
		callBack = base.bind(this, this.update);
		base.on(['load', 'error', 'abort'], xhr, callBack);
		base.on('progress', xhr.upload, callBack);
	}
}