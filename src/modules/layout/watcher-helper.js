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
 * Module-level cache for parsed watcher prop arrays.
 * The same watcher string (e.g. '[[count]]') across many elements is parsed once.
 *
 * @type {Map<string, Array<string>|null>}
 */
const _watcherPropsCache = new Map();

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
	 * @returns {Array<string>|null}
	 */
	_getWatcherProps(string)
	{
		const cached = _watcherPropsCache.get(string);
		if (cached !== undefined)
		{
			return cached;
		}

		const matches = string.match(WATCHER_PATTERN);
		const result = matches ? matches.map(match => match.slice(2, -2)) : null;
		_watcherPropsCache.set(string, result);
		return result;
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
			case 'disabled':
				ele.disabled = (!value);
				break;
			case 'checked':
				ele.checked = (Boolean(value) !== false);
				break;
			case 'required':
				ele.required = (Boolean(value) !== false);
				break;
			case 'src':
				if (ele.tagName.toLowerCase() === 'img')
				{
					ele.src = (value && (value.indexOf('.') !== -1 || value.indexOf('blob:') !== -1))? value : '';
					break;
				}
				ele.src = value;
				break;
			default:
				HtmlHelper.addAttr(ele, attr, value);
				break;
		}
	},

	/**
	 * This will replace the params in a string with the data values.
	 *
	 * @param {string} string
	 * @param {object} data
	 * @param {boolean} isArray
	 * @returns {string}
	 */
	replaceParams(string, data, isArray = false)
	{
		let count = 0;
		return string.replace(WATCHER_PATTERN, function()
		{
			const watcherData = (isArray)? data[count] : data;
			count++;

			const result = watcherData.get(arguments[2]);
			return ((typeof result !== 'undefined' && result !== null)? result : '');
		});
	},

	/**
	 * This will get a watcher callBack.
	 *
	 * @protected
	 * @param {object} ele
	 * @param {string|Array<any>} data
	 * @param {string} string
	 * @param {string} attr
	 * @param {boolean} isArray
	 * @returns {function}
	 */
	_getWatcherCallBack(ele, data, string, attr, isArray)
	{
		return () =>
		{
			let value = this.replaceParams(string, data, isArray);
			this.updateAttr(ele, attr, value);
		};
	},

	/**
	 * This will get a watcher value.
	 *
	 * @private
	 * @param {string|object} settings
	 * @param {object} parent
	 * @returns {Array<any>}
	 */
	getValue(settings, parent)
	{
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
	 * @param {Array<any>} props
	 * @param {boolean} isArray
	 * @returns {Array<any>}
	 */
	getPropValues(data, props, isArray)
	{
		const values = [];

		for (let i = 0, length = props.length; i < length; i++)
		{
			const watcherData = (isArray)? data[i] : data;
			const value = watcherData.get(props[i]) ?? '';
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
	getCallBack(settings, ele, data, string, isDataArray, props)
	{
		/**
		 * This will get the attribute to update.
		 * If no attribute is set, we will default to textContent.
		 */
		const attr = settings.attr || 'textContent';

		/**
		 * This will check if we have an override callBack that
		 * will be used instead of the default callBack.
		 */
		const overrideCallBack = settings.callBack;
		if (typeof overrideCallBack === 'function')
		{
			const watcherProps = props || string.match(WATCHER_PATTERN) || [];
			const isMultiProp = (watcherProps.length > 1);

			return (value, committer) =>
			{
				/**
				 * This will get the watcher values to pass to the callBack.
				 */
				value = (isMultiProp !== true)? value : this.getPropValues(data, watcherProps, isDataArray);
				const result = overrideCallBack(value, ele, committer);
				if (typeof result !== 'undefined')
				{
					this.updateAttr(ele, attr, result);
				}
			};
		}

		return this._getWatcherCallBack(ele, data, string, attr, isDataArray);
	},

	/**
	 * This will add a data watcher.
	 *
	 * @private
	 * @param {object} ele
	 * @param {string|object} settings
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
		 * This will get the props to watch and set up the watcher callBack.
		 */
		const props = this._getWatcherProps(string);
		const callBack = this.getCallBack(settings, ele, data, string, isDataArray, props);

		/**
		 * This will add the watcher for each prop.
		 */
		if (!isDataArray)
		{
			for (let i = 0, length = props.length; i < length; i++)
			{
				this.addWatcher(ele, data, props[i], callBack);
			}
		}
		else
		{
			for (let i = 0, length = props.length; i < length; i++)
			{
				this.addWatcher(ele, data[i], props[i], callBack);
			}
		}
	},

	/**
	 * This will get the watcher array settings.
	 *
	 * @param {string|object|array} settings
	 * @param {?string} [attribute=null]
	 * @returns {object}
	 */
	getWatcherSettings(settings, attribute = null)
	{
		/**
		 * Handle case where `watch` is a string (multi-property string updating).
		 */
		if (typeof settings === "string")
		{
			return { attr: attribute, value: settings };
		}

		if (Array.isArray(settings))
		{
			/**
			 * Handle shorthand syntax (array).
			 */
			let lastItem = settings[settings.length - 1];
			if (lastItem && typeof lastItem === "object")
			{
				lastItem = (attribute !== null) ? attribute : null;
			}

			/**
			 * This will set up the value based on length to support
			 * optional data and callback parameters.
			 */
			const value = (settings[1] && typeof settings[1] === 'object')
				? [settings[0], settings[1]] // `['[[id]]', data]`
				: [settings[0]]; // `['[[id]]'`

			return ((typeof lastItem === "function")
				? { attr: attribute, value, callBack: lastItem } // Callback format
				: { attr: lastItem || "textContent", value }); // Attribute format
		}

		return settings;
	},

	/**
	 * This will setup a data watcher.
	 *
	 * @param {object} ele
	 * @param {string|object} settings
	 * @param {object} parent
	 * @returns {void}
	 */
	setup(ele, settings, parent)
	{
		if (!settings)
		{
			return;
		}

		this.addDataWatcher(
			ele,
			this.getWatcherSettings(settings),
			parent
		);
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