import { dataBinder } from '../../data-binder/data-binder.js';
import { BasicData, createEventMessage } from './basic-data.js';

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
	 * @protected
	 * @param {string} attr
	 * @param {*} val
	 * @param {*} committer
	 * @param {string} event
	 * @returns {void}
	 */
	_publish(attr, val, committer, event)
	{
		const message = createEventMessage(attr, event);
		this.eventSub.publish(message, val, committer);

		/**
		 * This will set the committer to the current object if it is not set.
		 * This is deferred until the local event is published.
		 */
		committer = committer || this;
		dataBinder.publish(this._dataId + attr, val, committer);
	}
}