/**
 * Data subpath entry.
 *
 * Importing from '@base-framework/base/data' pulls in only the reactive data
 * types (Data, SimpleData, Model) instead of the whole framework.
 *
 * `Model`'s remote service resolves its transport through the model request
 * registry. Import '@base-framework/base/ajax' (or the package root) to get
 * the built-in XHR transport, or register your own with
 * `setModelRequestHandler`.
 */
export { Data, Model, SimpleData } from '../modules/data/data.js';
export { setModelRequestHandler } from '../modules/data/types/model/model-request.js';
