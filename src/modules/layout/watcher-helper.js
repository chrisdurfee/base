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
	 */
	isWatching(value)
	{
		/**
		 * This will check if we are watching using an array.
		 * Inlines the hasParams check to avoid a redundant typeof
		 * on the first element.
		 */
		if (Array.isArray(value))
		{
			const first = value[0];
			return typeof first === 'string' && first.includes('[[');
		}

		/**
		 * This will check if we are watching using a string.
		 */
		// @ts-ignore
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
		return typeof string === 'string' && string.includes('[[');
	},

	/**
	 * This will get the property names to be watched.
	 *
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
				// @ts-ignore
				ele.textContent = value;
				break;
			case 'disabled':
				// @ts-ignore
				ele.disabled = (!value);
				break;
			case 'checked':
				// @ts-ignore
				ele.checked = (Boolean(value) !== false);
				break;
			case 'required':
				// @ts-ignore
				ele.required = (Boolean(value) !== false);
				break;
			case 'src':
				/* tagName is always uppercase in HTML documents —
				 * compare directly to avoid allocating a lowercase string. */
				// @ts-ignore
				if (ele.tagName === 'IMG')
				{
					// @ts-ignore
					ele.src = (value && (value.indexOf('.') !== -1 || value.indexOf('blob:') !== -1))? value : '';
					break;
				}
				// @ts-ignore
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
		/* Use named parameters instead of `arguments` so V8 can optimise
		 * the inner function — `arguments` forces an allocation every call. */
		return string.replace(WATCHER_PATTERN, function(match, _group1, key)
		{
			const watcherData = (isArray)? data[count] : data;
			count++;
			const result = watcherData.get(key);
			return (result != null ? result : '');
		});
	},

	/**
	 * This will get a watcher callBack.
	 *
	 * @param {object} ele
	 * @param {string|Array<any>} data
	 * @param {string} string
	 * @param {string} attr
	 * @param {boolean} isArray
	 * @returns {function}
	 */
	_getWatcherCallBack(ele, data, string, attr, isArray)
	{
		/**
		 * Fast path: the string is a single watcher param with no
		 * static text (e.g. '[[count]]'), which is the most common
		 * watcher form. This skips the per-update regex replace and
		 * reads the value directly. String() preserves the exact
		 * coercion semantics of String.prototype.replace.
		 */
		// @ts-ignore
		const props = this._getWatcherProps(string);
		if (props && props.length === 1 && string.length === props[0].length + 4)
		{
			const key = props[0];
			const watcherData = (isArray)? data[0] : data;
			return () =>
			{
				const result = watcherData.get(key);
				// @ts-ignore
				this.updateAttr(ele, attr, (result != null)? String(result) : '');
			};
		}

		return () =>
		{
			// @ts-ignore
			let value = this.replaceParams(string, data, isArray);
			// @ts-ignore
			this.updateAttr(ele, attr, value);
		};
	},

	/**
	 * This will get a watcher value.
	 *
	 * @param {string|object} settings
	 * @param {object} parent
	 * @returns {Array<any>}
	 */
	getValue(settings, parent)
	{
		// @ts-ignore
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
		// @ts-ignore
		const attr = settings.attr || 'textContent';

		/**
		 * This will check if we have an override callBack that
		 * will be used instead of the default callBack.
		 */
		// @ts-ignore
		const overrideCallBack = settings.callBack;
		if (typeof overrideCallBack === 'function')
		{
			// @ts-ignore
			const watcherProps = props || this._getWatcherProps(string) || [];
			const isMultiProp = (watcherProps.length > 1);

			return (value, committer) =>
			{
				/**
				 * This will get the watcher values to pass to the callBack.
				 */
				// @ts-ignore
				value = (isMultiProp !== true)? value : this.getPropValues(data, watcherProps, isDataArray);
				const result = overrideCallBack(value, ele, committer);
				if (typeof result !== 'undefined')
				{
					// @ts-ignore
					this.updateAttr(ele, attr, result);
				}
			};
		}

		// @ts-ignore
		return this._getWatcherCallBack(ele, data, string, attr, isDataArray);
	},

	/**
	 * This will add a data watcher.
	 *
	 * @param {object} ele
	 * @param {string|object} settings
	 * @param {object} parent
	 * @returns {void}
	 */
	addDataWatcher(ele, settings, parent)
	{
		// @ts-ignore
		const value = this.getValue(settings, parent),

		/**
		 * This will check if the data is set in the watcher value array.
		 * If not, we will use the parent data.
		 */
		// @ts-ignore
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
		// @ts-ignore
		const props = this._getWatcherProps(string);
		// @ts-ignore
		const callBack = this.getCallBack(settings, ele, data, string, isDataArray, props);

		/**
		 * This will add the watcher for each prop.
		 */
		if (!isDataArray)
		{
			/* Multi-prop watchers (e.g. '[[a]] - [[b]]') collapse into
			 * a single OneWayConnection/OneWaySource via watchMany.
			 * Single-prop case still uses watch() for identical
			 * guard semantics. */
			if (props.length > 1)
			{
				dataBinder.watchMany(ele, data, props, callBack);
			}
			else
			{
				// @ts-ignore
				this.addWatcher(ele, data, props[0], callBack);
			}
		}
		else
		{
			for (let i = 0, length = props.length; i < length; i++)
			{
				// @ts-ignore
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

		// @ts-ignore
		this.addDataWatcher(
			ele,
			// @ts-ignore
			this.getWatcherSettings(settings),
			parent
		);
	},

	/**
	 * This will add a watcher.
	 *
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