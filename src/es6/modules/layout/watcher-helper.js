import {base} from '../../core.js';
import {dataBinder} from '../data-binder/data-binder.js';

/**
 * WatcherHelper
 *
 * This helper creates watcher callBacks, parses watcher strings
 * and sets up watchers.
 */
export const WatcherHelper =
{
	/**
	 * This will get the property names to be watched.
	 *
	 * @protected
	 * @param {string} string
	 * @return {(array|null)}
	 */
	_getWatcherProps(string)
	{
		let pattern = /\[\[(.*?)\]\]/g,
		matches = string.match(pattern);
		if(matches)
		{
			pattern = /(\[\[|\]\])/g;
			for(var i = 0, length = matches.length; i < length; i++)
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
		if(attr === 'text' || attr === 'textContent')
		{
			ele.textContent = value;
		}
		else if(attr === 'innerHTML')
		{
			ele.innerHTML = value;
		}
		else
		{
			base.setAttr(ele, attr, value);
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
			pattern = /(\[\[(.*?)\]\])/g,
			value = string.replace(pattern, function()
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
	 * This will get a watcher value.
	 *
	 * @private
	 * @param {(string|object)} settings
	 * @param {object} parent
	 * @return {array}
	 */
	getValue(settings, parent)
	{
		if(typeof settings === 'string')
		{
			settings =
			{
				value: settings
			};
		}

		let value = settings.value;
		if(Array.isArray(value) === false)
		{
			value = [value, (parent.data || parent.state)];
		}
		return value;
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
		if(typeof overrideCallBack === 'function')
		{
			callBack = function(value, committer)
			{
				overrideCallBack(ele, value, committer);
			};
		}
		else
		{
			let attr = settings.attr || 'textContent';
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
		let value = this.getValue(settings, parent),
		data = value[1];
		if(!data)
		{
			return;
		}

		let string = value[0],
		isDataArray = Array.isArray(data);

		let callBack = this.getCallBack(settings, ele, data, string, isDataArray),
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
		if(!settings)
		{
			return;
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