/**
 * TrackerTypes
 *
 * This will add and remove tracker types to the data tracker.
 *
 */
export const TrackerTypes =
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
     * @return {void}
     */
    add(type, callBack)
    {
        this.types[type] = callBack;
    },

    /**
     * This will get a type or return false.
     * @param {string} type
     * @return {(function|boolean)} The callBack or false.
     * @return {mixed}
     */
    get(type)
    {
        return this.types[type] || false;
    },

    /**
     * This will remove a type.
     * @param {string} type
     * @return {void}
     */
    remove(type)
    {
        delete this.types[type];
    }
};