import { dataBinder } from '../data-binder/data-binder.js';
import { BasicData } from './basic-data.js';

/**
 * SimpleData
 *
 * This will extend Data to add a simple data object
 * that doesn't allow deep nested data.
 *
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
	 * @param {mixed} val
	 * @param {mixed} committer
	 * @param {mixed} prevValue
	 * @return {void}
	 */
	_publish(attr, val, committer, prevValue)
	{
		const message = attr + ':change';
		this.eventSub.publish(message, val, committer);

		committer = committer || this;

		dataBinder.publish(this._dataId + attr, val, committer);
	}
}