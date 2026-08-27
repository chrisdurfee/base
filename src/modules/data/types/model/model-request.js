/**
 * The handler a model service sends its requests through.
 *
 * A static import of `Ajax` here would make the whole XHR stack reachable
 * from `Data`, because the data barrel exports `Model`. The handler is
 * injected instead: the ajax module registers itself when imported, so the
 * package root and the "ajax" subpath wire this up on their own.
 *
 * @type {function|null}
 */
let requestHandler = null;

/**
 * This will set the handler model services send requests through.
 *
 * @param {function|null} handler Receives the request settings object and
 * returns the request.
 * @returns {void}
 */
export const setModelRequestHandler = (handler) =>
{
	requestHandler = handler;
};

/**
 * This will send a model service request.
 *
 * @param {object} settings
 * @returns {*} Whatever the registered handler returns.
 * @throws {Error} When no handler has been registered.
 */
export const sendModelRequest = (settings) =>
{
	if (requestHandler === null)
	{
		throw new Error('No model request handler.');
	}

	return requestHandler(settings);
};
