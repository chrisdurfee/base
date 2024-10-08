/**
 * TrackerTypes
 *
 * This will add and remove tracker types to the data tracker.
 *
 * @type {object} TrackerTypes
 *
 */
export const TrackerTypes =
{
    /**
     * @member {object} types The Type and callBack that is called
     * when the type is removed from the object.
     */
    types: {},

    /**
     * This will add a type.
     *
     * @param {string} type
     * @param {function} callBack The function to call when an object
     * is having the type removed.
     * @returns {void}
     */
    add(type, callBack)
    {
        this.types[type] = callBack;
    },

    /**
     * This will get a type or return false.
     *
     * @param {string} type
     * @returns {(Function|false)} The callBack or false.
     */
    get(type)
    {
        return this.types[type] || false;
    },

    /**
     * This will remove a type.
     *
     * @param {string} type
     * @returns {void}
     */
    remove(type)
    {
        delete this.types[type];
    }
};