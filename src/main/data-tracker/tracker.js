import { TrackerTypes } from './tracker-types.js';

/**
 * Tracker
 *
 * This will create a tracker for an object that will
 * store each type added and the data stored to
 * each type.
 *
 * @class
 */
export class Tracker
{
	/**
	 * This will create a new tracker.
	 *
	 * @constructor
	 */
	constructor()
	{
		/**
		 * @type {Map} types
		 */
		this.types = new Map();
	}

	/**
	 * This will add data to a type.
	 *
	 * @public
	 * @param {string} addingType The type of data.
	 * @param {*} data The data to store
	 * @returns {void}
	 */
	add(addingType, data)
	{
		if (!this.types.has(addingType))
		{
			this.types.set(addingType, []);
		}
		this.types.get(addingType).push(data);
	}

	/**
	 * This will get all the data stored to a data type.
	 * @param {string} type
	 * @returns {*} the data or false.
	 */
	get(type)
	{
		return this.types.get(type) || false;
	}

	/**
	 * This will check if a type exists.
	 * @param {*} type
	 * @returns {boolean}
	 */
	has(type)
	{
		return this.types.has(type);
	}

	/**
	 * This will call the callBack with the data.
	 *
	 * @private
	 * @param {function} callBack
	 * @param {*} data
	 * @returns {void}
	 */
	removeByCallBack(callBack, data)
	{
		if (typeof callBack === 'function')
		{
			callBack(data);
		}
	}

	/**
	 * This will remove the data by type.
	 *
	 * @private
	 * @param {string} removingType
	 * @returns {void}
	 */
	removeType(removingType)
	{
		if (!this.types.has(removingType))
		{
			return;
		}

		const typeData = this.types.get(removingType);
		if (!typeData.length)
		{
			return;
		}

		let data,
		callBack = TrackerTypes.get(removingType);
		if (!callBack)
		{
			return;
		}

		for (var i = 0, length = typeData.length; i < length; i++)
		{
			data = typeData[i];
			if (!data)
			{
				continue;
			}

			// this will stop any circular referrences
			typeData[i] = null;

			this.removeByCallBack(callBack, data);
		}
		this.types.delete(removingType);
	}

	/**
	 * This will remove the data by type or all if no type is
	 * set.
	 *
	 * @public
	 * @param {string} [type]
	 * @returns {void}
	 */
	remove(type)
	{
		if (type)
		{
			this.removeType(type);
			return;
		}

		this.types.forEach((value, typeKey) =>
		{
			if (!typeKey)
			{
				return;
			}

			this.removeType(typeKey);
		});

		this.types.clear();
	}
}