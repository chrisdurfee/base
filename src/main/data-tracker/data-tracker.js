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
     * @member {Map} trackers This is an object that stores all tracker
     * objects by tracking id.
     */
    static trackers = new Map();

    /**
     * @private
     * @static
     * @member {number} trackingCount
     */
    static trackingCount = 0;

    /**
     * This will add a new type to the data tracker.
     *
     * @public
     * @param {string} type The new type.
     * @param {function} callBack The callBack to help clean
     * up data when removed.
     * @return {void}
     */
    static addType(type, callBack)
    {
        TrackerTypes.add(type, callBack);
    }

    /**
     * This will remove a type from the data tracker.
     *
     * @param {string} type
     * @return {void}
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
     * @return {void}
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
        const tracker = this.trackers.get(id);
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
        if (!this.trackers.has(id))
        {
            this.trackers.set(id, new Tracker());
        }
        return this.trackers.get(id);
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

		return (obj.size === 0);
	}

    /**
     * This will remove a type or all data for an object if
     * no type is set.
     *
     * @param {object} obj
     * @param {string} [type]
     * @return {void}
     */
    static remove(obj, type)
    {
        const id = obj.trackingId;
        if (!id || !this.trackers.has(id))
        {
            return;
        }

        const tracker = this.trackers.get(id);

        /**
         * if no type is set then remove the whole tracker.
         */
        if (!type)
        {
            tracker.remove();
            this.trackers.delete(id);
            return;
        }

        tracker.remove(type);

        /**
         * if the tracker is empty then remove the tracker.
         */
        if (this.isEmpty(tracker.types))
        {
            this.trackers.delete(id);
        }
    }
}