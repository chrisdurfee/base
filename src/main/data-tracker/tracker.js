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