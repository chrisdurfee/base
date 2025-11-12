import { Objects } from '../../../../shared/objects.js';
import { dataBinder } from '../../../data-binder/data-binder.js';
import { BasicData, EVENT } from '../basic-data.js';
import { PropertyHelper } from './property-helper.js';
import { Publisher } from './publisher.js';

/**
 * Data
 *
 * This will create a new data object that can be used to
 * bind elements to values.
 *
 * @class
 * @augments BasicData
 */
export class Data extends BasicData
{
	/**
	 * This will setup the stage and attributes object.
	 *
	 * @protected
	 * @returns {void}
	 */
	setup()
	{
		this.attributes = {};
		this.stage = {};
	}

	/**
	 * This will set the attribute value.
	 *
	 * @override
	 * @protected
	 * @param {string} attr
	 * @param {*} val
	 * @param {object} committer
	 * @param {boolean} stopMerge
	 * @returns {void}
	 */
	_setAttr(attr, val, committer, stopMerge)
	{
		if (typeof val !== 'object' && val === this.get(attr))
		{
			return;
		}

		/* this will check to update the model based on who
		updated it. if the data binder updated the data only
		the stage data is updated */
		if (!committer && stopMerge !== true)
		{
			/* this will update the attribute data because
			it was updated outside the data binder */
			PropertyHelper.set(this.attributes, attr, val);
		}
		else
		{
			if (this.dirty === false)
			{
				this.dirty = true;
			}
		}

		PropertyHelper.set(this.stage, attr, val);

		/* this will publish the data to the data binder
		to update any ui elements that are subscribed */
		committer = committer || this;
		this._publish(attr, val, committer, EVENT.CHANGE);
	}

	/**
	 * This will link a data attr object to another data object.
	 *
	 * @param {object} data
	 * @param {string} attr
	 * @returns {void}
	 */
	linkAttr(data, attr)
	{
		const value = data.get(attr);
		if (!value)
		{
			return;
		}

		for (var prop in value)
		{
			if (Object.prototype.hasOwnProperty.call(value, prop))
			{
				this.link(data, attr + '.' + prop, prop);
			}
		}
	}

	/**
	 * This will create a new data source by scoping the parent
	 * data attr and linking the two sources.
	 *
	 * @param {string} attr
	 * @param {object} [constructor]
	 * @returns {object}
	 */
	scope(attr, constructor)
	{
		const value = this.get(attr);
		if (!value)
		{
			return false;
		}

		constructor = constructor || this.constructor;
		const data = new constructor(value);

		/* this will link the new data to the parent attr */
		data.linkAttr(this, attr);
		return data;
	}

	/**
	 * This will splice a value from an array and set
	 * the result.
	 *
	 * @param {string} attr
	 * @param {number} index
	 * @returns {object} this
	 */
	splice(attr, index)
	{
		this.delete(attr + '[' + index + ']');
		this.refresh(attr);

		return this;
	}

	/**
	 * This will add a value to an array and set the result.
	 *
	 * @param {string} attr
	 * @param {*} value
	 * @returns {object} this
	 */
	push(attr, value)
	{
		let currentValue = this.get(attr);
		if (Array.isArray(currentValue) === false)
		{
			currentValue = [];
		}

		currentValue.push(value);
		this.set(attr, currentValue);
		return this;
	}

	/**
	 * This will concatenate values to an array and set the result.
	 *
	 * @param {string} attr
	 * @param {array} values
	 * @returns {object} this
	 */
	concat(attr, values)
	{
		let currentValue = this.get(attr);
		if (Array.isArray(currentValue) === false)
		{
			currentValue = [];
		}

		currentValue = currentValue.concat(values);
		this.set(attr, currentValue);
		return this;
	}

	/**
	 * This will add a value to an array and set the result.
	 *
	 * @param {string} attr
	 * @param {*} value
	 * @returns {object} this
	 */
	unshift(attr, value)
	{
		let currentValue = this.get(attr);
		if (Array.isArray(currentValue) === false)
		{
			currentValue = [];
		}

		currentValue.unshift(value);
		this.set(attr, currentValue);
		return this;
	}

