import { base } from '../../main/base.js';
import { Objects } from '../../shared/objects.js';
import { XhrDefaultSettings } from './xhr-default-settings.js';

/**
 * This will add ajax settings and methods to the base class.
 */
export const setupBaseAjaxMethods = () =>
{
	/* this will add ajax settings to the base class */
	base.augment(
	{
		/**
		 * @type {object} xhrSettings
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
			if (typeof settingsObj === 'object')
			{
				// @ts-ignore
				this.xhrSettings = Objects.extendClass(base.xhrSettings, settingsObj);
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
};
