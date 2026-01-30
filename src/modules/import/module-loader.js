/**
 * ModuleLoader
 *
 * This will load a module from a source.
 *
 * @class
 */
export class ModuleLoader
{
	/**
	 * Loads a module from a source.
	 *
	 * @param {Promise} modulePromise
	 * @param {function} callback
	 * @returns {Promise}
	 */
	static load(modulePromise, callback)
	{
		return modulePromise.then(module =>
		{
			if (callback)
			{
				callback(module);
			}
			return module;
		})
		.catch(error =>
		{
			console.error('Error loading module:', error);
		});
	}
}