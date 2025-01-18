import { Types } from '../../../../shared/types.js';
import { Data } from '../deep-data/deep-data.js';
import { setupAttrSettings } from './attrs.js';
import { ModelService } from './model-service.js';

/**
 * Gets the default attributes from the given settings object.
 *
 * @function setupDefaultAttr
 * @param {object} settings - An object which may contain a `defaults` property.
 * @param {object} [settings.defaults] - A set of default attributes, where each property is a key-value pair for attributes.
 * @returns {object} A shallow copy of the `defaults` object if it exists, otherwise an empty object.
 */
const setupDefaultAttr = (settings) =>
{
	const attributes = {};
	if (!Types.isObject(settings) || !settings.defaults)
	{
		return attributes;
	}

	const { defaults } = settings;
	Object.keys(defaults).forEach(prop =>
	{
		const attr = defaults[prop];
		if (typeof attr !== 'function')
		{
			attributes[prop] = attr;
		}
	});

	delete settings.defaults;
	return attributes;
};

/**
 * Extracts the `xhr` configuration from the given settings object.
 *
 * @function getXhr
 * @param {object} settings - The settings object that may contain `xhr` config.
 * @param {object} [settings.xhr] - An object containing properties to configure an XHR or remote request.
 * @returns {object} A shallow copy of `settings.xhr` if it exists, otherwise an empty object.
 */
const getXhr = (settings) =>
{
	if (!settings || typeof settings.xhr !== 'object')
	{
		return {};
	}

	const xhr = { ...settings.xhr };
	delete settings.xhr;
	return xhr;
};

/**
 * Tracks the incremental number of model types created.
 *
 * @type {number}
 * @default 0
 */
let modelTypeNumber = 0;

/**
 * The Model class extends Data to provide structure
 * for connecting to a remote service.
 *
 * @class Model
 * @extends Data
 */
export class Model extends Data
{
	/**
	 * Creates a new Model instance.
	 *
	 * @constructor
	 * @param {object} [settings] - Optional configuration for the model.
	 */
	constructor(settings)
	{
		const proxy = super(settings);
		this.initialize();

		// @ts-ignore (returning the proxy for Data's built-in behavior)
		return proxy;
	}

	/**
	 * Sets up initial properties for this model instance.
	 *
	 * @protected
	 * @returns {void}
	 */
	setup()
	{
		this.attributes = {};
		this.stage = {};
		this.url = null;
		this.xhr = null;
	}

	/**
	 * Called after the model is constructed to allow
	 * additional initialization logic.
	 *
	 * @protected
	 * @returns {void}
	 */
	initialize()
	{
		// ...
	}

	/**
	 * Creates a new subclass of the current Model and returns its constructor.
	 *
	 * @static
	 * @param {object} [settings={}] - Configuration for the extended model.
	 * @returns {typeof Model} The extended model class (subclass of Model).
	 */
	static extend(settings = {})
	{
		const parent = this;
		const xhr = getXhr(settings);
		const service = parent.prototype.service.extend(xhr);
		const defaultAttributes = setupDefaultAttr(settings);

		class ExtendedModel extends parent
		{
			/**
			 * Creates a new ExtendedModel instance.
			 *
			 * @constructor
			 * @param {object} [instanceSettings] - Instance-specific attribute settings.
			 */
			constructor(instanceSettings)
			{
				const instanceAttr = {
					...defaultAttributes,
					...setupAttrSettings(instanceSettings)
				};
				super(instanceAttr);

				this.xhr = new service(this);
			}

			/**
			 * A unique identifier for this model type.
			 *
			 * @type {string}
			 */
			dataTypeId = `bm${modelTypeNumber++}`;
		}

		Object.assign(ExtendedModel.prototype, settings);
		ExtendedModel.prototype.service = service;

		return ExtendedModel;
	}
}

Model.prototype.service = ModelService;