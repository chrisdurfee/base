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

		let data;
		const value = localStorage.getItem(key);
		if (value === null)
		{
			if (defaultValue)
			{
				data = defaultValue;
			}
		}
		else
		{
			data = JSON.parse(value);
		}

		return data;
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

		const value = JSON.stringify(data);
		localStorage.setItem(key, value);
		return true;
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