import { TrackerTypes } from './tracker-types.js';
import { Tracker } from './tracker.js';

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
     * @static
     * @member trackers This is an object that stores all tracker
     * objects by tracking id.
     */
    static trackers = {};

    /**
     * @private
     * @static
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
        return obj.trackingId || (obj.trackingId = `dt${this.trackingCount++}`);
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
        return this.trackers[id] || (this.trackers[id] = new Tracker());
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

		return (Object.keys(obj).length === 0);
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