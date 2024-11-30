import { Types } from '../../shared/types.js';
import { dataBinder } from '../data-binder/data-binder.js';
import { getParentData } from './directives/core/reactive/get-parent-data.js';
import { HtmlHelper } from './html-helper.js';

/**
 * WATCHER_PATTERN
 *
 * This is the pattern used to match watcher strings.
 *
 * @type {RegExp} WATCHER_PATTERN
 */
const WATCHER_PATTERN = /(\[\[(.*?(?:\[\d+\])?)\]\])/g;

/**
 * WatcherHelper
 *
 * This helper creates watcher callBacks, parses watcher strings
 * and sets up watchers.
 *
 * @type {object} WatcherHelper
 */
export const WatcherHelper =
{
	/**
	 * This will check if the value is a watcher.
	 *
	 * @param {*} value
	 * @returns {boolean}
	 * @static
	 * @private
	 */
	isWatching(value)
	{
		/**
		 * This will check if we are watching using an array.
		 */
		if (Array.isArray(value))
		{
			return typeof value[0] === 'string' && this.hasParams(value[0]);
		}

		/**
		 * This will check if we are watching using a string.
		 */
		return this.hasParams(value);
	},

	/**
	 * This will check if a string has params.
	 *
	 * @param {string} string
	 * @returns {boolean}
	 */
	hasParams(string)
	{
		return Types.isString(string) && string.includes('[[');
	},

	/**
	 * This will get the property names to be watched.
	 *
	 * @protected
	 * @param {string} string
	 * @returns {(array|null)}
	 */
	_getWatcherProps(string)
	{
		let pattern = /\[\[(.*?)(\[\d+\])?\]\]/g;
		const matches = string.match(pattern);
		if (matches === null)
		{
			return null
		}

		pattern = /(\[\[|\]\])/g;
		return matches.map(match => match.replace(pattern, ''));
	},

	/**
	 * This will update an element attribute.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {string} attr
	 * @param {string} value
	 * @returns {void}
	 */
	updateAttr(ele, attr, value)
	{
		switch (attr) {
            case 'text':
            case 'textContent':
                ele.textContent = value;
                break;
            default:
                HtmlHelper.addAttr(ele, attr, value);
                break;
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
	 * @returns {function}
	 */
	_getWatcherCallBack(ele, data, string, attr, isArray)
	{
		return () =>
		{
			let count = 0,
			value = string.replace(WATCHER_PATTERN, function()
			{
				const watcherData = (isArray)? data[count] : data;
				count++;

				const result = watcherData.get(arguments[2]);
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
	 * @returns {array}
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

		const value = settings.value;
		if (Array.isArray(value) === false)
		{
			/**
			 * This will setup an array watcher based on a string.
			 */
			return [value, getParentData(parent)];
		}

		/**
		 * This will check to add the default data.
		 */
		if (value.length < 2)
		{
			value.push(getParentData(parent));
		}
		return value;
	},

	/**
	 * This will get the prop values.
	 *
	 * @param {object} data
	 * @param {array} props
	 * @param {boolean} isArray
	 * @returns {array}
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
	 * @param {boolean} isDataArray
	 * @returns {function}
	 */
	getCallBack(settings, ele, data, string, isDataArray)
	{
		/**
		 * This will check if we have an override callBack that
		 * will be used instead of the default callBack.
		 */
		const overrideCallBack = settings.callBack;
		if (typeof overrideCallBack === 'function')
		{
			const props = string.match(WATCHER_PATTERN) || [];
			const isMultiProp = (props && props.length > 1);

			return (value, committer) =>
			{
				/**
				 * This will get the watcher values to pass to the callBack.
				 */
				value = (isMultiProp !== true)? value : this.getPropValues(data, props, isDataArray);
				overrideCallBack(value, ele, committer);
			};
		}

		/**
		 * This will get the attribute to update.
		 * If no attribute is set, we will default to textContent.
		 */
		const attr = settings.attr || 'textContent';
		return this._getWatcherCallBack(ele, data, string, attr, isDataArray);
	},

	/**
	 * This will add a data watcher.
	 *
	 * @private
	 * @param {object} ele
	 * @param {(string|object)} settings
	 * @param {object} parent
	 * @returns {void}
	 */
	addDataWatcher(ele, settings, parent)
	{
		const value = this.getValue(settings, parent),

		/**
		 * This will check if the data is set in the watcher value array.
		 * If not, we will use the parent data.
		 */
		data = value[1] ?? parent?.data ?? parent?.context?.data ?? parent?.state ?? null;
		if (!data)
		{
			return;
		}

		const string = value[0],

		/**
		 * This will check if we are watching multiple data objects.
		 */
		isDataArray = Array.isArray(data);

		/**
		 * Thi swill set up the watcher callBack.
		 *
		 * @type {function} callBack
		 */
		const callBack = this.getCallBack(settings, ele, data, string, isDataArray),

		/**
		 * This will get the props to watch.
		 *
		 * @type {array} props
		 */
		props = this._getWatcherProps(string);

		/**
		 * This will add the watcher for each prop.
		 */
		for (var i = 0, length = props.length; i < length; i++)
		{
			/**
			 * This will set the coreect data object for the watcher
			 * based on the isDataArray flag.
			 */
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
	 * @returns {void}
	 */
	setup(ele, settings, parent)
	{
		if (!settings)
		{
			return;
		}

		if (Array.isArray(settings))
		{
			const value = [settings[0], settings[1]];

			/**
			 * This will check if we are supporting the new watcher format
			 * with callback function or the old format with attr.
			 */
			const lastItem = settings[2];
			if (typeof lastItem === 'function')
			{
				/**
				 * This will setup a watcher with a callBack.
				 */
				settings = {
					value,
					callBack: lastItem
				};
			}
			else
			{
				/**
				 * This will setup a watcher with an attr.
				 */
				settings = {
					attr: lastItem,
					value: [settings[0], settings[1]]
				};
			}
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
	 * @returns {void}
	 */
	addWatcher(ele, data, prop, callBack)
	{
		dataBinder.watch(ele, data, prop, callBack);
	}
};