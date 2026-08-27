/**
 * Shared helpers for the characterization suite.
 */

/**
 * This will wait until every pending publish batch has been delivered.
 *
 * DataPubSub batches publishes into a `queueMicrotask` flush, and a flush
 * can recursively schedule more work, so a full macrotask turn is used to
 * guarantee the whole cascade has settled.
 *
 * @returns {Promise<void>}
 */
export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * This will create a container element attached to the document body.
 *
 * Bindings created by the data binder rely on delegated document events,
 * so bound elements have to be inside the document.
 *
 * @returns {HTMLElement}
 */
export const createContainer = () =>
{
	const container = document.createElement('div');
	document.body.appendChild(container);
	return container;
};

/**
 * This will remove every child of the document body.
 *
 * @returns {void}
 */
export const resetBody = () =>
{
	document.body.innerHTML = '';
};

/**
 * This will count every live subscriber callback registered on a data
 * source's local (one way) event pub/sub.
 *
 * This is the leak metric used by the link / scope tests: a data source
 * that is re-rendered should return to a steady subscriber count instead
 * of accumulating one set of callbacks per render.
 *
 * @param {object} data
 * @returns {number}
 */
export const countSubscribers = (data) =>
{
	let count = 0;
	for (const subscribers of data.eventSub.callBacks.values())
	{
		count += subscribers.size;
	}
	return count;
};

/**
 * This will count the messages a data source has subscribers for.
 *
 * @param {object} data
 * @returns {number}
 */
export const countMessages = (data) => data.eventSub.callBacks.size;
