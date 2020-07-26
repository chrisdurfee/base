import {BasicData} from './basic-data.js';
import {dataBinder} from '../data-binder/data-binder.js';

/**
 * SimpleData
 *
 * This will extend Data to add a simple data object
 * that doesn't allow deep nested data.
 * @class
 * @augments BasicData
 */
export class SimpleData extends BasicData
{
	/**
	 * This will publish an update to the data binder.
	 *
	 * @override
	 * @protected
	 * @param {string} attr
	 * @param {*} val
	 * @param {*} committer
	 * @param {*} prevValue
	 */
	_publish(attr, val, committer, prevValue)
	{
		let message = attr + ':change';
		this.eventSub.publish(message, val, prevValue, committer);

		committer = committer || this;

		dataBinder.publish(this._dataId + attr, val, committer);
	}
}