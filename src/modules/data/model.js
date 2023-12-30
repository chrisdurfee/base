import { Types } from '../../shared/types.js';
import { setupAttrSettings } from './attrs.js';
import { Data } from './deep-data.js';
import { ModelService } from './model-service.js';

/**
 * This will get the defaults from the settings.
 *
 * @param {object} settings
 * @return {object}
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
 * This will get the xhr settings.
 *
 * @param {object} settings
 * @return {object}
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

/* this will track the number of model types */
let modelTypeNumber = 0;

/**
 * Model
 *
 * This will extend Data to add a model that can specify
 * a service that connects to a remote source.
 *
 * @class
 * @extends Data
 */
export class Model extends Data
{
	/**
	 * @member {object|null} xhr
	 */
	xhr = null;

	/**
	 * This will create a new model.
	 *
	 * @constructor
	 * @param {object} [settings]
	 */
	constructor(settings)
	{
		const proxy = super(settings);
		this.initialize();
		return proxy;
	}

	/**
	 * This adds a method to call if you want the model
	 * to do something when its initialized.
	 *
	 * @protected
	 * @return {void}
	 */
	initialize()
	{

	}

	/**
	 * This will extend the model to a child model.
	 *
	 * @param {object} [settings]
	 * @return {class}
	 */
	static extend(settings = {})
	{
		const parent = this,
		xhr = getXhr(settings),
		service = this.prototype.service.extend(xhr);

		/* this will setup the default attribute settings for
		the model */
		const defaultAttributes = setupDefaultAttr(settings);

		class ExtendedModel extends parent
		{
			constructor(instanceSettings)
			{
				/* this will get the instance attributes that
				the model will set as attribute data */
				const instanceAttr = {
                    ...defaultAttributes,
                    ...setupAttrSettings(instanceSettings)
                };

				super(instanceAttr);

				/* this will setup the model service and
				pass the new model instance to the service */
				this.xhr = new service(this);
			}

			dataTypeId = `bm${modelTypeNumber++}`;
		}

		Object.assign(ExtendedModel.prototype, settings);
		ExtendedModel.prototype.service = service;

		return ExtendedModel;
	}
}

Model.prototype.service = ModelService;