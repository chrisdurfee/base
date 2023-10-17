/**
 * TrackerTypes
 *
 * This will add and remove tracker types to the data tracker.
 *
 */
const TrackerTypes =
{
    /**
     * @member {object} The Type and callBack that is called
     * when the type is removed from the object.
     */
    types: {},

    /**
     * This will add a type.
     * @param {string} type
     * @param {function} callBack The function to call when an object
     * is having the type removed.
     */
    add(type, callBack)
    {
        this.types[type] = callBack;
    },

    /**
     * This will get a type or return false.
     * @param {string} type
     * @return {(function|boolean)} The callBack or false.
     */
    get(type)
    {
        return this.types[type] || false;
    },

    /**
     * This will remove a type.
     * @param {string} type
     */
    remove(type)
    {
        delete this.types[type];
    }
};

/**
 * Tracker
 *
 * This will create a tracker for an object that will
 * store each type added and the data stored to
 * each type.
 *
 * @class
 */
class Tracker
{
    /**
     * @constructor
     */
    constructor()
    {
        /**
         * @member {object} types
         */
        this.types = {};
    }

    /**
     * This will add data to a type.
     *
     * @public
     * @param {string} addingType The type of data.
     * @param {*} data The data to store
     */
    add(addingType, data)
    {
        const type = this.types[addingType] || (this.types[addingType] = []);
        type.push(data);
    }

    /**
     * This will get all the data stored to a data type.
     * @param {string} type
     * @return {*|boolean} the data or false.
     */
    get(type)
    {
        return this.types[type] || false;
    }

    /**
     * This will call the callBack with the data.
     *
     * @private
     * @param {function} callBack
     * @param {*} data
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
     */
    removeType(removingType)
    {
        const types = this.types;
        if (!types)
        {
            return;
        }

        const type = types[removingType];
        if (!type.length)
        {
            return;
        }

        let data,
        callBack = TrackerTypes.get(removingType);
        for (var i = 0, length = type.length; i < length; i++)
        {
            data = type[i];
            if (!data)
            {
                continue;
            }

            // this will stop any circular referrences
            type[i] = null;

            this.removeByCallBack(callBack, data);
        }
        delete types[type];
    }

    /**
     * This will remove the data by type or all if no type is
     * set.
     *
     * @public
     * @param {string} [type]
     */
    remove(type)
    {
        if (type)
        {
            this.removeType(type);
        }
        else
        {
            const types = this.types;
            for (var prop in types)
            {
                if (types.hasOwnProperty(prop))
                {
                    type = types[prop];
                    if (!type)
                    {
                        continue;
                    }

                    this.removeType(prop);
                }
            }

            delete this.types;
        }
    }
}

/**
 * DataTracker
 *
 * This will add data tracking for objects. The DataTracker is
 * a single point where any data can be tracked to an object
 * or element. Modules can register types to store their own
 * data that can allow the data to be removed when the element
 * is removed.
 *
 * @class
 */
export class DataTracker
{
    /**
     * @private
     * @member trackers This is an object that stores all tracker
     * objects by tracking id.
     */
    static trackers = {};

    /**
     * @private
     * @member {int} trackingCount
     */
    static trackingCount = 0;

    /**
     * This will add a new type to the data tracker.
     *
     * @public
     * @param {string} type The new type.
     * @param {function} callBack The callBack to help clean
     * up data when removed.
     */
    static addType(type, callBack)
    {
        TrackerTypes.add(type, callBack);
    }

    /**
     * This will remove a type from the data tracker.
     * @param {string} type
     */
    static removeType(type)
    {
        TrackerTypes.remove(type);
    }

    /**
     * This will get the object tracking id or set it if
     * not set.
     *
     * @param {object} obj
     * @return {string}
     */
    static getTrackingId(obj)
    {
        return obj.trackingId || (obj.trackingId = 'dt' + this.trackingCount++);
    }

    /**
     * This will add data to an object.
     *
     * @param {object} obj
     * @param {string} type The type name.
     * @param {*} data The data to track.
     */
    static add(obj, type, data)
    {
        const id = this.getTrackingId(obj),
        tracker = this.find(id);

        tracker.add(type, data);
    }

    /**
     * This will get the data from a type or the tracker object
     * if type is not set.
     *
     * @param {object} obj
     * @param {string} [type]
     * @return {*}
     */
    static get(obj, type)
    {
        const id = obj.trackingId;
        const tracker = this.trackers[id];
        if (!tracker)
        {
            return false;
        }

        return (type)? tracker.get(type) : tracker;
    }

    /**
     * This will get the tracker or create a new tracker
     * if no tracker is set.
     *
     * @param {string} id
     * @return {object} The tracker.
     */
    static find(id)
    {
        const trackers = this.trackers;
        return (trackers[id] || (trackers[id] = new Tracker()));
    }

    /**
	 * This will check if an object is empty.
	 *
	 * @param {object} obj
	 * @return {boolean}
	 */
	static isEmpty(obj)
	{
		if (!obj || typeof obj !== 'object')
		{
			return true;
		}

		/* we want to loop through each property and
		check if it belongs to the object directly */
		for (var key in obj)
		{
			if (obj.hasOwnProperty(key))
			{
				return false;
			}
		}
		return true;
	}

    /**
     * This will remove a type or all data for an object if
     * no type is set.
     *
     * @param {object} obj
     * @param {stirng} [type]
     */
    static remove(obj, type)
    {
        const id = obj.trackingId;
        if (!id)
        {
            return true;
        }

        const tracker = this.trackers[id];
        if (!tracker)
        {
            return false;
        }

        if (type)
        {
            tracker.remove(type);

            /* this will remove the msg from the elements
            if no elements are listed under the msg */
            if (this.isEmpty(tracker.types))
            {
                delete this.trackers[id];
            }
        }
        else
        {
            tracker.remove();

            delete this.trackers[id];
        }
    }
}