	/**
	 * This will add a value to an array and set the result.
	 *
	 * @param {string} attr
	 * @returns {*}
	 */
	shift(attr)
	{
		let currentValue = this.get(attr);
		if (Array.isArray(currentValue) === false)
		{
			return null;
		}

		const value = currentValue.shift();
		this.set(attr, currentValue);
		return value;
	}

	/**
	 * This will get the index of the value in the array.
	 *
	 * @param {string} attr
	 * @param {*} key
	 * @param {*} value
	 * @returns {number}
	 */
	getIndex(attr, key, value)
	{
		let currentValue = this.get(attr);
		if (Array.isArray(currentValue) === false)
		{
			return -1;
		}

		const firstItem = currentValue[0];
		if (typeof firstItem !== 'object')
		{
			return currentValue.indexOf(key);
		}

		return currentValue.findIndex((item) => item[key] === value);
	}

	/**
	 * This will pop the last value from an array and set the result.
	 *
	 * @param {string} attr
	 * @returns {*}
	 */
	pop(attr)
	{
		let currentValue = this.get(attr);
		if (Array.isArray(currentValue) === false)
		{
			return null;
		}

		const value = currentValue.pop();
		this.set(attr, currentValue);
		return value;
	}

	/**
	 * This will refresh the value.
	 *
	 * @param {string} attr
	 * @returns {object} this
	 */
	refresh(attr)
	{
		this.set(attr, this.get(attr));

		return this;
	}

	/**
	 * This will publish an update to the data binder.
	 *
	 * @protected
	 * @param {string} attr
	 * @param {*} val
	 * @param {*} committer
	 * @param {string} event
	 * @returns {void}
	 */
	_publish(attr, val, committer, event)
	{
		const callBack = (path, obj) => this._publishAttr(path, obj, committer, event);
		Publisher.publish(attr, val, callBack);
	}

	/**
	 * This will publish an update on an attribute.
	 *
	 * @protected
	 * @param {string} subPath
	 * @param {*} val
	 * @param {object} committer
	 * @param {string} event
	 * @returns {void}
	 */
	_publishAttr(subPath, val, committer, event)
	{
		/**
		 * This will publish the data to the data binder
		 * to update any subscribers.
		 */
		const path = this._dataId + subPath;
		dataBinder.publish(path, val, committer);

		/**
		 * This will publish to the local subscribers.
		 */
		this.publishLocalEvent(subPath, val, committer, event);
	}

	/**
	 * This will merge the attribute with the stage.
	 *
	 * @protected
	 * @returns {void}
	 */
	mergeStage()
	{
		/* this will clone the stage object to the
		attribute object */
		this.attributes = Objects.clone(this.stage);
		this.dirty = false;
	}

	/**
	 * This will get the model data.
	 *
	 * @returns {object}
	 */
	getModelData()
	{
		this.mergeStage();
		return this.attributes;
	}

	/**
	 * This will revert the stage back to the previous attributes.
	 *
	 * @returns {void}
	 */
	revert()
	{
		/* this will reset the stage to the previous
		attributes */
		this.set(this.attributes);
		this.dirty = false;
	}

	/**
	 * This will delete an attribute.
	 *
	 * @protected
	 * @param {object|string} obj
	 * @param {string} attr
	 * @param {object} committer
	 * @returns {void}
	 */
	_deleteAttr(obj, attr, committer = this)
	{
		PropertyHelper.delete(obj, attr);

		/**
		 * This will only publish the delete event to the
		 * local subscribers.
		 */
		const callBack = (path, obj) => this.publishLocalEvent(path, obj, committer, EVENT.DELETE);
		Publisher.publish(attr, attr, callBack);
	}

	/**
	 * This will get the value of an attribute.
	 *
	 * @protected
	 * @param {object} obj
	 * @param {string} attr
	 * @returns {*}
	 */
	_getAttr(obj, attr)
	{
		return PropertyHelper.get(obj, attr);
	}
}