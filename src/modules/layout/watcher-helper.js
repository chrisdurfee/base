import { Dom } from '../../shared/dom.js';
import { Types } from '../../shared/types.js';
import { dataBinder } from '../data-binder/data-binder.js';

const WATCHER_PATTERN = /(\[\[(.*?(?:\[\d+\])?)\]\])/g;

/**
 * WatcherHelper
 *
 * This helper creates watcher callBacks, parses watcher strings
 * and sets up watchers.
 */
export const WatcherHelper =
{
	/**
	 * This will check if the value is a watcher.
	 *
	 * @param {mixed} value
	 * @return {boolean}
	 * @static
	 * @private
	 */
	isWatching(value)
	{
		if (Array.isArray(value))
		{
			if (typeof value[0] !== 'string')
			{
				return false;
			}

			if (this.hasParams(value[0]))
			{
				return true;
			}

			return false;
		}
		return this.hasParams(value);
	},

	/**
	 * This will check if a string has params.
	 *
	 * @param {string} string
	 * @returns {bool}
	 */
	hasParams(string)
	{
		if (!string || Types.isString(string) === false)
		{
			return false;
		}

		return (string.indexOf('[[') !== -1);
	},

	/**
	 * This will get the property names to be watched.
	 *
	 * @protected
	 * @param {string} string
	 * @return {(array|null)}
	 */
	_getWatcherProps(string)
	{
		let pattern = /\[\[(.*?)(\[\d+\])?\]\]/g,
		matches = string.match(pattern);
		if (matches)
		{
			pattern = /(\[\[|\]\])/g;
			for (var i = 0, length = matches.length; i < length; i++)
			{
				matches[i] = matches[i].replace(pattern, '');
			}
		}
		return matches;
	},

	/**
	 * This will update an element attribute.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {string} attr
	 * @param {string} value
	 */
	updateAttr(ele, attr, value)
	{
		if (attr === 'text' || attr === 'textContent')
		{
			ele.textContent = value;
		}
		else if (attr === 'innerHTML')
		{
			ele.innerHTML = value;
		}
		else
		{
			if (attr.substring(4, 1) === '-')
			{
				Dom.setAttr(ele, attr, value);
			}
			else
			{
				ele[attr] = value;
			}
		}
	},

	/**
	 * This will get a watcher callBack.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {(string|array)} data
	 * @param {string} string
	 * @param {string} attr
	 * @param {boolean} isArray
	 * @return {function}
	 */
	_getWatcherCallBack(ele, data, string, attr, isArray)
	{
		return () =>
		{
			let count = 0,
			value = string.replace(WATCHER_PATTERN, function()
			{
				let watcherData = (isArray)? data[count] : data;
				count++;

				let result = watcherData.get(arguments[2]);
				return (typeof result !== 'undefined'? result : '');
			});
			this.updateAttr(ele, attr, value);
		};
	},

	/**
	 * This will get the parent data.
	 *
	 * @param {object} parent
	 * @returns {object|null}
	 */
	getParentData(parent)
	{
		if (parent.data)
		{
			return parent.data;
		}

		if (parent.context && parent.context.data)
		{
			return parent.context.data;
		}

		if (parent.state)
		{
			return parent.state;
		}

		return null;
	},

	/**
	 * This will get a watcher value.
	 *
	 * @private
	 * @param {(string|object)} settings
	 * @param {object} parent
	 * @return {array}
	 */
	getValue(settings, parent)
	{
		if (typeof settings === 'string')
		{
			settings =
			{
				value: settings
			};
		}

		let value = settings.value;
		if (Array.isArray(value) === false)
		{
			/**
			 * This will setup an array watcher based on a string.
			 */
			value = [value, this.getParentData(parent)];
		}
		else
		{
			/**
			 * This will check to add the default data.
			 */
			if (value.length < 2)
			{
				value.push(this.getParentData(parent));
			}
		}
		return value;
	},

	/**
	 * This will get the prop values.
	 *
	 * @param {object} data
	 * @param {string} string
	 * @param {bool} isArray
	 * @return {array}
	 */
	getPropValues(data, props, isArray)
	{
		const values = [];

		for (var i = 0, length = props.length; i < length; i++)
		{
			var watcherData = (isArray)? data[i] : data;
			var value = watcherData.get(props[i]);
			value = (typeof value !== 'undefined'? value : '');
			values.push(value);
		}

		return values;
	},

	/**
	 * This will get the watcher callBack.
	 *
	 * @param {object} settings
	 * @param {object} ele
	 * @param {object} data
	 * @param {string} string
	 * @param {bool} isDataArray
	 * @return {function}
	 */
	getCallBack(settings, ele, data, string, isDataArray)
	{
		let callBack,
		overrideCallBack = settings.callBack;
		if (typeof overrideCallBack === 'function')
		{
			const props = string.match(WATCHER_PATTERN);
			const isMultiProp = (props && props.length > 1);
			callBack = (value, committer) =>
			{
				value = (isMultiProp !== true)? value : this.getPropValues(data, props, isDataArray);
				overrideCallBack(ele, value, committer);
			};
		}
		else
		{
			const attr = settings.attr || 'textContent';
			callBack = this._getWatcherCallBack(ele, data, string, attr, isDataArray);
		}
		return callBack;
	},

	/**
	 * This will add a data watcher.
	 *
	 * @private
	 * @param {object} ele
	 * @param {(string|object)} settings
	 * @param {object} parent
	 */
	addDataWatcher(ele, settings, parent)
	{
		const value = this.getValue(settings, parent),
		data = value[1];
		if (!data)
		{
			return;
		}

		const string = value[0],
		isDataArray = Array.isArray(data);

		const callBack = this.getCallBack(settings, ele, data, string, isDataArray),
		props = this._getWatcherProps(string);
		for(var i = 0, length = props.length; i < length; i++)
		{
			var watcherData = (isDataArray)? data[i] : data;
			this.addWatcher(ele, watcherData, props[i], callBack);
		}
	},

	/**
	 * This will setup a data watcher.
	 *
	 * @param {object} ele
	 * @param {(string|object)} settings
	 * @param {object} parent
	 */
	setup(ele, settings, parent)
	{
		if (!settings)
		{
			return;
		}

		if (Array.isArray(settings))
		{
			settings = {
				attr: settings[2],
				value: [settings[0], settings[1]]
			};
		}

		this.addDataWatcher(ele, settings, parent);
	},

	/**
	 * This will add a watcher.
	 *
	 * @private
	 * @param {object} ele
	 * @param {object} data
	 * @param {string} prop
	 * @param {function} callBack
	 */
	addWatcher(ele, data, prop, callBack)
	{
		dataBinder.watch(ele, data, prop, callBack);
	}
};