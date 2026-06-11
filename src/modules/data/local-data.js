/**
 * LocalData
 *
 * This will help manage the local data.
 *
 * @class
 */
export class LocalData
{
	/**
	 * This will restore the data from local storage.
	 *
	 * @static
	 * @param {string} key
	 * @param {*} defaultValue
	 * @returns {*}
	 */
	static resume(key, defaultValue)
	{
		if (!key)
		{
			return null;
		}

		const value = localStorage.getItem(key);
		if (value === null)
		{
			return (defaultValue !== undefined)? defaultValue : undefined;
		}

		try
		{
			const parsed = JSON.parse(value);
			return (parsed === null && defaultValue !== undefined)? defaultValue : parsed;
		}
		catch (error)
		{
			console.warn('[LocalData] Failed to parse stored value for key "' + key + '". Removing corrupted entry.', error);
			localStorage.removeItem(key);
			return (defaultValue !== undefined)? defaultValue : undefined;
		}
	}

	/**
	 * This will store the data to the local stoage under
	 * the storage key.
	 *
	 * @static
	 * @param {string} key
	 * @param {*} data
	 * @returns {boolean}
	 */
	static store(key, data)
	{
		if (!key)
		{
			return false;
		}

		if (!data)
		{
			return false;
		}

		try
		{
			const value = JSON.stringify(data);
			localStorage.setItem(key, value);
			return true;
		}
		catch (error)
		{
			console.error('[LocalData] Failed to store data for key "' + key + '".', error);
			return false;
		}
	}

	/**
	 * This will remove the data from the local storage.
	 *
	 * @static
	 * @param {string} key
	 * @returns {boolean}
	 */
	static remove(key)
	{
		if (!key)
		{
			return false;
		}

		localStorage.removeItem(key);
		return true;
	}
}